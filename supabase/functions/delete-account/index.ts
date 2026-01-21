import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // LOG REQUEST START
    console.log(`[DELETE ACCOUNT] Request received. Method: ${req.method}`);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization');
        console.log(`[DELETE ACCOUNT] Auth Header present: ${!!authHeader}`);
        if (authHeader) {
            console.log(`[DELETE ACCOUNT] Auth Header value prefix: ${authHeader.substring(0, 20)}...`);
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader! } } }
        )

        // 1. Authenticate User
        console.log(`[DELETE ACCOUNT] Authenticating user...`);
        const {
            data: { user },
            error: authError
        } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            console.error(`[DELETE ACCOUNT] Auth failed:`, authError);
            return new Response("Unauthorized", { status: 401, headers: corsHeaders })
        }

        const userId = user.id
        console.log(`[DELETE ACCOUNT] Authenticated user: ${userId} (${user.email})`)

        // 2. Initialize Admin Client
        console.log(`[DELETE ACCOUNT] Initializing Admin Client...`);
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 3. CLEANUP STORAGE
        const bucketName = 'tender-documents'
        const userFolder = `${userId}`
        console.log(`[DELETE ACCOUNT] Listing files in ${bucketName}/${userFolder}...`)

        const { data: files, error: listError } = await supabaseAdmin
            .storage
            .from(bucketName)
            .list(userFolder, { limit: 100, offset: 0 })

        if (listError) {
            console.error("[DELETE ACCOUNT] Error listing files:", listError)
        } else {
            if (files && files.length > 0) {
                const filesToDelete = files.map(f => `${userFolder}/${f.name}`)
                console.log(`[DELETE ACCOUNT] Deleting ${filesToDelete.length} files...`)
                const { error: deleteError } = await supabaseAdmin
                    .storage
                    .from(bucketName)
                    .remove(filesToDelete)

                if (deleteError) console.error("[DELETE ACCOUNT] Error deleting files:", deleteError)
            } else {
                console.log(`[DELETE ACCOUNT] No files found to delete.`)
            }
        }

        // 4. DELETE USER
        console.log(`[DELETE ACCOUNT] Deleting user from Auth...`)
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteUserError) {
            console.error("[DELETE ACCOUNT] FATAL: Error deleting user:", deleteUserError)
            // RETURN DETAILED ERROR
            return new Response(
                JSON.stringify({ error: deleteUserError.message, details: deleteUserError }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`[DELETE ACCOUNT] Success.`)
        return new Response(
            JSON.stringify({ message: "Account deleted successfully" }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error(`[DELETE ACCOUNT] Unexpected EXCEPTION:`, error)
        return new Response(
            JSON.stringify({ error: error.message, stack: error.stack }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
