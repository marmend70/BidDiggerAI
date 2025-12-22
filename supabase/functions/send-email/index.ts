
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
    type: 'CONTACT' | 'TEAM_INVITE';
    payload: any;
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
        const { type, payload } = await req.json() as EmailRequest

        let emailData;

        if (type === 'CONTACT') {
            const { firstName, lastName, email, message } = payload
            emailData = {
                from: 'Bid Digger Contact Form <info@biddigger.app>',
                to: ['mm.infoapps@gmail.com'],
                subject: `Nuova Richiesta Contatto da ${firstName} ${lastName}`,
                reply_to: email,
                html: `
                    <h1>Nuova Richiesta di Contatto</h1>
                    <p><strong>Nome:</strong> ${firstName}</p>
                    <p><strong>Cognome:</strong> ${lastName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Messaggio:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                `
            }
        } else if (type === 'TEAM_INVITE') {
            const { to, inviterName, workspaceName } = payload
            emailData = {
                from: 'Bid Digger AI <info@biddigger.app>',
                to: [to],
                subject: `Sei stato aggiunto al workspace "${workspaceName}"`,
                html: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h1 style="color: #3b82f6;">Sei stato aggiunto a un Team!</h1>
                        <p>Ciao,</p>
                        <p><strong>${inviterName}</strong> ti ha aggiunto al workspace <strong>${workspaceName}</strong> su Bid Digger AI.</p>
                        <p>Accedi subito alla piattaforma per iniziare a collaborare alle gare.</p>
                        <br>
                        <a href="https://biddigger.app" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Vai alla Dashboard</a>
                        <br><br>
                        <p style="font-size: 12px; color: #666;">Se non ti aspettavi questo invito, puoi ignorare questa email.</p>
                    </div>
                `
            }
        } else {
            throw new Error('Invalid email type')
        }

        // Send email
        const data = await resend.emails.send(emailData)

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
