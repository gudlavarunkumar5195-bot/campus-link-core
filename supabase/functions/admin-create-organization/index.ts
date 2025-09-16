import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify super admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user is super admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin' || profile.school_id !== null) {
      throw new Error('Super admin access required');
    }

    const { name, slug, ownerId, planSlug = 'free' } = await req.json();

    if (!name || !slug) {
      throw new Error('Name and slug are required');
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error('Slug must contain only lowercase letters, numbers, and hyphens');
    }

    // Check if slug is already taken
    const { data: existingOrg } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingOrg) {
      throw new Error('Organization slug already exists');
    }

    // Skip plan lookup since plans table doesn't exist yet
    console.log(`Using plan: ${planSlug}`);

    // Create organization (using schools table)
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('schools')
      .insert({
        name,
        slug,
        status: 'active'
      })
      .select()
      .single();

    if (orgError) {
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    // Create subscription record
    const { error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        school_id: organization.id,
        plan: planSlug,
        status: 'active'
      });

    if (subscriptionError) {
      console.error('Failed to create subscription:', subscriptionError);
      // Don't fail the request, just log the error
    }

    // If owner is specified, assign them to the organization
    if (ownerId) {
      // Update user's profile to link to this organization
      await supabaseAdmin
        .from('profiles')
        .update({ school_id: organization.id })
        .eq('id', ownerId);
    }

    // Log the creation
    console.log(`Organization created: ${organization.name} (${organization.slug}) by admin ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          status: organization.status
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    );

  } catch (error) {
    console.error('Error creating organization:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});