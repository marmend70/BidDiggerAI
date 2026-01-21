
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let step = 'init';
  try {
    step = 'create_client';
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    step = 'get_user';
    // 1. Verify User is Authenticated & Admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    step = 'check_profile';
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role, app_role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.app_role?.toLowerCase() === 'admin' || profile?.role === 'admin';
    if (!isAdmin) {
      throw new Error('Forbidden: Admins only');
    }

    step = 'init_service_role';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

    // 2. Initialize Service Role Client (Elevated Privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    );

    step = 'parse_body';
    const { action, key, value } = await req.json();

    if (action === 'update_setting') {
      if (!key) throw new Error("Missing 'key'");

      step = 'db_upsert';
      const { error } = await supabaseAdmin
        .from('app_settings')
        .upsert({ key, value: String(value) });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, key, value }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    return new Response(JSON.stringify({ error: `[STEP: ${step}] ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
