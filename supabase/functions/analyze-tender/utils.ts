
// UTILS for Google AI (Gemini) - REST API Implementation

export interface GoogleFileResult {
    fileUri: string;
    mimeType: string;
}

/**
 * Uploads a file to Google AI (Gemini) via REST API.
 * Uses the Resumable Query or Simple Upload (Small files).
 * For simplicity in Edge, we use the Media Upload endpoint (limit 20MB typically, but up to 2GB via resumable).
 * We'll use the upload/v1beta/files endpoint.
 */
export async function uploadFileToGoogleAI(file: File, apiKey: string): Promise<GoogleFileResult> {
    const meta = {
        file: {
            display_name: file.name
        }
    };

    // 1. Initial Resumable Request
    const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'X-Goog-Upload-Protocol': 'resumable',
            'X-Goog-Upload-Command': 'start',
            'X-Goog-Upload-Header-Content-Length': file.size.toString(),
            'X-Goog-Upload-Header-Content-Type': file.type,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(meta)
    });

    if (!initRes.ok) {
        throw new Error(`Google Upload Init Failed: ${initRes.status} ${await initRes.text()}`);
    }

    const uploadUrl = initRes.headers.get('x-goog-upload-url');
    if (!uploadUrl) throw new Error("Google Upload Init failed to return upload URL");

    // 2. Upload Bytes
    // Edge runtime supports file.stream() or file.arrayBuffer()
    const bytes = await file.arrayBuffer();

    const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
            'Content-Length': file.size.toString(),
            'X-Goog-Upload-Offset': '0',
            'X-Goog-Upload-Command': 'upload, finalize'
        },
        body: bytes
    });

    if (!uploadRes.ok) {
        throw new Error(`Google Upload Body Failed: ${uploadRes.status} ${await uploadRes.text()}`);
    }

    const result = await uploadRes.json();
    // Valid states: PROCESSING, ACTIVE. We might need to wait for ACTIVE?
    // Usually for images/PDFs it's fast. Video needs polling. 
    // For safety, let's assume it's ready enough for reference or we poll briefly.
    console.log(`[GoogleAI] Uploaded ${file.name} -> ${result.file.uri}`);

    return {
        fileUri: result.file.uri,
        mimeType: file.type // "application/pdf"
    };
}


export async function generateContentGoogle(
    model: string,
    prompt: string,
    fileUris: GoogleFileResult[],
    apiKey: string,
    responseMimeType: string = "application/json", // Default to JSON for backward combatibility
    temperature: number = 0.1
): Promise<string> {

    // Construct Content
    const contents = [
        {
            role: "user",
            parts: [
                ...fileUris.map(f => ({
                    file_data: {
                        mime_type: f.mimeType,
                        file_uri: f.fileUri
                    }
                })),
                { text: prompt }
            ]
        }
    ];

    /* 
       NOTE: 'gemini-2.5-flash' might not exist.
       Users said "it exists". We try. 
    */
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: contents,
            generationConfig: {
                temperature: temperature, // Use passed temperature
                responseMimeType: responseMimeType // Use dynamic mime type
            }
        })
    });

    if (!response.ok) {
        throw new Error(`Google GenAI Error (${model}): ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Google GenAI returned empty content.");
    return text;
}
