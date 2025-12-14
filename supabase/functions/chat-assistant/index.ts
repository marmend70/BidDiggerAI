import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "npm:@google/generative-ai";
import OpenAI from 'https://esm.sh/openai@4.28.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { tenderId, messages, model } = await req.json()

        if (!tenderId || !messages) {
            throw new Error("Missing required fields: tenderId or messages");
        }

        // Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Default to Gemini 2.5 Flash as requested
        let modelName = model || 'gemini-2.5-flash';
        console.log(`[ChatAssistant] Using model: ${modelName}`);

        // 0. Fetch Tender Owner for Storage Path (Required to locate file)
        const { data: tenderData, error: tenderError } = await supabaseClient
            .from('tenders')
            .select('user_id')
            .eq('id', tenderId)
            .single();

        if (tenderError || !tenderData) {
            console.error("Failed to find tender owner:", tenderError);
            // Verify if we can proceed? No, path needs userId.
            // Assume path might be without userId for legacy? No, standardize.
        }
        const userId = tenderData?.user_id;


        // 1. Fetch Context (Extracted Text)
        // Optimization: Try to minimize context loading if conversation is long, but for now we simple-load context.
        // We reuse the logic from ask-question: look for pre-extracted text.
        let fullPdfText = "";
        try {
            // Fix: Path requires userId
            const storagePath = userId ? `${userId}/${tenderId}/extracted_text.txt` : `${tenderId}/extracted_text.txt`;
            console.log(`[ChatAssistant] Loading context from: ${storagePath}`);
            const { data, error } = await supabaseClient.storage.from('tenders').download(storagePath);
            if (!error && data) {
                fullPdfText = await data.text();
            }
        } catch (e) {
            console.error("Failed to load context:", e);
        }

        if (!fullPdfText) {
            fullPdfText = "[NESSUN DOCUMENTO DISPONIBILE O ERRORE NEL CARICAMENTO]";
        }

        // Truncate context if too massive (Gemini 1.5 has huge context but let's be safe/fast)
        const MAX_CONTEXT_CHARS = 500000;
        if (fullPdfText.length > MAX_CONTEXT_CHARS) {
            fullPdfText = fullPdfText.substring(0, MAX_CONTEXT_CHARS) + "\n...[TRUNCATED]";
        }

        // 2. Construct System Instruction
        const systemInstructionText = `
SEI "BID DIGGER ASSISTANT", UN'INTELLIGENZA ARTIFICIALE SPECIALIZZATA NELL'ANALISI DI GARE D'APPALTO.
SEI INTEGRATO NEL SOFTWARE "BID DIGGER AI".

IL TUO RUOLO:
1.  Assistere l'utente (Bid Manager, Proposal Engineer) nell'analisi ESCLUSIVA della gara corrente.
2.  Rispondere a domande basandoti **SOLO ED ESCLUSIVAMENTE** sui documenti forniti qui sotto (CONTESTO DOCUMENTI GARA).
3.  Se l'informazione richiesta NON è presente nei documenti, DEVI rispondere: "Non ho trovato questa informazione nei documenti della gara analizzata."
4.  NON usare conoscenze generali, esterne o pregresse per rispondere a domande specifiche sulla gara (es. scadenze, requisiti, importi). Usa solo il testo fornito.
5.  Se l'utente scrive esplicitamente "Cerca su internet:", allora (e solo allora) puoi usare strumenti esterni o conoscenze generali se i documenti non bastano.

REGOLE DI COMPORTAMENTO:
-   Sii professionale e diretto.
-   Cita sempre la fonte ("come indicato nel Disciplinare...", "a pag. 3 del Capitolato...") quando trovi l'info.
-   Se i documenti allegati sono vuoti o illeggibili, dillo chiaramente.

CONTESTO DOCUMENTI GARA (RAG):
${fullPdfText}
`;

        let responseText = "";

        // --- BRANCH: OPENAI (GPT-*) ---
        if (modelName.toLowerCase().startsWith('gpt')) {
            console.log("[ChatAssistant] Using OpenAI Provider");

            const apiKey = Deno.env.get('OPENAI_API_KEY');
            if (!apiKey) throw new Error("OPENAI_API_KEY is missing");
            const openai = new OpenAI({ apiKey: apiKey });

            // Normalize model name for API if needed (e.g. gpt-5.2 might need specific ID if not public yet)
            let apiModel = modelName;

            // Prepare messages
            const openAiMessages = [
                { role: "system", content: systemInstructionText },
                ...messages.map((m: any) => ({
                    role: m.role === 'model' ? 'assistant' : 'user',
                    content: m.content
                }))
            ];

            const completion = await openai.chat.completions.create({
                model: apiModel,
                messages: openAiMessages as any,
            });

            responseText = completion.choices[0]?.message?.content || "";

        }
        // --- BRANCH: GEMINI (gemini-*) ---
        else {
            console.log("[ChatAssistant] Using Gemini Provider");

            const geminiKey = Deno.env.get('GEMINI_API_KEY');
            if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");
            const genAI = new GoogleGenerativeAI(geminiKey);

            // Re-usable chat execution function
            const executeChat = async (targetModelId: string) => {
                console.log(`[ChatAssistant] Attempting generation with ${targetModelId}...`);

                const lastMsg = messages[messages.length - 1];
                const isSearchRequest = lastMsg.content.toLowerCase().startsWith("cerca su internet:");

                let tools = [];
                if (isSearchRequest) {
                    console.log("Search trigger detected.");
                    tools.push({ googleSearch: {} });
                }

                const generativeModel = genAI.getGenerativeModel({
                    model: targetModelId,
                    tools: tools,
                    systemInstruction: {
                        parts: [{ text: systemInstructionText }],
                        role: "system"
                    }
                });

                // 3. Prepare History for Gemini
                let chatHistory = messages.map((m: any) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }));

                // Remove the very last message from history because sendMessage(msg) takes the new message as arg
                let newMsgContent = "";
                if (chatHistory.length > 0) {
                    const lastMsg = chatHistory.pop();
                    newMsgContent = lastMsg.parts[0].text;
                }

                // SANITIZATION: Remove leading 'model' messages.
                while (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
                    chatHistory.shift();
                }

                const chat = generativeModel.startChat({
                    history: chatHistory,
                });

                // 4. Generate Response
                const result = await chat.sendMessage(newMsgContent);
                return result.response.text();
            };

            try {
                responseText = await executeChat(modelName); // Try Default (2.5 Flash)
            } catch (e: any) {
                console.error(`[ChatAssistant] Primary model ${modelName} failed:`, e);

                // FALLBACK LOGIC: If 2.5 Flash fails, try 3 Pro Preview
                if (modelName === 'gemini-2.5-flash') {
                    console.warn("[ChatAssistant] Fallback: Retrying with gemini-3-pro-preview...");
                    try {
                        responseText = await executeChat('gemini-3-pro-preview');
                    } catch (retryErr: any) {
                        throw new Error(`Chat Failed (Total Failure): ${e.message} -> ${retryErr.message}`);
                    }
                } else {
                    throw e; // Rethrow if not our target model
                }
            }

            console.log(`[ChatAssistant] Success.`);
        }

        return new Response(JSON.stringify({
            answer: responseText,
            _debug_model: modelName
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error("[ChatAssistant] Critical Error:", error);
        // Return 200 with error field so frontend reads it instead of throwing "non-2xx"
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
