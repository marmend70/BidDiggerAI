import 'dotenv/config'; // carica .env
import { createClient } from '@antigravity/client';

const client = createClient({
    apiKey: process.env.ANTIGRAVITY_API_KEY,
});

async function main() {
    try {
        console.log(
            'API key letta:',
            process.env.ANTIGRAVITY_API_KEY ? 'OK' : 'MANCANTE'
        );

        const res = await client.models.list();
        console.log(JSON.stringify(res, null, 2));
    } catch (err) {
        console.error('Errore nella chiamata a models.list():');
        console.error(err);
    }
}

main();
