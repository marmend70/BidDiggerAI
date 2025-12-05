import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.28.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    try {
        const { tenderId, section, question, filePaths, model } = await req.json()

        if (!tenderId || !question || !filePaths) {
            throw new Error("Missing required fields");
        }

        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Initialize OpenAI
        const apiKey = Deno.env.get('OPENAI_API_KEY');
        if (!apiKey) {
            throw new Error("OPENAI_API_KEY is missing");
        }
        const openai = new OpenAI({ apiKey: apiKey });

        console.log(`[AskQuestion] Processing question for tenderId: ${tenderId}, section: ${section}`);

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
                const TIMEOUT_MS = 20000; // 20 seconds hard timeout

                try {
                    // Try User's Preferred Model (2.5)
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

                    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
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
                    console.warn("[GeminiExtract] Primary model failed or timed out, trying fallback (1.5-flash)...", primaryError);

                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 15000);

                        const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
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

                        if (!fallbackRes.ok) throw new Error(`Fallback model failed: ${fallbackRes.status} ${await fallbackRes.text()}`);
                        const result = await fallbackRes.json();
                        text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                    } catch (fallbackError) {
                        console.error("[GeminiExtract] ALL Gemini models failed/timed out.", fallbackError);
                        throw new Error("Gemini Extraction Failed (All Models). Local fallback disabled to prevent crash.");
                    }
                }

                // 5. Cleanup (Delete File)
                fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileInfo.file.name}?key=${geminiKey}`, { method: 'DELETE' }).catch(e => console.error("Cleanup failed:", e));

                if (!text) throw new Error("No text returned");

                console.log(`[GeminiExtract] Success. Extracted ${text.length} chars.`);
                return text;

            } catch (e: any) {
                console.error("[GeminiExtract] Failed:", e);
                // if (e.message && e.message.includes("Local fallback disabled")) {
                //     throw e;
                // }
                return null;
            }
        };

        // --- HELPER: Extract Text ---
        const extractTextFromFiles = async () => {
            let fullPdfText = "";
            const MAX_TOTAL_CHARS = 300000; // Slightly lower for deep dive
            const fileCount = filePaths.length;
            let perFileLimit = Math.floor(MAX_TOTAL_CHARS / fileCount);
            if (perFileLimit < 50000) perFileLimit = 50000;
            if (perFileLimit > 150000) perFileLimit = 150000;

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

                        // 1. Try Gemini extraction (Primary)
                        console.log("[Extract] Using Gemini extraction (Primary) for " + filePath);
                        const geminiText = await extractWithGemini(fileData, filePath.split('/').pop() || 'doc.pdf');

                        if (geminiText) {
                            extractedText = geminiText;
                        } else {
                            // 2. Last Resort: Standard extraction (High CPU)
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
                                        setTimeout(() => reject(new Error("PDF parsing timeout")), 10000)
                                    );
                                    const { text } = await Promise.race([parsePromise, pdfTimeoutPromise]) as any;
                                    extractedText = Array.isArray(text) ? text.join("\n") : text;
                                } catch (e) {
                                    console.error("[Extract] PDF parsing failed/timeout for " + filePath + ":", e);
                                    extractedText = "[ERRORE LETTURA PDF: Timeout o formato non supportato]";
                                }
                            }
                        }

                        extractedText = extractedText.trim();
                        if (!extractedText) extractedText = "[TESTO VUOTO]";

                        if (extractedText.length > perFileLimit) {
                            console.log("[Extract] Truncating text from " + extractedText.length + " to " + perFileLimit);
                            extractedText = extractedText.substring(0, perFileLimit) + "\n...[TRONCATO]...";
                        }

                        fileResult = "\n=== INIZIO FILE: " + filePath + " ===\n" + extractedText + "\n=== FINE FILE: " + filePath + " ===\n";
                    }
                } catch (e: any) {
                    console.error(`[Extract] Error processing ${filePath}:`, e);
                    fileResult = `\n=== ERRORE GENERICO: ${filePath} (${e.message || e}) ===\n`;
                }
                fullPdfText += fileResult;
            }
            return fullPdfText;
        };

        let fullPdfText = "";

        // OPTIMIZATION: Try to fetch pre-extracted text first
        try {
            const storagePath = `${tenderId}/extracted_text.txt`;
            console.log(`[AskQuestion] Checking for pre-extracted text at: ${storagePath}`);
            const { data, error } = await supabaseClient.storage.from('tenders').download(storagePath);

            if (!error && data) {
                fullPdfText = await data.text();
                console.log(`[AskQuestion] Loaded pre-extracted text (${fullPdfText.length} chars)`);

                // CHECK FOR BAD CACHE: If the stored text contains errors, discard it and force re-extraction
                if (fullPdfText.includes("ERRORE GENERICO") || fullPdfText.includes("ERRORE DOWNLOAD") || fullPdfText.includes("[TESTO VUOTO]")) {
                    console.warn("[AskQuestion] Detected error markers in cached text. Discarding cache and forcing re-extraction.");
                    fullPdfText = "";
                }
            }
        } catch (e) {
            console.warn("[AskQuestion] Failed to load pre-extracted text, falling back to processing:", e);
        }

        // Fallback: Process files if pre-extracted text not found
        if (!fullPdfText) {
            console.log("[AskQuestion] Pre-extracted text not found. Processing files...");
            fullPdfText = await extractTextFromFiles();
        }

        // DEBUG: If extraction failed, return the error directly
        if (fullPdfText.includes("ERRORE GENERICO") || fullPdfText.includes("ERRORE DOWNLOAD")) {
            return new Response(JSON.stringify({ answer: "SI È VERIFICATO UN ERRORE TECNICO DURANTE L'ESTRAZIONE DEL TESTO.\n\nEcco i dettagli dell'errore (copia e incolla questo messaggio all'assistenza):\n\n" + fullPdfText }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        console.log(`[AskQuestion] Sending request to AI Model (${model || 'gpt-5-mini'})...`);
        try {
            let answer = "";

            if (model && model.startsWith('gemini')) {
                // --- GOOGLE GEMINI LOGIC ---
                const geminiKey = Deno.env.get('GEMINI_API_KEY');
                if (!geminiKey) {
                    throw new Error("GEMINI_API_KEY is missing");
                }
                const { GoogleGenerativeAI } = await import("npm:@google/generative-ai");
                const genAI = new GoogleGenerativeAI(geminiKey);

                // Use exact model IDs as requested
                const geminiModelName = model;

                const geminiModel = genAI.getGenerativeModel({ model: geminiModelName });

                const prompt = `SEI UN ESPERTO BID MANAGER. RISPONDI ALLA DOMANDA DELL'UTENTE BASANDOTI ESCLUSIVAMENTE SUI DOCUMENTI FORNITI.
                   
                   SEZIONE DI RIFERIMENTO: ${section}
                   
                   ISTRUZIONI:
                   1. Sii preciso e diretto.
                   2. Cita i documenti o le pagine se possibile (es. "come indicato nel Disciplinare...").
                   3. Se l'informazione non è presente nei documenti, dillo chiaramente.
                   4. Rispondi in italiano.
                   
                   DOMANDA: ${question}
                   
                   DOCUMENTI:
                   ${fullPdfText}`;

                const result = await geminiModel.generateContent(prompt);
                answer = result.response.text();

            } else {
                // --- OPENAI LOGIC ---
                const completion = await openai.chat.completions.create({
                    model: model || "gpt-5-mini",
                    messages: [
                        {
                            role: "system",
                            content: `SEI UN ESPERTO BID MANAGER. RISPONDI ALLA DOMANDA DELL'UTENTE BASANDOTI ESCLUSIVAMENTE SUI DOCUMENTI FORNITI.
                   
                   SEZIONE DI RIFERIMENTO: ${section}
                   
                   ISTRUZIONI:
                   1. Sii preciso e diretto.
                   2. Cita i documenti o le pagine se possibile (es. "come indicato nel Disciplinare...").
                   3. Se l'informazione non è presente nei documenti, dillo chiaramente.
                   4. Rispondi in italiano.`
                        },
                        {
                            role: "user",
                            content: `DOMANDA: ${question}\n\nDOCUMENTI:\n${fullPdfText}`
                        }
                    ]
                });
                answer = completion.choices[0].message.content;
            }

            // Save the Q&A to the database (update the analysis record)
            const { data: currentAnalysis, error: fetchError } = await supabaseClient
                .from('analyses')
                .select('result_json')
                .eq('tender_id', tenderId)
                .single();

            if (fetchError) {
                console.error("Error fetching analysis:", fetchError);
            } else {
                const resultJson = currentAnalysis.result_json;
                if (!resultJson.deep_dives) {
                    resultJson.deep_dives = {};
                }
                if (!resultJson.deep_dives[section]) {
                    resultJson.deep_dives[section] = [];
                }

                resultJson.deep_dives[section].push({
                    question,
                    answer,
                    timestamp: new Date().toISOString()
                });

                await supabaseClient
                    .from('analyses')
                    .update({ result_json: resultJson })
                    .eq('tender_id', tenderId);
            }

            return new Response(JSON.stringify({ answer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        } catch (e: any) {
            console.error("[AskQuestion] OpenAI Error Full Object:", JSON.stringify(e, null, 2));
            console.error("[AskQuestion] OpenAI Error Message:", e.message);
            throw new Error(`OpenAI API Error (${e.status || 'Unknown Status'}): ${e.message || e}`);
        }

    } catch (error) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
