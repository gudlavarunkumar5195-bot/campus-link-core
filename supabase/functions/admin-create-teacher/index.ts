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

    // Require authenticated admin user
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
      throw new Error("Only school admins can create teachers");
    }

    const body = await req.json();

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
      medical_conditions,
      allergies,
      special_needs,
      employee_id,
      
      // Teacher-specific fields
      qualification,
      specialization,
      department,
      subjects_taught,
      experience_years,
      previous_experience,
      training_certifications,
      hire_date,
      employment_type,
      salary,
      probation_period,
      contract_end_date,
      class_teacher_for,

      // Optional: assign role ('teacher' | 'admin')
      role,
      
      password,
    } = body ?? {};

    if (!first_name || !last_name || !email || !employee_id || !hire_date) {
      throw new Error("first_name, last_name, email, employee_id and hire_date are required");
    }

    // Enforce school scope
    if (school_id && school_id !== requesterProfile.school_id) {
      throw new Error("Invalid school scope");
    }

    // Create auth user with metadata
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: password || undefined,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role: role === "admin" ? "admin" : "teacher",
        school_id: requesterProfile.school_id,
      },
    });
    if (createErr || !created.user) throw new Error(createErr?.message || "Failed to create user");

    const newUserId = created.user.id;

    // Update profile with additional fields
    const { error: updErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUserId,
        first_name,
        last_name,
        email,
        phone: phone ?? null,
        role: role === "admin" ? "admin" : "teacher",
        school_id: requesterProfile.school_id,
        date_of_birth: date_of_birth ?? null,
        gender: gender ?? null,
        address: address ?? null,
        emergency_contact_name: emergency_contact_name ?? null,
        emergency_contact_phone: emergency_contact_phone ?? null,
        nationality: nationality ?? null,
        religion: religion ?? null,
        blood_group: blood_group ?? null,
        medical_conditions: medical_conditions ?? null,
        allergies: allergies ?? null,
        special_needs: special_needs ?? null,
        employee_id: employee_id,
      });
    if (updErr) throw new Error(`Failed to update profile: ${updErr.message}`);

    // Insert teacher record
    const { error: teacherErr } = await supabaseAdmin
      .from("teachers")
      .insert({
        profile_id: newUserId,
        employee_id,
        hire_date,
        salary: salary ? parseFloat(salary) : null,
        qualification: qualification ?? null,
        specialization: specialization ?? null,
        department: department ?? null,
        subjects_taught: subjects_taught ?? [],
        experience_years: experience_years ? parseInt(experience_years) : null,
        previous_experience: previous_experience ?? null,
        training_certifications: training_certifications ?? [],
        employment_type: employment_type ?? "full_time",
        probation_period: probation_period ? parseInt(probation_period) : null,
        contract_end_date: contract_end_date ?? null,
        class_teacher_for: class_teacher_for ?? null,
      });
    if (teacherErr) throw new Error(`Failed to create teacher record: ${teacherErr.message}`);

    return new Response(
      JSON.stringify({ success: true, user_id: newUserId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );
  } catch (error) {
    console.error("Error in admin-create-teacher:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});