import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import JSON5 from 'https://esm.sh/json5@2.2.3'
import { jsonrepair } from 'https://esm.sh/jsonrepair@3.6.0'
import { generateAnalysisPrompt } from './prompt-utils.ts'
import { uploadFileToGoogleAI, generateContentGoogle, GoogleFileResult } from './utils.ts'

const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `
SEI UN ANALISTA ESPERTO DI GARE D'APPALTO (BID MANAGER).
L’obiettivo è analizzare i documenti di gara attraverso un approccio multi-modello, multi-sezione e a doppio livello di analisi.

1) Estrazione strutturata (structured):
- individuazione di dati oggettivi, elenchi, parametri.
- mapping semantico avanzato per riconoscere concetti equivalenti (es. “requisiti obbligatori” ↔ “requisiti mandatari”).

2) Analisi semantica (analysis):
- interpretazione dei rischi, ambiguità, criticità.
- valutazione qualitativa.

REGOLE OBBLIGATORIE:
- Lavora SOLO in italiano.
- Output ESCLUSIVAMENTE in JSON valido.
- Normalizza date (YYYY-MM-DD).
- Non inventare informazioni.
`;

Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
   }

   try {
      const body = await req.json();
      const { tenderId, filePaths, action, analysisPreferences, semanticPreferences, batchName, finalJson, partialRecordIds, modelUsed, prompt, saveToDb, structuredModel, semanticModel } = body;

      const supabaseClient = createClient(
         Deno.env.get('SUPABASE_URL') ?? '',
         Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");


      // --- HELPER: Native Analysis with Fallback ---
      const performAnalysisNative = async (primaryModelId: string, fallbackModelId: string, userPrompt: string, googleFiles: GoogleFileResult[]) => {
         console.log(`[Analysis] Starting Native with Primary: ${primaryModelId}`);

         const callAI = async (modelId: string) => {
            console.log(`[AI] Calling Google Native ${modelId}...`);
            // We append SYSTEM_PROMPT to userPrompt because native API 'systemInstruction' is optional/beta.
            // Concatenating is safer for now.
            const fullPrompt = SYSTEM_PROMPT + "\n\n" + userPrompt;
            return await generateContentGoogle(modelId, fullPrompt, googleFiles, geminiKey);
         };

         try {
            return await callAI(primaryModelId);
         } catch (primaryError: any) {
            console.warn(`[Primary] ${primaryModelId} Failed: ${primaryError.message}. Switching to Fallback: ${fallbackModelId}`);
            try {
               return await callAI(fallbackModelId);
            } catch (fallbackError: any) {
               throw new Error(`All models failed. Primary: ${primaryError.message} | Fallback: ${fallbackError.message}`);
            }
         }
      };

      // --- HELPER: Prepare Files for Google ---
      const prepareFilesForGoogle = async (paths: string[]): Promise<GoogleFileResult[]> => {
         const results: GoogleFileResult[] = [];
         console.log(`[GoogleAI] Preparing ${paths.length} files... Paths:`, JSON.stringify(paths));

         for (const path of paths) {
            console.log(`[GoogleAI] Downloading file from Storage: ${path}`);
            const { data, error } = await supabaseClient.storage.from('tenders').download(path);

            if (error) {
               console.error(`[GoogleAI] Download FAILED for ${path}:`, error);
               // Continue to try other files
               continue;
            }

            if (data) {
               // Must clone the blob to a File object for upload
               const arrayBuffer = await data.arrayBuffer();
               const fileName = path.split('/').pop() || 'doc.pdf';
               const mimeType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'text/plain';
               // Note: If checking for docx, verify MIME type support in Gemini.

               console.log(`[GoogleAI] Uploading to Gemini: ${fileName} (${data.size} bytes)`);
               try {
                  const fileObj = new File([arrayBuffer], fileName, { type: mimeType });
                  const result = await uploadFileToGoogleAI(fileObj, geminiKey);
                  console.log(`[GoogleAI] Upload Success: ${result.fileUri}`);
                  results.push(result);
               } catch (uploadError) {
                  console.error(`[GoogleAI] Upload to Gemini FAILED for ${fileName}:`, uploadError);
               }
            }
         }
         return results;
      };


      // --- ACTION: EXTRACT AND STORE (No-Op / Validation) ---
      if (action === 'extract_and_store') {
         // In Native Mode, specific extraction is NOT needed, but we acknowledge the step to keeping the UI happy.
         // We returns a dummy path or success.
         console.log("[Action] extract_and_store: Native Mode enabled. Skipping local extraction.");
         return new Response(JSON.stringify({ success: true, textStoragePath: "native_mode" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // --- ACTION: SAVE FINAL AND CLEANUP ---
      if (action === 'save_final_and_cleanup') {
         const { data: insertData, error: insertError } = await supabaseClient
            .from('analyses')
            .insert({ tender_id: tenderId, result_json: finalJson, model_used: modelUsed })
            .select().single();

         if (insertError) throw new Error("Failed to save final analysis: " + insertError.message);
         if (partialRecordIds?.length) await supabaseClient.from('analyses').delete().in('id', partialRecordIds);
         return new Response(JSON.stringify({ success: true, id: insertData.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // --- ACTION: ANALYZE (Native) ---
      if (action === 'analyze') {
         let resultJson = null;

         // User-defined Pipeline:
         // Structure/Parsing: Primary = gemini-2.5-flash (structuredModel), Fallback = gemini-3-pro-preview
         const primaryModel = structuredModel || 'gemini-2.5-flash';
         const fallbackModel = 'gemini-3-pro-preview';

         // 1. Upload Files to Google
         const googleFiles = await prepareFilesForGoogle(filePaths || []);
         if (googleFiles.length === 0) throw new Error("No files could be prepared for Google AI.");

         // 2. Generate Prompt
         const activePrompt = prompt || generateAnalysisPrompt(analysisPreferences, batchName || 'default', semanticPreferences);

         // 3. Perform Analysis
         const responseText = await performAnalysisNative(primaryModel, fallbackModel, activePrompt, googleFiles);

         // Clean Response (Gemini sometimes adds ```json ... ```)
         const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '');
         try {
            resultJson = JSON.parse(cleanText); // or use jsonrepair?
         } catch (e) {
            console.warn("JSON Parse failed, trying repair...");
            try {
               resultJson = JSON5.parse(jsonrepair(cleanText));
            } catch (e2) {
               console.error("Critical JSON Parse Error", cleanText);
               throw new Error("Failed to parse AI response.");
            }
         }

         // INJECT META & SAVE TO DB
         if (resultJson) {
            resultJson._batch_name = batchName;

            // DEBUG: Inject info
            resultJson._debug_info = {
               model_used: primaryModel, // We assume primary worked or fallback throw info
               mode: "GEMINI_NATIVE_FILE_API",
               file_count: googleFiles.length
            };

            if (saveToDb) {
               console.log("[Analysis] Saving result to DB for Polling...");
               const { error: dbError } = await supabaseClient
                  .from('analyses')
                  .insert({
                     tender_id: tenderId,
                     result_json: resultJson,
                     model_used: primaryModel
                  });
               if (dbError) {
                  console.error("[Analysis] DB Save Failed:", dbError);
               }
            }
         }

         return new Response(JSON.stringify(resultJson), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // --- ACTION: ASK QUESTION (Chatbot / Native) ---
      if (action === 'ask_question') {
         const { question, analysisContext, section } = body; // Get extra params
         const primaryModel = semanticModel || 'gemini-3-pro-preview';
         const fallbackModel = 'gemini-2.5-flash';

         let fullPrompt = `DOMANDA UTENTE: ${question}\n\n`;

         if (section) {
            fullPrompt += `CONTESTO SEZIONE: La domanda riguarda la sezione "${section}".\n`;
         }

         // INJECT ANALYSIS CONTEXT IF AVAILABLE
         if (analysisContext) {
            // Stringify and truncate if too huge (though Gemini Pro handles 1M+ tokens)
            // We strip unnecessary large fields like 'raw_text' if they exist, but here we likely have the JSON result.
            const contextString = JSON.stringify(analysisContext, null, 2);
            fullPrompt += `\nCONTESTO DATI ANALISI (JSON GIA ESTRATTO):
Ecco i dati che hai già estratto dai documenti. USALI come riferimento primario se la risposta è presente qui.
${contextString}
\n`;
         }

         fullPrompt += `\nISTRUZIONI: Rispondi alla domanda basandoti SUI DOCUMENTI FORNITI (File) e SUI DATI DI ANALISI sopra riportati.
         IMPORTANTE: RISPONDI ESCLUSIVAMENTE IN TESTO SEMPLICE (MARKDOWN). NON USARE JSON. NON RESTITUIRE STRUTTURE DATI COMPLESSE. SOLO TESTO LEGGIBILE.
         Se l'informazione è nel JSON, usala. Se no, cercala nei documenti allegati.
         Sii preciso e professionale. Rispondi in italiano.`;

         // Upload files if provided (Stateless/Reset per call)
         let googleFiles: GoogleFileResult[] = [];
         if (filePaths && filePaths.length > 0) {
            googleFiles = await prepareFilesForGoogle(filePaths);
         }

         // Use the helper, but pass our constructed prompt
         const responseText = await performAnalysisNative(primaryModel, fallbackModel, fullPrompt, googleFiles);

         return new Response(JSON.stringify({ answer: responseText }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

   } catch (error: any) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
   }
})
