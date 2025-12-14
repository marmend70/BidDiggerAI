
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- HELPER: Upload to Google AI (Copied/Adapted from utils.ts) ---
const uploadFileToGoogleAI = async (file: File, apiKey: string): Promise<any> => {
    const metaData = { mimeType: file.type, displayName: file.name };
    // 1. Start Resumable Upload
    const startUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`;
    const startResp = await fetch(startUrl, {
        method: 'POST',
        headers: { 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Header-Content-Length': file.size.toString(), 'X-Goog-Upload-Header-Content-Type': file.type, 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: metaData })
    });
    if (!startResp.ok) throw new Error(`Upload Init Failed: ${startResp.statusText}`);
    const uploadUrl = startResp.headers.get('x-goog-upload-url');
    if (!uploadUrl) throw new Error("No upload URL returned");

    // 2. Upload Bytes
    const uploadResp = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Length': file.size.toString(), 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' },
        body: file
    });
    if (!uploadResp.ok) throw new Error(`Upload Failed: ${uploadResp.statusText}`);
    const uploadResult = await uploadResp.json();
    return { fileUri: uploadResult.file.uri, mimeType: uploadResult.file.mimeType };
};

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { tenderId, messages, model, filePaths, analysisContext } = await req.json();

        if (!messages) throw new Error("Missing messages");

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        const geminiKey = Deno.env.get('GEMINI_API_KEY');
        if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");

        const genAI = new GoogleGenerativeAI(geminiKey);
        const modelName = model || 'gemini-2.5-flash';

        console.log(`[ChatAssistant] Model: ${modelName}, Files: ${filePaths?.length || 0}, Context: ${!!analysisContext}`);

        // 1. Prepare Files (Native API)
        const fileParts: any[] = [];
        if (filePaths && filePaths.length > 0) {
            console.log(`[ChatAssistant] Processing ${filePaths.length} files...`);
            for (const path of filePaths) {
                const { data, error } = await supabaseClient.storage.from('tenders').download(path);
                if (data) {
                    try {
                        const arrayBuffer = await data.arrayBuffer();
                        const fileName = path.split('/').pop() || 'doc.pdf';
                        const mimeType = fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'text/plain';
                        const fileObj = new File([arrayBuffer], fileName, { type: mimeType });

                        console.log(`[ChatAssistant] Uploading ${fileName}...`);
                        const result = await uploadFileToGoogleAI(fileObj, geminiKey);
                        fileParts.push({
                            fileData: { mimeType: result.mimeType, fileUri: result.fileUri }
                        });
                    } catch (e) {
                        console.error(`[ChatAssistant] Upload failed for ${path}:`, e);
                    }
                } else if (error) {
                    console.error(`[ChatAssistant] Download failed for ${path}:`, error);
                }
            }
        }

        // 2. Construct System Instruction with Analysis Context
        let systemInstructionText = `
SEI "BID DIGGER ASSISTANT", UN'INTELLIGENZA ARTIFICIALE SPECIALIZZATA NELL'ANALISI DI GARE D'APPALTO.
IL TUO RUOLO:
1. Assistere l'utente (Bid Manager) nell'analisi della gara.
2. Rispondere basandoti **SUI DOCUMENTI FORNITI** (allegati alla chat) e **SUI DATI DI ANALISI** (JSON) se disponibili.
3. Se l'informazione NON è nei documenti o nel JSON, rispondi: "Non ho trovato questa informazione nei documenti della gara analizzata."
4. Se l'utente scrive "Cerca su internet:", USA LO STRUMENTO DI RICERCA GOOGLE per trovare informazioni aggiornate (es. decreti, indici ISTAT, news aziende).
5. Sii professionale, cita la fonte (pag. X o sezione Y).
`;

        if (analysisContext) {
            const contextString = JSON.stringify(analysisContext, null, 2).substring(0, 100000); // Fail-safe truncate
            systemInstructionText += `\n\nDATI DI ANALISI GIA ESTRATTI (JSON):\n${contextString}\nUSALI COME RIFERIMENTO PRIMARIO se la risposta è certa.`;
        }

        // 3. Prepare Chat History
        // We need to inject the files. Best strategy: consistent "Ghost" message at start.
        // OR, check if this is a fresh session.
        // Simplified: We reconstruct history from `messages`.
        // We insert a System-like User message at index 0 containing the files.

        let chatHistory = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }]
        }));

        // SANITIZATION: Remove leading 'model' messages (e.g. Welcome message)
        while (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
            chatHistory.shift();
        }

        // Remove the Newest User Message (it will be passed to sendMessage)
        let newMsgContent = "";
        let newMsgIsSearch = false;

        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
            const lastMsg = chatHistory.pop();
            newMsgContent = lastMsg.parts[0].text;
            if (newMsgContent.toLowerCase().startsWith('cerca su internet:')) {
                newMsgIsSearch = true;
            }
        }

        // Inject Files into the VERY FIRST message (User role) if not empty
        // Or create a prepended message.
        if (fileParts.length > 0) {
            const fileMessage = {
                role: 'user',
                parts: [
                    { text: "Ecco i documenti ufficiali della gara. Analizzali per rispondere alle mie domande." },
                    ...fileParts
                ]
            };
            const ackMessage = {
                role: 'model',
                parts: [{ text: "Ho ricevuto i documenti e i dati di analisi. Sono pronto a rispondere." }]
            };
            // Prepend to history
            chatHistory = [fileMessage, ackMessage, ...chatHistory];
        }

        // 4. Configure Tools
        const tools = [];
        if (newMsgIsSearch) {
            tools.push({ googleSearch: {} });
        }

        const generativeModel = genAI.getGenerativeModel({
            model: modelName,
            tools: tools,
            systemInstruction: { parts: [{ text: systemInstructionText }], role: "system" }
        });

        const chat = generativeModel.startChat({ history: chatHistory });

        console.log(`[ChatAssistant] Sending message: "${newMsgContent.substring(0, 50)}..."`);
        const result = await chat.sendMessage(newMsgContent);
        const responseText = result.response.text();

        return new Response(JSON.stringify({ answer: responseText }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        console.error("[ChatAssistant] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
});
