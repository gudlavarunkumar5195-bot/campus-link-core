import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify requester and require Super Admin (role=admin, school_id IS NULL)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Authentication failed");

    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, school_id")
      .eq("id", user.id)
      .single();

    if (profileError || !requesterProfile || requesterProfile.role !== "admin" || requesterProfile.school_id !== null) {
      throw new Error("Super admin access required");
    }

    const body = await req.json();
    const { first_name, last_name, email, username, password } = body ?? {};

    if (!first_name || !last_name || !email || !username || !password) {
      throw new Error("first_name, last_name, email, username and password are required");
    }

    // Ensure username is unique
    const { data: existingUsername } = await supabaseAdmin
      .from("user_credentials")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existingUsername) throw new Error("Username already exists");

    // Create auth user with metadata so trigger creates profile
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name, role: "admin", school_id: null },
    });
    if (createErr || !created.user) throw new Error(createErr?.message || "Failed to create user");

    const newUserId = created.user.id;

    // Ensure profile is properly set (trigger should have inserted it)
    await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUserId,
        first_name,
        last_name,
        email,
        role: "admin",
        school_id: null,
        is_active: true,
      });

    // Create credentials
    const { error: credError } = await supabaseAdmin
      .from("user_credentials")
      .insert({
        profile_id: newUserId,
        username,
        default_password: password,
        is_active: true,
      });
    if (credError) throw new Error(`Failed to create credentials: ${credError.message}`);

    // Optional staff record (non-blocking)
    try {
      await supabaseAdmin.from("staff").insert({
        profile_id: newUserId,
        employee_id: `SUPER${Date.now().toString().slice(-4)}`,
        hire_date: new Date().toISOString().slice(0, 10),
        position: "Super Administrator",
      });
    } catch (e) {
      console.error("Staff creation skipped:", e);
    }

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );
  } catch (error) {
    console.error("Error creating super admin:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});