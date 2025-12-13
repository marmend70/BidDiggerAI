import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import JSON5 from 'https://esm.sh/json5@2.2.3'
import { jsonrepair } from 'https://esm.sh/jsonrepair@3.6.0'


const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `
SEI UN ANALISTA ESPERTO DI GARE D'APPALTO (BID MANAGER).
IL TUO OBIETTIVO È ESTRARRE OGNI SINGOLO DETTAGLIO UTILE DAI DOCUMENTI DI GARA FORNITI PER COMPILARE IL JSON SOTTOSTANTE.

REGOLE GENERALI (OBBLIGATORIE):
- Lavora SOLO in italiano.
- Non inventare informazioni: se un dato non è presente, lascia il campo vuoto (es. valore:"" o elenco:[]).
- Riporta testo, date, importi e punteggi esattamente come nel documento (formati originali).
- Ogni sezione deve includere il riferimento alla fonte (usa il campo "ref" o "fonte" previsto dallo schema).
- Se trovi contraddizioni, requisiti poco chiari o ambiguità, riportale anche nella sezione "Ambiguità".
- Usa elenchi puntati e tabelle (rappresentate come elenco di righe) dove opportuno.
- Le date restano nel formato originale del bando.
- Per importi, mantieni separatori di migliaia e valuta, se presente.
- Se l'informazione è presente in QUALSIASI documento allegato, compila il campo usando quella fonte; non lasciare vuoto se rilevabile in almeno un documento.

GESTIONE DEI MULTI-LOTTI (REGOLA OBBLIGATORIA):
1. Identificare TUTTI i lotti previsti dal bando (es. "Lotto 1", "Lotto 2", "Lotto Nord", ecc.).
2. Analizzare SEPARATAMENTE ogni lotto per ogni sezione.
3. Se una sezione è comune a tutti i lotti, ripetila per ogni lotto specificando che è comune o usa un lotto "Generale" se appropriato, ma preferibilmente esplodi per lotto.
4. L'output JSON prevede che la maggior parte delle sezioni siano LISTE DI OGGETTI, dove ogni oggetto ha una proprietà "lotto".

REGOLE DI OUTPUT:
- Produci SOLO JSON conforme allo schema atteso.
- Non aggiungere chiavi non previste. Non inserire testo fuori dal JSON.

LINEE GUIDA OPERATIVE:
1. "SERVIZI":
   - "fabbisogno" (RIGOROSO): Cerca ESCLUSIVAMENTE quantificazioni di sforzo: Ore Lavoro, Giorni/Uomo, FTE, Mesi/Uomo, Composizione Gruppo Minimo. IGNORA obiettivi strategici ("Migliorare efficienza") o descrizioni di servizio. Se non trovi stime numeriche, SCRIVI: "Nessuna quantificazione oraria/giornate uomo esplicitata nel documento. Verificare in fase di lettura diretta se l'appalto è a corpo/canone."
   - "attivita": Sintetizza le attività operative richieste.
2. "AMBIGUITÀ": Riporta contraddizioni o punti poco chiari.
3. "REQUISITI": Distingui tra generali, speciali, idoneità, capacità.
4. "SLA E PENALI":
   - SLA: Lista di oggetti { indicatore, soglia, penale_associata }.
   - PENALI: Lista di oggetti { descrizione, calcolo, sla_associato }.

ISTRUZIONI APPROFONDITE PER LA SEZIONE "17_ambiguita_punti_da_chiarire":
Agisci come un Senior Bid Manager e Legale esperto in Appalti Pubblici (D.lgs. 36/2023). Esegui questi 4 CHECK FONDAMENTALI:
1. COERENZA DOCUMENTALE: Discrepanze tra Bando/Disciplinare/Capitolato e riferimenti normativi (es. D.lgs 50/2016 abrogato).
2. ECONOMICO E ONERI:
   - Manodopera: Verificare se scorporata dalla base d'asta o "non soggetta a ribasso" (art. 41 D.lgs 36/2023).
   - Revisione Prezzi: È presente e chiara?
   - Base d'asta: È congrua o sottostimata? Oneri sicurezza a zero?
3. OPERATIVO E PENALI:
   - Penali: C'è un tetto massimo (capping 10%)? Sono accumulabili?
   - SLA: Sono realistici o vaghi?
   - Risoluzione: Clausole sbilanciate?
4. REQUISITI E LOCK-IN:
   - Requisiti "Sartoriali" (es. software proprietari)?
   - Limiti al Subappalto/Avvalimento non motivati?

MAPPATURA OUTPUT (MATRICE RISCHI -> JSON):
Invece di una tabella Markdown, popola il JSON così:
- "ambiguita": Ogni oggetto rappresenta una riga della matrice rischi.
  - "tipo": [LIVELLO RISCHIO: 🔴/🟡/🟢] + [CATEGORIA: Economico/Tecnico/Amm.vo/Legale]. Esempio: "🔴 Economico".
  - "descrizione": Descrizione dettagliata del rischio/ambiguità.
  - "riferimento_documento": Fonte esatta (Documento, Pagina, Articolo).
- "punti_da_chiarire": Inserisci qui i suggerimenti operativi o quesiti.
  - "quesito_suggerito": L'azione concreta o il quesito da porre alla SA.
  - "contesto": Breve richiamo al rischio associato (es. "Rif. mancato scorporo manodopera").
  - "motivazione": Perché è critico chiarire questo punto.

STRUTTURA JSON RICHIESTA (RISPETTALA RIGOROSAMENTE):
{
  "_ragionamento": "Spiega brevemente quali documenti hai analizzato e come hai gestito i lotti.",
  "1_requisiti_partecipazione": [
    {
      "lotto": "Lotto 1",
      "ordine_generale": [{ "requisito": "...", "ref": "..." }],
      "ordine_speciale": [{ "requisito": "...", "ref": "..." }],
      "idoneita_professionale": [{ "requisito": "...", "ref": "..." }],
      "capacita_tecnica": [{ "requisito": "...", "ref": "..." }],
      "rti_consorzi": "...",
      "consorzi_stabili": "...",
      "avvalimento": "...",
      "subappalto": "..."
    }
  ],
  "3_sintesi": {
     "oggetto": "...", "codici": { "cig": "...", "cup": "...", "cpv": "..." }, "scenario": "...", "ref": "..."
  },
  "3b_checklist_amministrativa": [
    {
      "lotto": "Lotto 1",
      "garanzia_provvisoria": { "importo": "...", "beneficiario": "...", "validita": "...", "clausole": "...", "ref": "..." },
      "contributo_anac": { "importo": "...", "cig": "...", "ref": "..." },
      "sopralluogo": { "stato": "...", "modalita": "...", "ref": "..." },
      "imposta_bollo": { "importo": "...", "modalita": "...", "ref": "..." },
      "firma_formato": { "formato": "...", "piattaforma": "...", "ref": "..." },
      "elenco_documenti": [{ "documento": "...", "descrizione": "...", "ref": "..." }]
    }
  ],
  "4_servizi": [
    {
      "lotto": "Lotto 1",
      "attivita": ["..."], "innovazioni": "...", "fabbisogno": "...", "ref": "..."
    }
  ],
  "5_scadenze": [
    {
      "lotto": "Lotto 1",
      "timeline": [{ "evento": "...", "data": "YYYY-MM-DD HH:mm", "ref": "..." }],
      "sopralluogo": { "previsto": "si/no", "obbligatorio": "si/no", "modalita": "...", "scadenze": "..." }
    }
  ],
  "6_importi": [
    {
      "lotto": "Lotto 1",
      "base_asta_totale": 0.00, "costi_manodopera": 0.00, "dettaglio": [{ "voce": "...", "importo": 0.00 }], "ref": "..."
    }
  ],
  "7_durata": [
    {
      "lotto": "Lotto 1",
      "durata_base": "...", "proroghe": "...", "tempistiche_operative": "...", "ref": "..."
    }
  ],
  "8_ccnl": [
    {
      "lotto": "Lotto 1",
      "contratti": ["..."], "equivalenze": "...", "clausola_sociale": "...", "ref": "..."
    }
  ],
  "9_oneri": [
    {
      "lotto": "Lotto 1",
      "carico_fornitore": ["..."], "carico_stazione": ["..."], "ref": "..."
    }
  ],
  "10_punteggi": [
    {
      "lotto": "Lotto 1",
      "tecnico": 70, "economico": 30, "soglia_sbarramento": 0,
      "criteri_tecnici": [{ 
         "criterio": "...", 
         "punti_max": 0, 
         "descrizione": "...", 
         "modalita": "...",
         "subcriteri": [{ "descrizione": "...", "punti_max": 0 }]
      }],
      "formula_economica": "...", 
      "formula_economica_dettaglio": {
        "formula": "Riporta la formula matematica esatta (es. P = (Ci/Cmax)*30)",
        "parametri_legenda": "Spiega il significato di ogni variabile (es. Ci = coefficiente offerta, Cmax = coefficiente massimo)",
        "modalita_calcolo": "Descrivi come viene applicata (es. interpolazione lineare, bilineare, aggregatrice compensatrice)"
      },
      "note_economiche": "...", "ref": "..."
    }
  ],
  "11_pena_esclusione": [
    {
      "lotto": "Lotto 1",
      "elementi": [{ "descrizione": "...", "ref": "..." }]
    }
  ],
  "12_offerta_tecnica": [
    {
      "lotto": "Lotto 1",
      "documenti": ["..."], "formattazione_modalita": "...", "ref": "..."
    }
  ],
  "13_offerta_economica": [
    {
      "lotto": "Lotto 1",
      "documenti": ["..."], "formattazione_modalita": "...", "ref": "..."
    }
  ],
  "14_note_importanti": [
    {
      "lotto": "Lotto 1",
      "note": [{ "nota": "...", "ref": "..." }]
    }
  ],
  "15_remunerazione": [
    {
      "lotto": "Lotto 1",
      "modalita": "...", "pagamenti": "...", "clausole": "...", "ref": "..."
    }
  ],
  "16_sla_penali": [
    {
      "lotto": "Lotto 1",
      "sla": [{ "indicatore": "...", "soglia": "...", "penale_associata": "..." }],
      "penali": [{ "descrizione": "...", "calcolo": "...", "sla_associato": "..." }],
      "clausole_cumulative": "...",
      "ref": "..."
    }
  ],
  "17_ambiguita_punti_da_chiarire": [
    {
      "lotto": "Lotto 1",
      "ambiguita": [{ "descrizione": "...", "riferimento_documento": "...", "tipo": "..." }],
      "punti_da_chiarire": [{ "quesito_suggerito": "...", "contesto": "...", "motivazione": "..." }],
      "ref": "..."
    }
  ]
}
`



Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
   }

   try {
      const body = await req.json();
      const { tenderId, filePaths, action, analysisPreferences, semanticAnalysisSections, background, saveToDb, textStoragePath, structuredModel, semanticModel, providedText, model, batchName } = body;

      console.log(`[Request] Action: ${action}, TenderId: ${tenderId}`);
      console.log(`[Request] Body Keys:`, Object.keys(body));
      console.log(`[Request] Semantic Sections Raw:`, JSON.stringify(semanticAnalysisSections));
      console.log(`[Request] Full Body Dump:`, JSON.stringify(body).substring(0, 1000));

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

      // --- HELPER: LlamaParse Extraction ---
      const extractWithLlamaParse = async (fileBlob: Blob, fileName: string): Promise<string | null> => {
         const llamaKey = Deno.env.get('LLAMA_CLOUD_API_KEY')?.trim();
         if (!llamaKey) {
            console.log("[LlamaParse] No API Key found, skipping.");
            return null;
         }
         console.log("[LlamaParse] Key configured: " + llamaKey.substring(0, 5) + "...");

         try {
            console.log("[LlamaParse] Uploading " + fileName + "...");
            const formData = new FormData();
            formData.append('file', fileBlob, fileName);
            formData.append('premium_mode', 'true'); // Better table extraction
            formData.append('language', 'it');

            // Try Global Endpoint first, then EU
            const endpoints = [
               'https://api.cloud.llamaindex.ai/api/parsing',
               'https://api.cloud.eu.llamaindex.ai/api/parsing'
            ];

            let uploadRes;
            let usedEndpoint = '';

            for (const endpoint of endpoints) {
               console.log("[LlamaParse] Trying endpoint: " + endpoint + " ");
               uploadRes = await fetch(endpoint + "/upload", {
                  method: 'POST',
                  headers: { 'Authorization': "Bearer " + llamaKey },
                  body: formData
               });

               if (uploadRes.ok) {
                  usedEndpoint = endpoint;
                  break;
               } else {
                  const err = await uploadRes.text();
                  console.warn("[LlamaParse] Failed on " + endpoint + ": " + err);
                  // Fail fast on credit limit or invalid key
                  if (err.includes("credits") || err.includes("Invalid API Key")) {
                     console.error("[LlamaParse] Critical error (credits/key), skipping other endpoints.");
                     return null;
                  }
               }
            }

            if (!uploadRes || !uploadRes.ok) {
               console.error("[LlamaParse] All endpoints failed.");
               return null;
            }

            const { id: jobId } = await uploadRes.json();
            console.log("[LlamaParse] Job started: " + jobId + " on " + usedEndpoint);

            // Poll for result
            let attempts = 0;
            while (attempts < 150) { // Max 5 minutes
               await new Promise(r => setTimeout(r, 2000));
               const statusRes = await fetch(usedEndpoint + "/job/" + jobId, {
                  headers: { 'Authorization': "Bearer " + llamaKey }
               });

               if (!statusRes.ok) break;

               const statusData = await statusRes.json();
               if (statusData.status === 'SUCCESS') {
                  console.log("[LlamaParse] Job succeeded. Fetching result...");
                  const resultRes = await fetch(usedEndpoint + "/job/" + jobId + "/result/markdown", {
                     headers: { 'Authorization': "Bearer " + llamaKey }
                  });

                  if (!resultRes.ok) {
                     console.error("[LlamaParse] Failed to fetch result: " + await resultRes.text());
                     return null;
                  }

                  const resultData = await resultRes.json();
                  console.log("[LlamaParse] Markdown length: " + (resultData.markdown ? resultData.markdown.length : '0'));
                  return resultData.markdown;
               } else if (statusData.status === 'FAILED') {
                  console.error("[LlamaParse] Job failed for " + fileName);
                  return null;
               }
               attempts++;
            }
            console.warn("[LlamaParse] Timeout for " + fileName);
            return null;

         } catch (e) {
            console.error("[LlamaParse] Error:", e);
            return null;
         }
      };

      // --- HELPER: Gemini Extraction (Robust File API REST) ---
      const extractWithGemini = async (fileBlob: Blob, fileName: string): Promise<string | null> => {
         const geminiKey = Deno.env.get('GEMINI_API_KEY');
         if (!geminiKey) return null;

         try {
            console.log(`[GeminiExtract] Starting File API upload for ${fileName} (${fileBlob.size} bytes)...`);

            // 1. Initial Upload Request (Get Upload URL)
            const initUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}`;
            const metadata = { file: { display_name: fileName } };

            const initRes = await fetch(initUrl, {
               method: 'POST',
               headers: {
                  'X-Goog-Upload-Protocol': 'resumable',
                  'X-Goog-Upload-Command': 'start',
                  'X-Goog-Upload-Header-Content-Length': fileBlob.size.toString(),
                  'X-Goog-Upload-Header-Content-Type': 'application/pdf',
                  'Content-Type': 'application/json'
               },
               body: JSON.stringify(metadata)
            });

            if (!initRes.ok) throw new Error(`Init upload failed: ${initRes.status} ${await initRes.text()}`);

            const uploadUrl = initRes.headers.get('x-goog-upload-url');
            if (!uploadUrl) throw new Error("No upload URL returned");

            // 2. Upload Actual Bytes
            console.log(`[GeminiExtract] Uploading bytes to ${uploadUrl}...`);
            const uploadRes = await fetch(uploadUrl, {
               method: 'POST',
               headers: {
                  'Content-Length': fileBlob.size.toString(),
                  'X-Goog-Upload-Offset': '0',
                  'X-Goog-Upload-Command': 'upload, finalize'
               },
               body: fileBlob // Stream directly!
            });

            if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${await uploadRes.text()}`);

            const fileInfo = await uploadRes.json();
            const fileUri = fileInfo.file.uri;
            console.log(`[GeminiExtract] File uploaded. URI: ${fileUri}`);

            // 3. Wait for Active State
            let state = fileInfo.file.state;
            while (state === 'PROCESSING') {
               console.log("[GeminiExtract] Waiting for processing...");
               await new Promise(r => setTimeout(r, 1000));
               const stateRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileInfo.file.name}?key=${geminiKey}`);
               const stateData = await stateRes.json();
               state = stateData.state;
               if (state === 'FAILED') throw new Error("Gemini File Processing Failed");
            }

            // 4. Generate Content
            console.log("[GeminiExtract] Generating content...");
            let text = null;
            const TIMEOUT_MS = 60000; // 60 seconds hard timeout to prevent Edge Function kill (increased for large docs)

            try {
               // 1. PRIMARY: Gemini 1.5 Flash Latest (Stable) - Replaces broken 2.5
               const controller = new AbortController();
               const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s

               const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`;
               const genRes = await fetch(genUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                     contents: [{
                        parts: [
                           { file_data: { mime_type: 'application/pdf', file_uri: fileUri } },
                           { text: "Estrai tutto il testo contenuto in questo documento. Restituisci SOLO il testo estratto, senza commenti o formattazione markdown aggiuntiva." }
                        ]
                     }]
                  }),
                  signal: controller.signal
               });
               clearTimeout(timeoutId);

               if (!genRes.ok) throw new Error(`Primary model failed: ${genRes.status} ${await genRes.text()}`);
               const result = await genRes.json();
               text = result.candidates?.[0]?.content?.parts?.[0]?.text;

            } catch (primaryError) {
               console.warn("[GeminiExtract] Primary (2.5-flash) failed, trying Fallback 1 (1.5-flash)...", primaryError);

               try {
                  // 2. FALLBACK 1: Gemini 1.5 Flash Latest (Stable, 90s timeout)
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s increased

                  const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`;
                  const fallbackRes = await fetch(fallbackUrl, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                        contents: [{
                           parts: [
                              { file_data: { mime_type: 'application/pdf', file_uri: fileUri } },
                              { text: "Estrai tutto il testo contenuto in questo documento. Restituisci SOLO il testo estratto, senza commenti o formattazione markdown aggiuntiva." }
                           ]
                        }]
                     }),
                     signal: controller.signal
                  });
                  clearTimeout(timeoutId);

                  if (!fallbackRes.ok) throw new Error(`Fallback 1 failed: ${fallbackRes.status} ${await fallbackRes.text()}`);
                  const result = await fallbackRes.json();
                  text = result.candidates?.[0]?.content?.parts?.[0]?.text;

               } catch (fallback1Error) {
                  console.warn("[GeminiExtract] Fallback 1 (1.5-flash) failed, trying Fallback 2 (1.5-pro)...", fallback1Error);

                  try {
                     // 3. FALLBACK 2: Gemini 1.5 Pro Latest (Powerful, 120s timeout)
                     const controller = new AbortController();
                     const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s generous

                     const fallback2Url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${geminiKey}`;
                     const fallback2Res = await fetch(fallback2Url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                           contents: [{
                              parts: [
                                 { file_data: { mime_type: 'application/pdf', file_uri: fileUri } },
                                 { text: "Estrai tutto il testo contenuto in questo documento. Restituisci SOLO il testo estratto, senza commenti o formattazione markdown aggiuntiva." }
                              ]
                           }]
                        }),
                        signal: controller.signal
                     });
                     clearTimeout(timeoutId);

                     if (!fallback2Res.ok) throw new Error(`Fallback 2 failed: ${fallback2Res.status} ${await fallback2Res.text()}`);
                     const result = await fallback2Res.json();
                     text = result.candidates?.[0]?.content?.parts?.[0]?.text;

                  } catch (fallback2Error) {
                     console.error("[GeminiExtract] ALL Gemini models (2.5-flash, 1.5-flash, 1.5-pro) failed.", fallback2Error);
                     throw new Error("Gemini Extraction Failed (All Models). Local fallback disabled to prevent crash.");
                  }
               }
            }

            // 5. Cleanup (Delete File)
            // Fire and forget delete to save time
            fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileInfo.file.name}?key=${geminiKey}`, { method: 'DELETE' }).catch(e => console.error("Cleanup failed:", e));

            if (!text) throw new Error("No text returned");

            console.log(`[GeminiExtract] Success. Extracted ${text.length} chars.`);
            return text;

         } catch (e: any) {
            console.error("[GeminiExtract] Failed:", e);
            // IMPORTANT: If we explicitly threw an error to avoid local fallback, re-throw it!
            if (e.message && e.message.includes("Gemini Extraction Failed")) {
               throw e;
            }
            return null;
         }
      };

      // --- HELPER: Extract Text (Sequential - Reverted for Stability) ---
      const extractTextFromFiles = async () => {
         let fullPdfText = "";

         // Dynamic truncation strategy (Per file)
         const MAX_TOTAL_CHARS = 350000;
         const fileCount = filePaths.length;
         let perFileLimit = Math.floor(MAX_TOTAL_CHARS / fileCount);
         if (perFileLimit < 50000) perFileLimit = 50000;
         if (perFileLimit > 200000) perFileLimit = 200000;
         if (fileCount === 1) perFileLimit = 300000;

         console.log(`[Extract] Dynamic limit per file: ${perFileLimit} chars`);

         for (const filePath of filePaths) {
            console.log(`[Extract] Processing file: ${filePath}`);
            let fileResult = "";
            try {
               const { data: fileData, error: downloadError } = await supabaseClient
                  .storage
                  .from('tenders')
                  .download(filePath);

               if (downloadError) {
                  console.error(`[Extract] Download error for ${filePath}:`, downloadError);
                  fileResult = `\n=== ERRORE DOWNLOAD: ${filePath} ===\n`;
               } else {
                  let extractedText = "";

                  // 1. Try LlamaParse first (DISABLED BY USER REQUEST)
                  const llamaMarkdown = null;

                  if (llamaMarkdown) {
                     extractedText = llamaMarkdown;
                     console.log("[Extract] Used LlamaParse for " + filePath);
                  } else {
                     // 2. Fallback to Gemini (CPU efficient) - NOW PRIMARY
                     console.log("[Extract] Using Gemini extraction (Primary) for " + filePath);

                     try {
                        const geminiText = await extractWithGemini(fileData, filePath.split('/').pop() || 'doc.pdf');
                        if (geminiText) {
                           extractedText = geminiText;
                        }
                     } catch (geminiError: any) {
                        console.error("[Extract] Gemini extraction failed hard:", geminiError);
                        // Do NOT set extractedText here, so fallback logic can run!
                     }

                     if (!extractedText || (typeof extractedText === 'string' && extractedText.includes("ERRORE"))) {
                        // 3. Last Resort: Standard extraction (Re-enabled for fallback)
                        console.log("[Extract] Fallback to standard extraction (Last Resort) for " + filePath);
                        const fileBuffer = await fileData.arrayBuffer();

                        if (filePath.endsWith('.docx')) {
                           const mammoth = await import('https://esm.sh/mammoth@1.6.0');
                           const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
                           extractedText = result.value;
                        } else {
                           // PDF extraction
                           const { extractText } = await import('npm:unpdf');
                           const parsePromise = extractText(new Uint8Array(fileBuffer));
                           try {
                              const pdfTimeoutPromise = new Promise((_, reject) =>
                                 setTimeout(() => reject(new Error("PDF parsing timeout")), 15000)
                              );
                              const { text } = await Promise.race([parsePromise, pdfTimeoutPromise]) as any;
                              extractedText = Array.isArray(text) ? text.join("\n") : text;
                           } catch (e) {
                              console.error("[Extract] PDF parsing failed/timeout for " + filePath + ":", e);
                              extractedText = "[ERRORE LETTURA PDF: Timeout o formato non supportato]";
                           }
                        }
                     }
                  }

                  console.log(`[Extract] ${filePath} raw text length: ${extractedText.length}`);
                  extractedText = extractedText.trim();

                  if (!extractedText) extractedText = "[TESTO VUOTO]";

                  if (extractedText.length > perFileLimit) {
                     console.log(`[Extract] Truncating ${filePath} from ${extractedText.length} to ${perFileLimit}`);
                     extractedText = extractedText.substring(0, perFileLimit) + "\n...[TRONCATO]...";
                  }

                  fileResult = "\n=== INIZIO FILE: " + filePath + " ===\n" + extractedText + "\n=== FINE FILE: " + filePath + " ===\n";
                  console.log(`[Extract] Finished ${filePath}. Result length: ${fileResult.length}`);
               }
            } catch (e: any) {
               console.error(`[Extract] Error processing ${filePath}:`, e);
               fileResult = `\n=== ERRORE GENERICO: ${filePath} ===\n`;
            }
            fullPdfText += fileResult;
         }

         if (fullPdfText.length > 400000) {
            console.log(`[Extract] Total Text truncated to 400k chars (Original: ${fullPdfText.length})`);
            fullPdfText = fullPdfText.substring(0, 400000) + "\n...[TRONCATO]...";
         }

         return fullPdfText;
      };


      // --- ACTION: EXTRACT AND STORE ---
      if (action === 'extract_and_store') {
         console.log("[Extract] Starting extraction and storage...");

         // 1. Credit Check & Deduction
         const { data: tenderData, error: tenderError } = await supabaseClient
            .from('tenders')
            .select('user_id')
            .eq('id', tenderId)
            .single();

         if (tenderError || !tenderData) {
            console.error("Failed to fetch tender owner:", tenderError);
            throw new Error("Impossibile verificare i crediti: gara non trovata.");
         }

         const userId = tenderData.user_id;

         const { data: profileData, error: profileError } = await supabaseClient
            .from('profiles')
            .select('credits')
            .eq('id', userId)
            .single();

         if (profileError || !profileData) {
            console.error("Failed to fetch user profile:", profileError);
            throw new Error("Impossibile verificare i crediti: profilo non trovato.");
         }

         const userCredits = profileData.credits || 0;
         console.log(`[Credits] User ${userId} has ${userCredits} credits.`);

         if (userCredits < 1) {
            throw new Error("Crediti insufficienti per avviare una nuova analisi. Ricarica il tuo portafoglio.");
         }

         // Deduct credit
         const { error: deductError } = await supabaseClient
            .from('profiles')
            .update({ credits: userCredits - 1 })
            .eq('id', userId);

         if (deductError) {
            console.error("Failed to deduct credit:", deductError);
            throw new Error("Errore durante l'aggiornamento dei crediti. Riprova.");
         }

         console.log(`[Credits] Deducted 1 credit. New balance: ${userCredits - 1}`);

         let text = await extractTextFromFiles();

         console.log("[Extract] Total text length: " + text.length);

         // Safety truncation before upload (max 1MB approx)
         if (text.length > 1000000) {
            console.warn("[Extract] Text too large for single upload (" + text.length + "), truncating to 1M chars.");
            text = text.substring(0, 1000000) + "\n...[TRONCATO PER LIMITI DI MEMORIA]...";
         }

         const storagePath = `${tenderId}/extracted_text.txt`;
         console.log("[Extract] Uploading to storage: " + storagePath);

         const { error: uploadError } = await supabaseClient
            .storage
            .from('tenders')
            .upload(storagePath, text, { upsert: true, contentType: 'text/plain' });

         if (uploadError) {
            console.error("[Extract] Storage upload error:", uploadError);
            throw new Error("Failed to store extracted text");
         }

         console.log("[Extract] Upload successful.");
         return new Response(JSON.stringify({ success: true, textStoragePath: storagePath }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // --- ACTION: SAVE FINAL AND CLEANUP ---
      if (action === 'save_final_and_cleanup') {
         const { finalJson, partialRecordIds, modelUsed } = body;
         console.log("[SaveFinal] Saving final analysis and cleaning up...");

         // 1. Insert Final Record
         const { data: insertData, error: insertError } = await supabaseClient
            .from('analyses')
            .insert({
               tender_id: tenderId,
               result_json: finalJson,
               model_used: modelUsed
            })
            .select()
            .single();

         if (insertError) {
            console.error("[SaveFinal] Insert Error:", insertError);
            throw new Error("Failed to save final analysis: " + insertError.message);
         }

         console.log("[SaveFinal] Final record saved. ID:", insertData.id);

         // 2. Cleanup Partial Records
         if (partialRecordIds && partialRecordIds.length > 0) {
            console.log("[SaveFinal] Deleting partial records:", partialRecordIds);
            const { error: deleteError } = await supabaseClient
               .from('analyses')
               .delete()
               .in('id', partialRecordIds);

            if (deleteError) {
               console.warn("[SaveFinal] Cleanup Warning:", deleteError);
               // Don't fail the whole request just because cleanup failed, but log it.
            } else {
               console.log("[SaveFinal] Cleanup successful.");
            }
         }

         return new Response(JSON.stringify({ success: true, id: insertData.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // --- ACTION: EXTRACT TEXT ONLY ---
      if (action === 'extract_text') {
         console.log("[Extract] Starting dedicated text extraction...");
         const extractedText = await extractTextFromFiles();

         if (!textStoragePath) {
            throw new Error("textStoragePath is required for extract_text action");
         }

         // Save to Storage
         const { error: uploadError } = await supabaseClient.storage
            .from('tenders')
            .upload(textStoragePath, extractedText, {
               contentType: 'text/plain; charset=utf-8',
               upsert: true
            });

         if (uploadError) {
            console.error("[Extract] Save Error:", uploadError);
            throw new Error("Failed to save extracted text");
         }

         return new Response(JSON.stringify({ success: true, message: "Text extracted and saved" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // --- ACTION: ANALYZE ---
      if (action === 'analyze') {
         console.log("[Analysis] Starting analysis...");

         let fullPdfText = providedText;
         if (!fullPdfText && textStoragePath) {
            console.log(`[Analysis] Loading cached text from ${textStoragePath}`);
            const { data, error } = await supabaseClient.storage.from('tenders').download(textStoragePath);
            if (!error) {
               fullPdfText = await data.text();
            } else {
               console.warn("[Analysis] Failed to download cached text:", error);
               // Fallback will trigger extraction below
            }
         }

         if (!fullPdfText) {
            // Fallback: Extract if no text found (legacy behavior)
            // fullPdfText = await extractTextFromFiles();
            // Actually, for consistency, if we are here and allowDirectUpload is false, we MUST extract.
            if (!allowDirectUpload) {
               fullPdfText = await extractTextFromFiles();
            }
         }

         const performAnalysis = async (targetModel: string, systemPrompt: string, allowDirectUpload: boolean = true) => {
            let FINAL_PROMPT = systemPrompt;
            if (analysisPreferences) {
               FINAL_PROMPT += `\n\nPREFERENZE UTENTE:\n${JSON.stringify(analysisPreferences, null, 2)}`;
            }

            console.log(`[Analysis] Sending request to ${targetModel}...`);

            // AUTOMATIC REMAP: Fix 404s for deprecated/unavailable models
            // (Removals: Gemini 1.5 is now supported natively. GPT-4.1 is removed.)

            // --- STAGE 1: DIRECT PDF UPLOAD (GEMINI ONLY) ---
            // Only use Direct Upload if we DON'T have full text already (or explicit override)
            if (allowDirectUpload && !fullPdfText && targetModel && targetModel.startsWith('gemini')) {
               console.log("[Analysis] Stage 1: Attempting Direct PDF Upload...");
               try {
                  const geminiKey = Deno.env.get('GEMINI_API_KEY');
                  if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");

                  const { GoogleGenerativeAI } = await import("npm:@google/generative-ai");
                  const { GoogleAIFileManager } = await import("npm:@google/generative-ai/server");

                  const genAI = new GoogleGenerativeAI(geminiKey);
                  const fileManager = new GoogleAIFileManager(geminiKey);
                  const geminiModel = genAI.getGenerativeModel({ model: targetModel });

                  // 1. Separate PDFs from other files
                  const pdfPaths = filePaths.filter((p: string) => p.toLowerCase().endsWith('.pdf'));
                  const otherPaths = filePaths.filter((p: string) => !p.toLowerCase().endsWith('.pdf'));

                  if (pdfPaths.length === 0) throw new Error("No PDFs for direct upload");

                  const uploadedFiles = [];
                  let otherFilesText = "";

                  // 2. Upload PDFs
                  for (const pdfPath of pdfPaths) {
                     console.log(`[Stage 1] Uploading PDF: ${pdfPath}`);
                     const { data: fileData, error: downloadError } = await supabaseClient.storage.from('tenders').download(pdfPath);
                     if (downloadError) throw downloadError;

                     // Create temporary file for upload (Deno Deploy specific)
                     const tempFilePath = `/tmp/${pdfPath.split('/').pop()}`;
                     await Deno.writeFile(tempFilePath, new Uint8Array(await fileData.arrayBuffer()));

                     const uploadResponse = await fileManager.uploadFile(tempFilePath, {
                        mimeType: "application/pdf",
                        displayName: pdfPath.split('/').pop(),
                     });

                     console.log(`[Stage 1] Uploaded ${pdfPath} as ${uploadResponse.file.name}`);
                     uploadedFiles.push(uploadResponse.file);
                  }

                  // 3. Wait for files to be active
                  console.log("[Stage 1] Waiting for files to be processed...");
                  for (const file of uploadedFiles) {
                     let fileState = file.state;
                     while (fileState === "PROCESSING") {
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                        const fileStatus = await fileManager.getFile(file.name);
                        fileState = fileStatus.state;
                        console.log(`[Stage 1] File ${file.name} state: ${fileState}`);
                        if (fileState === "FAILED") throw new Error(`File processing failed for ${file.name}`);
                     }
                  }

                  // 4. Extract text from non-PDFs
                  if (otherPaths.length > 0) {
                     console.log("[Stage 1] Extracting text from non-PDF files...");
                     otherFilesText = "\n\n[NOTA: Ci sono altri file non-PDF che non sono stati caricati direttamente in questo stadio. Se mancano info, usa il fallback.]";
                  }

                  // 5. Generate Content
                  const promptParts = [
                     { text: FINAL_PROMPT },
                     { text: otherFilesText },
                     ...uploadedFiles.map(f => ({ fileData: { mimeType: f.mimeType, fileUri: f.uri } })),
                     { text: "\n\nAnalizza il corpus documentale fornito (PDF allegati) ed estrai i dati richiesti." }
                  ];

                  console.log("[Stage 1] Generating content...");
                  const result = await geminiModel.generateContent(promptParts);
                  const responseText = result.response.text();

                  // Cleanup uploaded files
                  for (const file of uploadedFiles) {
                     try {
                        await fileManager.deleteFile(file.name);
                     } catch (e) { console.warn("Failed to delete file:", e); }
                  }

                  return parseResponse(responseText);

               } catch (e) {
                  console.warn("[Stage 1] Failed. Falling back to Stage 2 (Hybrid). Error:", e);
                  // Fallthrough to Stage 2
               }
            }

            // --- STAGE 2: HYBRID FALLBACK (TEXT EXTRACTION) ---
            console.log("[Analysis] Stage 2: Hybrid Text Extraction...");

            if (!fullPdfText) {
               fullPdfText = await extractTextFromFiles();
            }

            let completion;
            if (targetModel && targetModel.startsWith('gemini')) {
               const geminiKey = Deno.env.get('GEMINI_API_KEY');
               const { GoogleGenerativeAI } = await import("npm:@google/generative-ai");
               const genAI = new GoogleGenerativeAI(geminiKey!);

               try {
                  console.log(`[Stage 2] Using model: ${targetModel}`);
                  const geminiModel = genAI.getGenerativeModel({ model: targetModel });
                  const prompt = `${FINAL_PROMPT}\n\nAnalizza il seguente corpus documentale:\n\n${fullPdfText}`;
                  const result = await geminiModel.generateContent(prompt);
                  const parsed = parseResponse(result.response.text());

                  // FORCE FALLBACK ON JSON ERROR
                  if (parsed && (parsed.error || parsed.message === "JSON Parse Error")) {
                     throw new Error(`JSON Parse Error in Primary Model: ${JSON.stringify(parsed)}`);
                  }

                  return parsed;
               } catch (e) {
                  console.warn(`[Stage 2] Primary model ${targetModel} failed. Falling back to gemini-1.5-flash. Error:`, e);
                  try {
                     // Use specific version to avoid 404
                     const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
                     const prompt = `${FINAL_PROMPT}\n\nAnalizza il seguente corpus documentale:\n\n${fullPdfText}`;
                     const result = await fallbackModel.generateContent(prompt);
                     return parseResponse(result.response.text());
                  } catch (fallbackError) {
                     console.error("[Stage 2] Fallback failed:", fallbackError);
                     throw fallbackError;
                  }
               }

            } else {
               // OpenAI Logic
               try {
                  completion = await openai.chat.completions.create({
                     model: targetModel || "gpt-5-mini",
                     messages: [
                        { role: "system", content: FINAL_PROMPT },
                        { role: "user", content: `Analizza il seguente corpus documentale:\n\n${fullPdfText}` }
                     ],
                     response_format: { type: "json_object" }
                  }, { timeout: 400000 });

                  return JSON.parse(completion.choices[0].message.content);
               } catch (e: any) {
                  console.error("[Analysis] OpenAI Error:", e);
                  console.warn("[Analysis] Falling back to Gemini 1.5 Flash for Semantic Analysis...");

                  // FALLBACK TO GEMINI
                  try {
                     const geminiKey = Deno.env.get('GEMINI_API_KEY');
                     if (!geminiKey) throw new Error("GEMINI_API_KEY missing for fallback");

                     const { GoogleGenerativeAI } = await import("npm:@google/generative-ai");
                     const genAI = new GoogleGenerativeAI(geminiKey);
                     // Use specific version to avoid 404
                     const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

                     const prompt = `${FINAL_PROMPT}\n\nAnalizza il seguente corpus documentale:\n\n${fullPdfText}`;
                     const result = await fallbackModel.generateContent(prompt);
                     return parseResponse(result.response.text());
                  } catch (geminiError) {
                     console.error("[Analysis] Fallback Gemini failed:", geminiError);
                     throw new Error(`Dual Model Failure: OpenAI (${e.message}) AND Gemini Fallback failed.`);
                  }
               }
            }
         };

         const parseResponse = (responseText: string) => {
            // 1. Try to extract from Markdown blocks with flexible regex
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            let jsonString = jsonMatch ? jsonMatch[1] : responseText;

            // 2. Fallback: If no markdown block, search for outer brackets
            if (!jsonMatch) {
               const start = jsonString.indexOf('{');
               const end = jsonString.lastIndexOf('}');
               if (start !== -1 && end !== -1 && end > start) {
                  jsonString = jsonString.substring(start, end + 1);
               }
            }

            // 3. Clean common issues
            jsonString = jsonString.trim();

            try {
               // Try standard JSON first for speed
               return JSON.parse(jsonString);
            } catch (e) {
               console.warn("Standard JSON Parse Failed, trying JSON5...", e);
               try {
                  // Use JSON5 for relaxed parsing (comments, trailing commas, etc.)
                  return JSON5.parse(jsonString);
               } catch (e2) {
                  console.error("JSON5 Parse Error:", e2);
                  // Last resort: jsonrepair (The heavy lifter)
                  try {
                     console.warn("JSON5 Failed, trying jsonrepair...");
                     const repaired = jsonrepair(jsonString);
                     return JSON.parse(repaired);
                  } catch (e3) {
                     console.error("All parsing attempts failed.");
                     console.error("Raw response text was:", responseText); // Log raw for debugging
                     return { error: "JSON Parse Error", raw: responseText };
                  }
               }
            }
         };

         const executeDualModelAnalysis = async () => {
            // 1. Structured Analysis (Primary)
            let sModel = structuredModel || model || 'gemini-2.0-flash';

            // SECURITY REMAP: Force safe model (Strict Mode: Remap ALL 2.5 to 2.0 to avoid hangs)
            if (sModel.includes('gpt') || sModel.includes('2.5')) {
               console.warn(`[DualModel] Remapping unstable model ${sModel} to gemini-2.0-flash`);
               sModel = 'gemini-2.0-flash';
            }

            console.log(`[DualModel] Starting Structured Analysis with ${sModel}`);
            const structuredResult = await performAnalysis(sModel, SYSTEM_PROMPT, true);

            // 2. Semantic Analysis (Secondary, Optional)
            const semSections = semanticAnalysisSections ? Object.keys(semanticAnalysisSections).filter(k => semanticAnalysisSections[k]) : [];
            let semModel = semanticModel || 'gpt-5-mini';

            if (semSections.length > 0) {
               // SECURITY REMAP FOR SEMANTIC TOO
               if (semModel.includes('gpt') || (semModel.includes('2.5') && !semModel.includes('flash'))) {
                  console.warn(`[DualModel] Remapping unstable semantic model ${semModel} to gemini-2.0-flash`);
                  semModel = 'gemini-2.0-flash';
               }

               console.log(`[DualModel] Starting Semantic Analysis with ${semModel} for sections: ${semSections.join(', ')}`);

               const SEMANTIC_PROMPT = `
