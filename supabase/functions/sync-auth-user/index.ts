// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, password, metadata } = await req.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Missing email or password' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400,
      })
    }

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!serviceRole) {
      return new Response(JSON.stringify({ success: false, error: 'Service role key not configured for edge functions.' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      })
    }

    const supabase = createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Try to find the profile by email to get auth user id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Profile lookup error:', profileError)
      return new Response(JSON.stringify({ success: false, error: profileError.message }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      })
    }

    if (profile?.id) {
      // Update the existing auth user's password
      const { error: updateErr } = await supabase.auth.admin.updateUserById(profile.id, {
        password,
        user_metadata: metadata || {},
      })

      if (updateErr) {
        console.error('Update user error:', updateErr)
        return new Response(JSON.stringify({ success: false, error: updateErr.message }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        })
      }

      return new Response(JSON.stringify({ success: true, action: 'updated' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      })
    }

    // If no profile yet, create the auth user directly and mark email confirmed
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata || {},
    })

    if (createErr) {
      console.error('Create user error:', createErr)
      return new Response(JSON.stringify({ success: false, error: createErr.message }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 400,
      })
    }

    return new Response(JSON.stringify({ success: true, action: 'created', user_id: created.user?.id }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    })
  } catch (e: any) {
    console.error('Unhandled error:', e)
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Unknown error' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    })
  }
})