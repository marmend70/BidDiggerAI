
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactRequest {
    type: 'CONTACT';
    payload: {
        firstName: string;
        lastName: string;
        email: string;
        message: string;
    }
}

// Handler
serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (!resendApiKey) {
            throw new Error('Missing RESEND_API_KEY environment variable')
        }

        const resend = new Resend(resendApiKey)
        const { type, payload } = await req.json() as ContactRequest

        if (type !== 'CONTACT') {
            throw new Error('Invalid email type')
        }

        const { firstName, lastName, email, message } = payload

        // Send email to admin
        const data = await resend.emails.send({
            from: 'Bid Digger Contact Form <info@biddigger.app>',
            to: ['mm.infoapps@gmail.com'],
            subject: `Nuova Richiesta Contatto da ${firstName} ${lastName}`,
            reply_to: email, // Allow replying to the user
            html: `
        <h1>Nuova Richiesta di Contatto</h1>
        <p><strong>Nome:</strong> ${firstName}</p>
        <p><strong>Cognome:</strong> ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Messaggio:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
        })

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Error sending email:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