Per OGNI sezione del JSON, quando analizzi compili il blocco relativo all'analisi semantica "Analisi & Rischi" devi assumere IL RUOLO combinato di:
1. Esperto senior del Codice degli Appalti (Codice dei contratti pubblici (D.Lgs. 36/2023) aggiornato al Correttivo 2025 (D.Lgs. 209/2024) al Decreto PA (D.L.25/2025), soft law ANAC, giurisprudenza e prassi).
2. Bid Manager senior con esperienza pluriennale in gare ICT e servizi alla PA.
3. Consulente tecnico-economico per la progettazione dell’offerta.

L’analisi semantica deve essere:
- contestuale alla specifica sezione in cui ti trovi (SOLO le sezioni: ${semSections.join(', ')}),
- coerente con i contenuti estratti nella parte "structured" della stessa sezione,
- focalizzata esclusivamente sui temi pertinenti a quella sezione.

CONTESTO STRUTTURATO ESTRATTO (DA USARE COME BASE):
${JSON.stringify(structuredResult, null, 2)}

Per ogni sezione, nella parte "Analisi & Rischi", devi:
- interpretare le informazioni come farebbe un esperto giuridico-amministrativo;
- evidenziare rischi, criticità, ambiguità e implicazioni operative;
- identificare elementi restrittivi, incoerenti o non chiari della sezione specifica;
- valutare sostenibilità tecnica, economica, organizzativa e contrattuale dei contenuti;
- individuare eventuali punti da chiarire con la Stazione Appaltante;
- proporre considerazioni strategiche su come impostare l’offerta in quella sezione;
- indicare rischi di esclusione o di perdita di punteggio legati a quella sezione;
- suggerire leve migliorative, opportunità tecniche o strategiche rilevanti;
- motivare sempre l’analisi sulla base delle informazioni realmente presenti nella sezione.

