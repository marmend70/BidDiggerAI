import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const crypto = globalThis.crypto;

Deno.serve(async (req) => {
    const secret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
    if (!secret) {
        console.error('LEMON_SQUEEZY_WEBHOOK_SECRET not set');
        return new Response('Config Error', { status: 500 });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const signature = req.headers.get('x-signature');
    if (!signature) {
        return new Response('No signature', { status: 401 });
    }

    const rawBody = await req.text();

    // Verify signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
    );

    const verified = await crypto.subtle.verify(
        'HMAC',
        key,
        hexToUint8Array(signature),
        encoder.encode(rawBody)
    );

    if (!verified) {
        console.error('Invalid signature');
        return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;

    console.log(`Received event: ${eventName}`);

    if (eventName === 'order_created') {
        const { data } = payload;
        const { attributes } = data;
        const { first_order_item } = attributes;

        // We expect user_id in custom_data
        // When creating the checkout link, we must pass ?checkout[custom][user_id]=<USER_ID>
        const userId = payload.meta.custom_data?.user_id;

        if (!userId) {
            console.error('No user_id in custom_data');
            // We return 200 to acknowledge the webhook so they don't retry, but we log the error.
            return new Response('No user_id provided', { status: 200 });
        }

        const productName = first_order_item.product_name;
        console.log(`Processing order for product: ${productName}, user: ${userId}`);

        let creditsToAdd = 0;

        if (productName.includes('Starter')) creditsToAdd = 5;
        else if (productName.includes('Pro')) creditsToAdd = 10;
        else if (productName.includes('Agency')) creditsToAdd = 25;

        if (creditsToAdd > 0) {
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            // Get current credits
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', userId)
                .single();

            if (fetchError) {
                console.error('Error fetching profile:', fetchError);
                return new Response('Error fetching profile', { status: 500 });
            }

            // Handle case where credits is null (first time)
            const currentCredits = profile.credits || 0;
            const newCredits = currentCredits + creditsToAdd;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ credits: newCredits })
                .eq('id', userId);

            if (updateError) {
                console.error('Error updating credits:', updateError);
                return new Response('Error updating credits', { status: 500 });
            }

            console.log(`Successfully added ${creditsToAdd} credits to user ${userId}. New balance: ${newCredits}`);
        } else {
            console.log('No credits associated with this product name.');
        }
    }

    return new Response('Webhook processed', { status: 200 });
});

function hexToUint8Array(hexString: string) {
    return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}
