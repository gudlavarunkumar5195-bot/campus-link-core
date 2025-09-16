import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Require authenticated admin user (school admin)
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
    if (profileError || !requesterProfile) throw new Error("Requester profile not found");
    if (requesterProfile.role !== "admin" || !requesterProfile.school_id) {
      throw new Error("Only school admins can create students");
    }

    const body = await req.json();

    // Extract inputs
    const {
      school_id,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      gender,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      nationality,
      religion,
      blood_group,
      previous_school,
      guardian_name,
      guardian_phone,
      guardian_email,
      guardian_relationship,
      transport_mode,
      medical_conditions,
      allergies,
      special_needs,

      // student
      student_id,
      roll_number,
      class_id,
      admission_date,
      parent_name,
      parent_phone,
      parent_email,
      medical_info,
      academic_year,
      section,
      hostel_resident,
      transport_required,
      fee_category,
      scholarship_details,
      previous_class,
      tc_number,
      documents_submitted,

      // credentials
      password,
    } = body ?? {};

    if (!first_name || !last_name || !email || !student_id || !admission_date) {
      throw new Error("first_name, last_name, email, student_id and admission_date are required");
    }

    // Enforce school scope
    if (school_id && school_id !== requesterProfile.school_id) {
      throw new Error("Invalid school scope");
    }

    // Create auth user with metadata so the DB trigger creates the profile row
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || undefined,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role: "student",
        school_id: requesterProfile.school_id,
      },
    });
    if (createErr || !created.user) throw new Error(createErr?.message || "Failed to create user");

    const newUserId = created.user.id;

    // Update profile with additional fields (upsert to be safe)
    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUserId,
        first_name,
        last_name,
        email,
        phone: phone ?? null,
        role: "student",
        school_id: requesterProfile.school_id,
        date_of_birth: date_of_birth ?? null,
        gender: gender ?? null,
        address: address ?? null,
        emergency_contact_name: emergency_contact_name ?? null,
        emergency_contact_phone: emergency_contact_phone ?? null,
        nationality: nationality ?? null,
        religion: religion ?? null,
        blood_group: blood_group ?? null,
        previous_school: previous_school ?? null,
        guardian_name: guardian_name ?? null,
        guardian_phone: guardian_phone ?? null,
        guardian_email: guardian_email ?? null,
        guardian_relationship: guardian_relationship ?? null,
        transport_mode: transport_mode ?? null,
        medical_conditions: medical_conditions ?? null,
        allergies: allergies ?? null,
        special_needs: special_needs ?? null,
      });
    if (updErr) throw new Error(`Failed to update profile: ${updErr.message}`);

    // Insert student record
    const { error: studentErr } = await supabaseAdmin
      .from("students")
      .insert({
        profile_id: newUserId,
        student_id,
        roll_number: roll_number ?? null,
        class_id: class_id ?? null,
        admission_date,
        parent_name: parent_name ?? null,
        parent_phone: parent_phone ?? null,
        parent_email: parent_email ?? null,
        medical_info: medical_info ?? null,
        academic_year: academic_year ?? null,
        section: section ?? null,
        hostel_resident: !!hostel_resident,
        transport_required: !!transport_required,
        fee_category: fee_category ?? null,
        scholarship_details: scholarship_details ?? null,
        previous_class: previous_class ?? null,
        tc_number: tc_number ?? null,
        documents_submitted: documents_submitted ?? [],
      });
    if (studentErr) throw new Error(`Failed to create student record: ${studentErr.message}`);

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );
  } catch (error) {
    console.error("Error in admin-create-student:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