DEVI SEMPRE:
- rispettare esattamente lo schema JSON della sezione;
- compilare solo i campi previsti in "Analisi & Rischi";
- non aggiungere alcun campo o testo fuori dal JSON;
- non commentare sezioni diverse da quella che stai analizzando;
- non duplicare contenuti di altre sezioni;
- segnalare chiaramente quando un’informazione non è presente nei documenti.

OUTPUT ATTESO (JSON):
{
  "nome_sezione": {
    "semantic_analysis": "Testo dell'analisi...",
    "rischi_rilevati": ["Rischio 1", "Rischio 2"]
  }
}
`;
               try {
                  const semanticResult = await performAnalysis(semModel, SEMANTIC_PROMPT, true);

                  // 3. Merge Results
                  console.log("[DualModel] Merging Semantic Results...");

                  // Initialize container for semantic data if not present
                  if (!structuredResult.semantic_analysis_data) {
                     structuredResult.semantic_analysis_data = {};
                  }

                  for (const section of semSections) {
                     if (semanticResult[section]) {
                        console.log(`[DualModel] Merging section ${section}`);
                        // SAFE MERGE: Store in separate field to avoid breaking array-based sections
                        structuredResult.semantic_analysis_data[section] = semanticResult[section];
                     } else {
                        console.warn(`[DualModel] WARNING: Section ${section} missing in semantic result. Available keys:`, Object.keys(semanticResult));
                     }
                  }
                  console.log("[DualModel] Final semantic_analysis_data:", JSON.stringify(structuredResult.semantic_analysis_data));

                  // DEBUG: Return raw info to frontend
                  structuredResult._semantic_debug_info = {
                     requested_sections: semSections,
                     raw_response_keys: Object.keys(semanticResult),
                     merged_keys: Object.keys(structuredResult.semantic_analysis_data)
                  };

               } catch (e: any) {
                  console.error("[DualModel] Semantic Analysis Failed:", e);
                  structuredResult._semantic_error = e.message || String(e);
               }
            } else {
               structuredResult._semantic_debug_info = {
                  message: "No semantic sections requested",
                  received_params: semanticAnalysisSections,
                  semantic_model: semanticModel,
                  sem_sections_len: semSections.length,
                  sem_sections_list: semSections
               };
            }

            // ADD BATCH NAME TO RESULT
            if (batchName) {
               structuredResult._batch_name = batchName;
            }

            // JOIN DEBUG INFO (DIAGNOSTIC)
            if (typeof structuredResult === 'object' && structuredResult !== null) {
               structuredResult._model_used = sModel;
               structuredResult._debug_text_length = fullPdfText ? fullPdfText.length : 0;
               structuredResult._debug_text_source = textStoragePath ? 'cache' : 'direct_upload_fallback';
            }

            return structuredResult;
         };

         if (background) {
            // Background mode
            const processingPromise = (async () => {
               try {
                  const result = await executeDualModelAnalysis();

                  // Save to DB
                  const { error: dbError } = await supabaseClient
                     .from('analyses')
                     .insert({
                        tender_id: tenderId,
                        result_json: result,
                        model_used: 'gpt-5-mini'
                     });

                  if (dbError) {
                     console.error("[Background] DB Save Error:", dbError);
                     throw dbError;
                  }

                  console.log("[Background] Analysis saved to DB");

               } catch (error: any) {
                  console.error("[Background] Processing Error:", error);

                  // LOG ERROR TO ANALYSES TABLE SO FRONTEND SEES IT
                  await supabaseClient
                     .from('analyses')
                     .insert({
                        tender_id: tenderId,
                        result_json: {
                           error: `Background Error: ${error.message || String(error)}`,
                           _batch_name: batchName
                        },
                        model_used: 'error'
                     });

                  await supabaseClient
                     .from('tenders')
                     .update({ status: 'failed' })
                     .eq('id', tenderId);
               }
            })();

            // @ts-ignore
            EdgeRuntime.waitUntil(processingPromise);
            return new Response(JSON.stringify({ success: true, message: "Analysis started in background" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
         } else {
            // Synchronous mode
            console.log("[Sync] Starting synchronous analysis...");
            const result = await executeDualModelAnalysis();
            return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
         }
      }

      return new Response(JSON.stringify({ error: `Unknown action: '${action}' (Type: ${typeof action})` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

   } catch (error: any) {
      console.error("Function Error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
   }
})
