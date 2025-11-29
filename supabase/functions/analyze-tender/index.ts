import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import { extractText } from 'npm:unpdf'

const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `
SEI UN ANALISTA ESPERTO DI GARE D'APPALTO (BID MANAGER).
IL TUO OBIETTIVO È ESTRARRE OGNI SINGOLO DETTAGLIO UTILE DAI DOCUMENTI DI GARA FORNITI PER COMPILARE IL JSON SOTTOSTANTE.

ISTRUZIONI FONDAMENTALI:
1. **CORPUS UNICO**: Considera tutto il testo che segue come un UNICO documento logico, anche se diviso in file diversi.
2. **ANALISI TOTALE**: Leggi dall'inizio alla fine. Non ignorare nessuna parte.
3. **INTEGRAZIONE**: Le informazioni sono sparse. I punteggi potrebbero essere in un file, i requisiti in un altro. AGGREGA TUTTO.
4. **NESSUNA ALLUCINAZIONE**: Se un dato manca in TUTTI i file, scrivi null.

STRUTTURA JSON RICHIESTA (RISPETTALA RIGOROSAMENTE):
{
  "_ragionamento": "Spiega brevemente quali documenti hai analizzato e come hai integrato le informazioni tra loro.",
  "1_requisiti_partecipazione": {
     "ordine_generale": [{ "requisito": "...", "ref": "..." }],
     "ordine_speciale": [{ "requisito": "...", "ref": "..." }],
     "idoneita_professionale": [{ "requisito": "...", "ref": "..." }],
     "capacita_tecnica": [{ "requisito": "...", "ref": "..." }],
     "rti_consorzi": "...",
     "consorzi_stabili": "...",
     "avvalimento": "...",
     "subappalto": "..."
  },
  "3_sintesi": {
     "oggetto": "...", "codici": { "cig": "...", "cup": "...", "cpv": "..." }, "scenario": "...", "ref": "..."
  },
  "4_servizi": {
     "attivita": ["..."], "innovazioni": "...", "fabbisogno": "...", "ref": "..."
  },
  "5_scadenze": {
     "timeline": [{ "evento": "...", "data": "YYYY-MM-DD HH:mm", "ref": "..." }],
     "sopralluogo": {
        "previsto": "si/no",
        "obbligatorio": "si/no",
        "modalita": "...",
        "scadenze": "..."
     }
  },
  "6_importi": {
     "base_asta_totale": 0.00, "costi_manodopera": 0.00, "dettaglio": [{ "voce": "...", "importo": 0.00 }], "ref": "..."
  },
  "7_durata": {
     "durata_base": "...", "proroghe": "...", "tempistiche_operative": "...", "ref": "..."
  },
  "8_ccnl": {
     "contratti": ["..."], "equivalenze": "...", "ref": "..."
  },
  "9_oneri": {
     "carico_fornitore": ["..."], "carico_stazione": ["..."], "ref": "..."
  },
  "10_punteggi": {
     "tecnico": 70, "economico": 30, "soglia_sbarramento": 0,
     "criteri_tecnici": [{ 
        "criterio": "...", 
        "punti_max": 0, 
        "descrizione": "...", 
        "modalita": "...",
        "subcriteri": [{ "descrizione": "...", "punti_max": 0 }]
     }],
     "formula_economica": "...", "note_economiche": "...", "ref": "..."
  },
  "11_pena_esclusione": [
     { "descrizione": "...", "ref": "..." }
  ],
  "12_offerta_tecnica": {
     "documenti": ["..."], "formattazione_modalita": "...", "ref": "..."
  },
  "13_offerta_economica": {
     "documenti": ["..."], "formattazione_modalita": "...", "ref": "..."
  },
  "14_note_importanti": [
     { "nota": "...", "ref": "..." }
  ],
  "15_remunerazione": {
     "modalita": "...", "pagamenti": "...", "clausole": "...", "ref": "..."
  },
  "16_sla_penali": {
     "sla": [{ "indicatore": "...", "soglia": "..." }], 
     "penali": [{ "descrizione": "...", "calcolo": "...", "sla_associato": "..." }],
     "clausole_cumulative": "...", "ref": "..."
  }
}
Rispondi SOLO con il JSON valido.
`;

