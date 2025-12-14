
import OpenAI from 'https://esm.sh/openai@4.52.0';

export class OpenAIAssistantManager {
    private client: OpenAI;

    constructor(apiKey: string) {
        this.client = new OpenAI({
            apiKey,
            defaultHeaders: { 'OpenAI-Beta': 'assistants=v2' }
        });
    }

    async uploadFile(fileBlob: Blob, fileName: string): Promise<string> {
        console.log(`[OpenAI] Uploading file: ${fileName}`);
        // OpenAI expects a File object or ReadStream.
        // In Deno/Edge, we can construct a File from Blob.
        const file = new File([fileBlob], fileName, { type: 'application/pdf' });

        const uploaded = await this.client.files.create({
            file: file,
            purpose: 'assistants',
        });
        console.log(`[OpenAI] File uploaded: ${uploaded.id}`);
        return uploaded.id;
    }

    async createAssistant(fileIds: string[]): Promise<string> {
        console.log(`[OpenAI] Creating Assistant with ${fileIds.length} files...`);
        const assistant = await this.client.beta.assistants.create({
            name: "Tender Analyzer Bot",
            instructions: "Sei un esperto analista di gare d'appalto. Il tuo compito è leggere attentamente i documenti PDF forniti ed estrarre il contenuto richiesto mantenendo la struttura originale (tabelle, elenchi, importi).",
            model: "gpt-4o-mini",
            tools: [{ type: "file_search" }],
            tool_resources: {
                file_search: {
                    vector_stores: [{
                        file_ids: fileIds
                    }]
                }
            }
        }, { headers: { 'OpenAI-Beta': 'assistants=v2' } });
        console.log(`[OpenAI] Assistant created: ${assistant.id}`);
        return assistant.id;
    }

    async runAnalysis(assistantId: string, prompt: string): Promise<string> {
        console.log(`[OpenAI] Starting Thread and Run...`);

        // Create Thread and Run in one go
        const run = await this.client.beta.threads.createAndRun({
            assistant_id: assistantId,
            thread: {
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    }
                ]
            }
        }, { headers: { 'OpenAI-Beta': 'assistants=v2' } });

        console.log(`[OpenAI] Run started: ${run.id}. Polling...`);

        // Poll for completion
        let runStatus = await this.client.beta.threads.runs.retrieve(run.thread_id, run.id);
        const startTime = Date.now();
        const TIMEOUT = 300000; // 5 minutes

        while (runStatus.status !== 'completed') {
            if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
                throw new Error(`OpenAI Run Failed: ${runStatus.status} - ${runStatus.last_error?.message}`);
            }

            if (Date.now() - startTime > TIMEOUT) {
                throw new Error("OpenAI Run Timed Out");
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            runStatus = await this.client.beta.threads.runs.retrieve(run.thread_id, run.id);
        }

        console.log(`[OpenAI] Run completed! Retrieving messages...`);

        // Get Messages
        const messages = await this.client.beta.threads.messages.list(run.thread_id);

        // Extract text from the last assistant message
        const lastMsg = messages.data
            .filter(m => m.role === 'assistant')
            .shift(); // Get the most recent one

        if (!lastMsg || !lastMsg.content || lastMsg.content.length === 0) {
            return "";
        }

        const contentBlock = lastMsg.content[0];
        if (contentBlock.type === 'text') {
            return contentBlock.text.value;
        }

        return "";
    }

    async cleanup(fileIds: string[], assistantId: string) {
        console.log(`[OpenAI] Cleaning up resources...`);
        try {
            if (assistantId) await this.client.beta.assistants.del(assistantId);
        } catch (e) {
            console.warn(`[OpenAI] Failed to delete assistant: ${e}`);
        }

        for (const fid of fileIds) {
            try {
                await this.client.files.del(fid);
            } catch (e) {
                console.warn(`[OpenAI] Failed to delete file ${fid}: ${e}`);
            }
        }
    }
}
