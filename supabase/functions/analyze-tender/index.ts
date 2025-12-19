import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import JSON5 from 'https://esm.sh/json5@2.2.3'
import { jsonrepair } from 'https://esm.sh/jsonrepair@3.6.0'
import { generateAnalysisPrompt } from './prompt-utils.ts'
import { uploadFileToGoogleAI, generateContentGoogle, GoogleFileResult } from './utils.ts'

const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const JSON_ANALYSIS_PROMPT = `
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

const TEXT_QA_PROMPT = `
SEI UN ASSISTENTE ESPERTO DI GARE D'APPALTO.
Il tuo compito è rispondere alle domande dell'utente basandoti sui documenti forniti.
Rispondi in modo chiaro, professionale e sintetico.
Usa formattazione Markdown (grassetti, elenchi puntati) per migliorare la leggibilità.
IMPORTANTE: NON RESTITUIRE JSON. Rispondi solo con testo discorsivo/strutturato.
`;

Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
   }

   try {
      const body = await req.json();
      const { tenderId, filePaths, textStoragePath, action, analysisPreferences, semanticPreferences, batchName, finalJson, partialRecordIds, modelUsed, prompt, saveToDb, structuredModel, semanticModel } = body;

      const supabaseClient = createClient(
         Deno.env.get('SUPABASE_URL') ?? '',
         Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const geminiKey = Deno.env.get('GEMINI_API_KEY');
      if (!geminiKey) throw new Error("Missing GEMINI_API_KEY");


      // --- HELPER: Native Analysis with Fallback ---
      const performAnalysisNative = async (primaryModelId: string, fallbackModelId: string, userPrompt: string, googleFiles: GoogleFileResult[], systemPrompt: string, responseMimeType: string = "application/json", temperature: number = 0.1) => {
         console.log(`[Analysis] Starting Native with Primary: ${primaryModelId} (Output: ${responseMimeType})`);

         const callAI = async (modelId: string) => {
            console.log(`[AI] Calling Google Native ${modelId}...`);
            // We append SYSTEM_PROMPT to userPrompt because native API 'systemInstruction' is optional/beta.
            // Concatenating is safer for now.
            const fullPrompt = systemPrompt + "\n\n" + userPrompt;
            return await generateContentGoogle(modelId, fullPrompt, googleFiles, geminiKey, responseMimeType, temperature);
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
         // Encapsulate analysis logic for Async/Sync reuse
         const runAnalysis = async () => {
            try {
               let resultJson = null;

               // User-defined Pipeline:
               // Structure/Parsing: Primary = gemini-2.5-flash (structuredModel), Fallback = gemini-2.5-flash (Reliable)
               const primaryModel = structuredModel || 'gemini-2.5-flash';
               let fallbackModel = 'gemini-2.5-flash'; // Default fallback

               // SMART FALLBACK: If user explicitly wants Pro, fallback to 2.5 Pro (as per user request)
               if (primaryModel === 'gemini-3-pro-preview') {
                  fallbackModel = 'gemini-2.5-pro';
               }

               // 1. Upload Files to Google
               let pathsToProcess = filePaths || [];

               // FALLBACK: If resume (no filePaths), fetch from DB (tender_documents)
               if (pathsToProcess.length === 0) {
                  console.log("[Analysis] No filePaths provided (Resume Mode). Fetching from DB...");
                  const { data: dbDocs, error: dbError } = await supabaseClient
                     .from('tender_documents')
                     .select('file_path')
                     .eq('tender_id', tenderId);

                  if (dbError) {
                     console.error("[Analysis] Failed to fetch documents from DB:", dbError);
                  } else if (dbDocs && dbDocs.length > 0) {
                     pathsToProcess = dbDocs.map(d => d.file_path);
                     console.log(`[Analysis] Retrieved ${pathsToProcess.length} paths from DB.`);
                  } else {
                     console.warn("[Analysis] No documents found in DB for this tender.");
                  }
               }

               // Verify again
               if (pathsToProcess.length === 0) throw new Error("No files could be prepared for Google AI (Input empty and DB empty).");

               const googleFiles = await prepareFilesForGoogle(pathsToProcess);
               if (googleFiles.length === 0) throw new Error("No files could be prepared for Google AI.");


               // 2. Generate Prompt
               // Extract sector from body, default to 'Generale' if not present
               const sector = body.sector || 'Generale';
               const activePrompt = prompt || generateAnalysisPrompt(analysisPreferences, batchName || 'default', semanticPreferences, sector);

               // Logic for Temperature:
               // If Semantic Analysis (Genius Mode) is active for any section, bump temperature to 0.3 for better creativity.
               // Otherwise (Pure Structured), keep it at 0.1 for precision.
               const activeSemanticKeys = Object.keys(semanticPreferences || {}).filter(k => semanticPreferences[k]);
               const analysisTemperature = activeSemanticKeys.length > 0 ? 0.3 : 0.1;

               if (activeSemanticKeys.length > 0) {
                  console.log(`[Analysis] Genius Mode Active (${activeSemanticKeys.length} sections). Using Temperature: ${analysisTemperature}`);
               }

               // 3. Perform Analysis (PASS JSON SYSTEM PROMPT)
               // Note: performAnalysisNative needs to be updated to accept temperature or we pass it via a config object?
               // Looking at performAnalysisNative signature in current view... I need to update it too or just update where it calls generateContentGoogle.
               // Let's assume I need to update performAnalysisNative's signature in utils.ts FIRST, but I didn't see performAnalysisNative in utils.ts view earlier?
               // Wait, performAnalysisNative is imported or defined in index.ts? 
               // Accessing it now: it is likely defined in this file (index.ts) or imported.
               // Based on previous reads, performAnalysisNative was used. I'll pass the temperature to it.
               const responseText = await performAnalysisNative(primaryModel, fallbackModel, activePrompt, googleFiles, JSON_ANALYSIS_PROMPT, "application/json", analysisTemperature);

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
               return resultJson;
            } catch (err: any) {
               console.error(`[Background Analysis] Error in batch ${batchName}:`, err);

               // CRITICAL: Save error state to DB so polling client stops waiting
               if (saveToDb && tenderId) {
                  try {
                     await supabaseClient
                        .from('analyses')
                        .insert({
                           tender_id: tenderId,
                           result_json: {
                              _batch_name: batchName,
                              error: err.message || "Unknown background error",
                              debug_stack: err.stack
                           },
                           model_used: "error"
                        });
                  } catch (dbErr) {
                     console.error("[Background Analysis] Failed to save error log:", dbErr);
                  }
               }
               throw err;
            }
         };

         // CHECK BACKGROUND MODE
         if (body.background) {
            console.log(`[Analysis] Background mode enabled for ${batchName}. Returning status 'queued'.`);
            // @ts-ignore
            EdgeRuntime.waitUntil(runAnalysis());
            return new Response(JSON.stringify({ status: 'queued', batch: batchName }), {
               status: 200, // Return 200 so invocation doesn't throw, client will start polling
               headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
         } else {
            // SYNC MODE (Legacy/Direct)
            console.log(`[Analysis] Sync mode for ${batchName}. Waiting for completion...`);
            const result = await runAnalysis();
            return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
         }
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
         Se l'informazione è nel JSON, usala per formulare una risposta discorsiva.
         Sii preciso e professionale. Rispondi in italiano.
         
         RICORDA: IL TUO OUTPUT DEVE ESSERE SOLO TESTO. NIENTE PARENTESI GRAFFE O JSON.`;

         // Upload files if provided (Stateless/Reset per call)
         let googleFiles: GoogleFileResult[] = [];
         if (filePaths && filePaths.length > 0) {
            googleFiles = await prepareFilesForGoogle(filePaths);
         }

         // Use the helper, but pass our TEXT system prompt AND "text/plain" AND temperature 0.3 (Creative/Human)
         const responseText = await performAnalysisNative(primaryModel, fallbackModel, fullPrompt, googleFiles, TEXT_QA_PROMPT, "text/plain", 0.3);

         let finalAnswer = responseText;
         // CLEANUP: If model stubbornly returns JSON, try to extract the text
         try {
            const clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            if (clean.startsWith('{')) {
               const parsed = JSON.parse(clean);
               if (parsed.risposta) finalAnswer = parsed.risposta;
               else if (parsed.answer) finalAnswer = parsed.answer;
               else if (parsed.content) finalAnswer = parsed.content;
               else if (parsed.text) finalAnswer = parsed.text;
            }
         } catch (e) {
            console.log("Response was not JSON or failed parse, using raw text.");
         }

         // PERSISTENCE: Save to DB
         try {
            // 1. Get latest analysis
            const { data: existingAnalysis, error: fetchError } = await supabaseClient
               .from('analyses')
               .select('id, result_json')
               .eq('tender_id', tenderId)
               .order('created_at', { ascending: false })
               .limit(1)
               .single();

            if (existingAnalysis && existingAnalysis.result_json) {
               const currentJson = existingAnalysis.result_json;
               if (!currentJson.deep_dives) currentJson.deep_dives = {};

               const sectionKey = section || 'general';
               if (!currentJson.deep_dives[sectionKey]) currentJson.deep_dives[sectionKey] = [];

               currentJson.deep_dives[sectionKey].push({
                  question,
                  answer: finalAnswer,
                  timestamp: new Date().toISOString()
               });

               const { error: updateError } = await supabaseClient
                  .from('analyses')
                  .update({ result_json: currentJson })
                  .eq('id', existingAnalysis.id);

               if (updateError) console.error("Failed to persist Deep Dive:", updateError);
               else console.log("Deep Dive persisted to DB.");
            }
         } catch (dbEx) {
            console.error("Error persisting Deep Dive:", dbEx);
         }

         return new Response(JSON.stringify({ answer: finalAnswer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

   } catch (error: any) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
   }
})
