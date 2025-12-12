import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import { GoogleAIFileManager } from "npm:@google/generative-ai/server";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    const flowLogs: string[] = [];
    const log = (msg: string) => {
        console.log(msg);
        flowLogs.push(`${new Date().toISOString().split('T')[1].slice(0, 8)}: ${msg}`);
    };

    // --- HELPER: Gemini Raw Extraction (Parity with analyze-tender) ---
    const extractWithGeminiRaw = async (fileBlob: Blob, fileName: string): Promise<string | null> => {
        const geminiKey = Deno.env.get('GEMINI_API_KEY');
        if (!geminiKey) {
            log("[GeminiRaw] No API Key found.");
            return null;
        }

        try {
            // 1. Init Upload
            log(`[GeminiRaw] Initializing upload for ${fileName}...`);
            const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}`, {
                method: 'POST',
                headers: {
                    'X-Goog-Upload-Protocol': 'resumable',
                    'X-Goog-Upload-Command': 'start',
                    'X-Goog-Upload-Header-Content-Length': fileBlob.size.toString(),
                    'X-Goog-Upload-Header-Content-Type': 'application/pdf',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ file: { display_name: fileName } })
            });

            if (!initRes.ok) throw new Error(`Init upload failed: ${initRes.status}`);
            const uploadUrl = initRes.headers.get('x-goog-upload-url');
            if (!uploadUrl) throw new Error("No upload URL returned");

            // 2. Upload Bytes
            log(`[GeminiRaw] Uploading bytes...`);
            const uploadRes = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Content-Length': fileBlob.size.toString(),
                    'X-Goog-Upload-Offset': '0',
                    'X-Goog-Upload-Command': 'upload, finalize'
                },
                body: fileBlob
            });
            if (!uploadRes.ok) throw new Error(`Byte upload failed: ${uploadRes.status}`);

            const fileInfo = await uploadRes.json();
            const fileUri = fileInfo.file.uri;
            log(`[GeminiRaw] File uploaded. URI: ${fileUri}`);

            // 3. Wait for Active
            let state = fileInfo.file.state;
            let checks = 0;
            while (state === 'PROCESSING' && checks < 30) {
                await new Promise(r => setTimeout(r, 1000));
                const stateRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/files/${fileInfo.file.name}?key=${geminiKey}`);
                const stateData = await stateRes.json();
                state = stateData.state;
                if (state === 'FAILED') throw new Error("Gemini File Processing Failed");
                checks++;
            }
            if (state === 'PROCESSING') throw new Error("Gemini File Processing Timeout");

            // 4. Generate
            log("[GeminiRaw] Generating content (Primary: 2.5-flash)...");

            // Try Primary (matches analyze-tender)
            try {
                const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
                const genRes = await fetch(genUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { file_data: { mime_type: 'application/pdf', file_uri: fileUri } },
                                { text: "Estrai tutto il testo contenuto in questo documento. Restituisci SOLO il testo estratto." }
                            ]
                        }]
                    })
                });
                if (genRes.ok) {
                    const result = await genRes.json();
                    return result.candidates?.[0]?.content?.parts?.[0]?.text || null;
                }
                log(`[GeminiRaw] Primary failed (${genRes.status}), trying fallback...`);
            } catch (e) {
                log(`[GeminiRaw] Primary except: ${e}`);
            }

            // Fallback (matches analyze-tender: 1.5-flash-002)
            log("[GeminiRaw] Generating content (Fallback: 1.5-flash-002)...");
            const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent?key=${geminiKey}`;
            const fallbackRes = await fetch(fallbackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { file_data: { mime_type: 'application/pdf', file_uri: fileUri } },
                            { text: "Estrai tutto il testo contenuto in questo documento. Restituisci SOLO il testo estratto." }
                        ]
                    }]
                })
            });

            if (!fallbackRes.ok) throw new Error(`Fallback failed: ${fallbackRes.status}`);
            const result = await fallbackRes.json();
            return result.candidates?.[0]?.content?.parts?.[0]?.text || null;

        } catch (e: any) {
            log(`[GeminiRaw] Error: ${e.message}`);
            return null;
        }
    };

    // --- HELPER: LlamaParse Extraction ---
    const extractWithLlamaParse = async (fileBlob: Blob, fileName: string): Promise<string | null> => {
        const llamaKey = Deno.env.get('LLAMA_CLOUD_API_KEY')?.trim();
        if (!llamaKey) {
            log("[LlamaParse] No API Key found, skipping.");
            return null;
        }
        log("[LlamaParse] Key configured: " + llamaKey.substring(0, 5) + "...");

        try {
            log("[LlamaParse] Uploading " + fileName + "...");
            const formData = new FormData();
            formData.append('file', fileBlob, fileName);
            formData.append('premium_mode', 'true');
            formData.append('language', 'it');

            const endpoints = [
                'https://api.cloud.llamaindex.ai/api/parsing',
                'https://api.cloud.eu.llamaindex.ai/api/parsing'
            ];

            let uploadRes;
            let usedEndpoint = '';

            for (const endpoint of endpoints) {
                log("[LlamaParse] Trying endpoint: " + endpoint + " ");
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
                    log("[LlamaParse] Failed on " + endpoint + ": " + err);
                    // Only fail fast on explicit credit exhaustion. 
                    // Region errors (Invalid Key for this region) should continue to next endpoint.
                    if (err.includes("credits")) {
                        log("[LlamaParse] Out of credits, skipping.");
                        return null;
                    }
                }
            }

            if (!uploadRes || !uploadRes.ok) return null;

            const { id: jobId } = await uploadRes.json();
            log("[LlamaParse] Job started: " + jobId);

            let attempts = 0;
            while (attempts < 60) {
                await new Promise(r => setTimeout(r, 2000));
                const statusRes = await fetch(usedEndpoint + "/job/" + jobId, {
                    headers: { 'Authorization': "Bearer " + llamaKey }
                });
                if (!statusRes.ok) break;

                const statusData = await statusRes.json();
                if (statusData.status === 'SUCCESS') {
                    log("[LlamaParse] Success.");
                    const resultRes = await fetch(usedEndpoint + "/job/" + jobId + "/result/markdown", {
                        headers: { 'Authorization': "Bearer " + llamaKey }
                    });
                    if (!resultRes.ok) return null;
                    const resultData = await resultRes.json();
                    return resultData.markdown;
                } else if (statusData.status === 'FAILED') {
                    log("[LlamaParse] Job FAILED.");
                    return null;
                }
                attempts++;
            }
            log("[LlamaParse] Timeout.");
            return null;
        } catch (e: any) {
            log("[LlamaParse] Error: " + e.message);
            return null;
        }
    };

    try {
        const { tenderId, section, question, filePaths, model, forceVisualMode } = await req.json()

        console.log(`[AskQuestion] Request received. forceVisualMode: ${forceVisualMode} (type: ${typeof forceVisualMode})`);

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

        // --- VISUAL MODE (MULTIMODAL) ---
        if (forceVisualMode === true || forceVisualMode === 'true') {
            // --- STRATEGY: Try LlamaParse First -> Fallback to Gemini Raw (Parity with analyze-tender) ---
            let combinedTextContext = "";

            log("[VisualMode] Starting extraction via LlamaParse / Gemini Raw...");

            for (const path of filePaths) {
                if (!path.toLowerCase().endsWith('.pdf')) {
                    log(`[VisualMode] Skipping non-pdf: ${path}`);
                    continue;
                }

                // Download file to memory
                const { data: fileData, error: downloadError } = await supabaseClient.storage.from('tenders').download(path);
                if (downloadError) {
                    log(`[VisualMode] Download error for ${path}: ` + JSON.stringify(downloadError));
                    continue;
                }
                const fileBlob = new Blob([fileData], { type: 'application/pdf' });
                const fileName = path.split('/').pop() || 'document.pdf';

                // 1. Try LlamaParse
                let text = await extractWithLlamaParse(fileBlob, fileName);

                // 2. Fallback directly to Gemini Raw if LlamaParse fails
                if (!text || text.length < 50) {
                    log(`[VisualMode] LlamaParse failed/empty for ${fileName}. Trying Gemini Raw...`);
                    text = await extractWithGeminiRaw(fileBlob, fileName);
                }

                if (text && text.length > 50) {
                    log(`[VisualMode] SUCCESS for ${fileName} (${text.length} chars).`);
                    combinedTextContext += `\n\n--- DOCUMENTO: ${fileName} ---\n${text}`;
                } else {
                    log(`[VisualMode] ALL methods failed for ${fileName}.`);
                }
            }

            // IF WE HAVE TEXT (from LlamaParse OR Gemini), use Standard Text Model
            if (combinedTextContext.length > 200) {
                log("[VisualMode] Extraction complete. Switching to TEXT-BASED inference.");

                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: `SEI UN ESPERTO BID MANAGER. RISPONDI ALLA DOMANDA BASANDOTI SUL TESTO ESTRATTO (OCR).
                   SEZIONE: ${section} 
                   DOMANDA: ${question}`
                        },
                        {
                            role: "user",
                            content: `TESTO DOCUMENTI ESTRATTO:\n${combinedTextContext}`
                        }
                    ]
                });

                const answer = completion.choices[0].message.content;

                // Save QA
                const { data: currentAnalysis } = await supabaseClient.from('analyses').select('result_json').eq('tender_id', tenderId).single();
                if (currentAnalysis) {
                    const resultJson = currentAnalysis.result_json;
                    if (!resultJson.deep_dives) resultJson.deep_dives = {};
                    if (!resultJson.deep_dives[section]) resultJson.deep_dives[section] = [];
                    resultJson.deep_dives[section].push({
                        question,
                        answer,
                        timestamp: new Date().toISOString(),
                        mode: 'visual_hybrid_v2'
                    });
                    await supabaseClient.from('analyses').update({ result_json: resultJson }).eq('tender_id', tenderId);
                }

                return new Response(JSON.stringify({
                    answer,
                    _debug_mode: 'visual_hybrid_v2',
                    _debug_source: 'Hybrid Extraction + GPT-4o',
                    _debug_flow: flowLogs
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            log("[VisualMode] Extraction produced insufficient text. Abort.");
            return new Response(JSON.stringify({
                answer: "⚠️ Impossibile leggere il documento. Tutti i metodi di estrazione (LlamaParse e Gemini) hanno fallito.",
                _debug_mode: 'failed',
                _debug_flow: flowLogs
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            // --- END VISUAL MODE BLOCK --- (The old Gemini logic is unreachable/removed)

            // --- END LLAMAPARSE BLOCK ---

            // Existing Gemini Code follows below...
            const geminiKey = Deno.env.get('GEMINI_API_KEY');
            if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");

            const genAI = new GoogleGenerativeAI(geminiKey);
            const fileManager = new GoogleAIFileManager(geminiKey);

            // USE BEST VISION MODEL: Map user's "2.5" requests or default "Pro" to real 1.5-pro
            // ERROR RECOVERY: 'gemini-1.5-pro' is returning 404. LlamaParse is out of credits.
            // We force 'gemini-2.5-flash' which is proven to work in analyze-tender.
            let visualModelName = 'gemini-2.5-flash';

            if (model && model.includes('flash')) {
                visualModelName = 'gemini-2.5-flash'; // Fallback if they explicitly wanted fast/cheap
            }

            console.log(`[AskQuestion] Using visual model: ${visualModelName} (Mapped from user preference or default)`);

            const geminiModel = genAI.getGenerativeModel({ model: visualModelName });

            const uploadedFiles = [];
            const tempFilesToDelete: string[] = [];

            try {
                // ... (upload logic remains same) ...

                // 1. Upload PDFs
                for (const path of filePaths) {
                    if (!path.toLowerCase().endsWith('.pdf')) continue; // Visual mode mainly for PDFs

                    console.log(`[VisualMode] Downloading and uploading: ${path}`);
                    const { data: fileData, error: downloadError } = await supabaseClient.storage.from('tenders').download(path);
                    if (downloadError) {
                        console.error(`[VisualMode] Download error for ${path}:`, downloadError);
                        continue;
                    }

                    const tempFilePath = `/tmp/${path.split('/').pop()}`;
                    await Deno.writeFile(tempFilePath, new Uint8Array(await fileData.arrayBuffer()));
                    tempFilesToDelete.push(tempFilePath);

                    const uploadResponse = await fileManager.uploadFile(tempFilePath, {
                        mimeType: "application/pdf",
                        displayName: path.split('/').pop(),
                    });

                    console.log(`[VisualMode] Uploaded ${path} as ${uploadResponse.file.name}`);
                    uploadedFiles.push(uploadResponse.file);
                }

                if (uploadedFiles.length === 0) {
                    throw new Error("Nessun PDF valido trovato per la modalità visiva.");
                }

                // 2. Wait for processing
                console.log("[VisualMode] Waiting for files...");
                for (const file of uploadedFiles) {
                    let fileState = file.state;
                    while (fileState === "PROCESSING") {
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                        const fileStatus = await fileManager.getFile(file.name);
                        fileState = fileStatus.state;
                        if (fileState === "FAILED") throw new Error(`File processing failed: ${file.name}`);
                    }
                }

                // 3. Generate Answer
                console.log("[VisualMode] Generating answer with model:", visualModelName);
                const prompt = `SEI UN ESPERTO BID MANAGER. RISPONDI ALLA DOMANDA DELL'UTENTE BASANDOTI SUI DOCUMENTI FORNITI (VISIONE DIRETTA PIXEL-PER-PIXEL).
                   
                   SEZIONE DI RIFERIMENTO: ${section}
                   
                   ISTRUZIONI:
                   1. Analizza visivamente ogni pagina. Il testo potrebbe essere SCANSIONATO o MANOSCRITTO.
                   2. Sii preciso e diretto.
                   3. Cita i documenti o le pagine se possibile.
                   4. Rispondi in italiano.
                   5. IMPORTANTISSIMO: Fai del tuo meglio per decifrare il testo anche se di bassa qualità. NON arrenderti dicendo "non riesco a leggere" se c'è anche una minima possibilità di interpretare i caratteri.
                   
                   DOMANDA: ${question}`;

                const result = await geminiModel.generateContent([
                    { text: prompt },
                    ...uploadedFiles.map(f => ({ fileData: { mimeType: f.mimeType, fileUri: f.uri } }))
                ]);

                const answer = result.response.text();

                // 4. Save QA (Shared Logic)
                const { data: currentAnalysis } = await supabaseClient
                    .from('analyses')
                    .select('result_json')
                    .eq('tender_id', tenderId)
                    .single();

                if (currentAnalysis) {
                    const resultJson = currentAnalysis.result_json;
                    if (!resultJson.deep_dives) resultJson.deep_dives = {};
                    if (!resultJson.deep_dives[section]) resultJson.deep_dives[section] = [];

                    resultJson.deep_dives[section].push({
                        question,
                        answer,
                        timestamp: new Date().toISOString(),
                        mode: 'visual' // Track that this was visual
                    });

                    await supabaseClient
                        .from('analyses')
                        .update({ result_json: resultJson })
                        .eq('tender_id', tenderId);
                }

                // 5. Return
                return new Response(JSON.stringify({ answer, _debug_mode: 'visual' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            } catch (e: any) {
                console.error("[VisualMode] Error:", e);
                // Fallback or Error? If visual mode requested explicitly, we should error out if it fails.
                throw new Error(`Visual Mode Failed: ${e.message}`);
            } finally {
                // Cleanup
                for (const f of uploadedFiles) {
                    try { await fileManager.deleteFile(f.name); } catch (e) { console.error("Cleanup remote failed", e); }
                }
                for (const p of tempFilesToDelete) {
                    try { await Deno.remove(p); } catch (e) { console.error("Cleanup local failed", e); }
                }
            }
        }

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
                   5. IMPORTANTISSIMO: Se il testo dei documenti ("DOCUMENTI") qui sotto appare VUOTO, illeggibile, contiene solo "[TESTO VUOTO]" o sembra composto da caratteri strani (es. OCR fallito), OPPURE se non riesci a trovare ALCUNA informazione utile a causa della scarsa qualità del testo, INIZIA LA TUA RISPOSTA CON LA STRINGA ESATTA: "[[SCAN_DETECTED]]".
                   
                   DOMANDA: ${question}
                   
                   DOCUMENTI:
                   ${fullPdfText}`;

                const result = await geminiModel.generateContent(prompt);
                answer = result.response.text();

            } else {
                // --- OPENAI LOGIC ---
                try {
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
                       4. Rispondi in italiano.
                       5. IMPORTANTISSIMO: Se il testo dei documenti che ti fornirà l'utente appare VUOTO, illeggibile, contiene solo "[TESTO VUOTO]" o sembra composto da caratteri strani (es. OCR fallito), OPPURE se non riesci a trovare ALCUNA informazione utile a causa della scarsa qualità del testo, INIZIA LA TUA RISPOSTA CON LA STRINGA ESATTA: "[[SCAN_DETECTED]]".`
                            },
                            {
                                role: "user",
                                content: `DOMANDA: ${question}\n\nDOCUMENTI:\n${fullPdfText}`
                            }
                        ]
                    });
                    answer = completion.choices[0].message.content;
                } catch (openaiError) {
                    console.error("[AskQuestion] OpenAI failed:", openaiError);
                    console.log("[AskQuestion] Falling back to Gemini 2.5 Flash...");

                    // FALLBACK TO GEMINI
                    const geminiKey = Deno.env.get('GEMINI_API_KEY');
                    if (!geminiKey) throw new Error("GEMINI_API_KEY is missing (and OpenAI also failed)");
                    const { GoogleGenerativeAI } = await import("npm:@google/generative-ai");
                    const genAI = new GoogleGenerativeAI(geminiKey);
                    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

                    const prompt = `SEI UN ESPERTO BID MANAGER. RISPONDI ALLA DOMANDA DELL'UTENTE BASANDOTI SUI DOCUMENTI FORNITI.
                     SEZIONE: ${section}
                     DOMANDA: ${question}
                     DOCUMENTI: ${fullPdfText}
                     
                     ISTRUZIONI: Rispondi in italiano. Se il testo è illeggibile, rispondi "[[SCAN_DETECTED]]".`;

                    const result = await geminiModel.generateContent(prompt);
                    answer = result.response.text();
                }
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

            return new Response(JSON.stringify({ answer, _debug_mode: 'standard', _debug_param: forceVisualMode }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

        } catch (e: any) {
            console.error("[AskQuestion] OpenAI Error Full Object:", JSON.stringify(e, null, 2));
            console.error("[AskQuestion] OpenAI Error Message:", e.message);
            throw new Error(`OpenAI API Error (${e.status || 'Unknown Status'}): ${e.message || e}`);
        }

    } catch (error: any) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({
            answer: `⚠️ ERRORE BACKEND CRITICO: ${error.message}`,
            _debug_error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
            _debug_flow: flowLogs
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