serve(async (req) => {
   if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
   try {
      const { tenderId, filePaths } = await req.json()

      // Initialize Supabase Client
      const supabaseClient = createClient(
         Deno.env.get('SUPABASE_URL') ?? '',
         Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Initialize OpenAI
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
         console.error("OPENAI_API_KEY is missing!");
         throw new Error("OPENAI_API_KEY is missing");
      }
      const openai = new OpenAI({ apiKey: apiKey });

      // Start background processing
      const processingPromise = (async () => {
         try {
            console.log(`[Background] Processing tenderId: ${tenderId}`);

            let fullPdfText = "";
            const debugStats = {
               files_processed: [],
               total_chars_sent: 0,
               model: "gpt-5-mini"
            };

            for (const filePath of filePaths) {
               console.log(`[Background] Processing file: ${filePath}`);

               // Download file from Supabase Storage
               const { data: fileData, error: downloadError } = await supabaseClient
                  .storage
                  .from('tenders')
                  .download(filePath);

               if (downloadError) {
                  console.error(`[Background] Download error for ${filePath}:`, downloadError);
                  fullPdfText += `\n=== ERRORE DOWNLOAD: ${filePath} ===\n`;
                  // @ts-ignore
                  debugStats.files_processed.push({ name: filePath, status: "error", error: downloadError.message });
                  continue;
               }

               // Extract text from PDF using unpdf
               const arrayBuffer = await fileData.arrayBuffer();

               try {
                  // Add 30s timeout for PDF parsing
                  const parsePromise = extractText(arrayBuffer);
                  const timeoutPromise = new Promise((_, reject) =>
                     setTimeout(() => reject(new Error("PDF parsing timed out")), 30000)
                  );

                  const { text } = await Promise.race([parsePromise, timeoutPromise]) as any;

                  let extractedText = Array.isArray(text) ? text.join("\n") : text;

                  // Basic cleaning
                  extractedText = extractedText.replace(/\s+/g, ' ').trim();

                  if (!extractedText || extractedText.length === 0) {
                     console.warn(`[Background] File ${filePath} extracted text is empty!`);
                     extractedText = "[TESTO VUOTO O NON ESTRAIBILE]";
                  }

                  fullPdfText += `\n=== INIZIO FILE: ${filePath} ===\n${extractedText}\n=== FINE FILE: ${filePath} ===\n`;

                  // @ts-ignore
                  debugStats.files_processed.push({
                     name: filePath,
                     status: "success",
                     chars: extractedText.length
                  });

               } catch (e: any) {
                  console.error(`[Background] PDF Parsing Error for ${filePath}:`, e);
                  fullPdfText += `\n=== ERRORE PARSING: ${filePath} ===\n`;
                  // @ts-ignore
                  debugStats.files_processed.push({ name: filePath, status: "parsing_error", error: e.message });
               }
            }

            console.log("[Background] Total extracted text length:", fullPdfText.length);

            // Global truncation (500k limit)
            if (fullPdfText.length > 500000) {
               console.warn("[Background] Total text truncated to 500k chars.");
               fullPdfText = fullPdfText.substring(0, 500000) + "\n...[TESTO TRONCATO PER LIMITI DI SISTEMA]...";
            }
            debugStats.total_chars_sent = fullPdfText.length;

            // Call OpenAI
            console.log("[Background] Sending request to OpenAI (gpt-5-mini)...");
            const completion = await openai.chat.completions.create({
               model: "gpt-5-mini",
               messages: [
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: `Analizza il seguente corpus documentale:\n\n${fullPdfText}` }
               ],
               response_format: { type: "json_object" }
            }, { timeout: 180000 }); // 180s timeout for OpenAI

            console.log("[Background] OpenAI response received.");
            const content = completion.choices[0].message.content;

            let json;
            try {
               json = JSON.parse(content);
            } catch (e) {
               console.error("[Background] JSON Parse Error:", e);
               throw new Error("Failed to parse AI response as JSON");
            }

            // Save analysis to database
            console.log("[Background] Saving analysis to DB...");
            const { error: dbError } = await supabaseClient
               .from('analyses')
               .insert({
                  tender_id: tenderId,
                  result_json: json,
                  model_used: 'gpt-5-mini'
               });

            if (dbError) {
               console.error("[Background] DB Insert Error:", dbError);
               throw dbError;
            }

            // Update tender status
            await supabaseClient
               .from('tenders')
               .update({ status: 'completed' })
               .eq('id', tenderId);

            console.log("[Background] Analysis completed successfully.");

         } catch (error) {
            console.error("[Background] Processing Error:", error);
            // Update tender status to failed
            await supabaseClient
               .from('tenders')
               .update({ status: 'failed' })
               .eq('id', tenderId);
         }
      })();

      // Register background task
      // @ts-ignore
      EdgeRuntime.waitUntil(processingPromise);

      return new Response(JSON.stringify({ success: true, message: "Analysis started in background" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

   } catch (error) {
      console.error("Function Error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
   }
})
