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
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_super_admin) {
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

    // Get default plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('id')
      .eq('slug', planSlug)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      throw new Error(`Plan '${planSlug}' not found`);
    }

    // Create organization (using schools table)
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('schools')
      .insert({
        name,
        slug,
        status: 'active',
        metadata: { created_by_admin: true },
        created_at: new Date().toISOString()
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
        organization_id: organization.id,
        plan_id: plan.id,
        status: 'active',
        started_at: new Date().toISOString(),
        manual_override: true,
        override_reason: 'Created by super admin'
      });

    if (subscriptionError) {
      console.error('Failed to create subscription:', subscriptionError);
      // Don't fail the request, just log the error
    }

    // If owner is specified, assign them to the organization
    if (ownerId) {
      // Get owner role
      const { data: ownerRole } = await supabaseAdmin
        .from('roles')
        .select('id')
        .eq('name', 'owner')
        .single();

      if (ownerRole) {
        // Create organization membership (if organization_members table exists)
        try {
          await supabaseAdmin
            .from('organization_members')
            .insert({
              organization_id: organization.id,
              user_id: ownerId,
              role_id: ownerRole.id,
              status: 'active',
              joined_at: new Date().toISOString()
            });
        } catch (error) {
          console.error('Failed to create organization membership:', error);
        }

        // Update user's profile to link to this organization
        await supabaseAdmin
          .from('profiles')
          .update({ school_id: organization.id })
          .eq('id', ownerId);
      }
    }

    // Log audit event
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          actor_user_id: user.id,
          organization_id: organization.id,
          action: 'organization.created',
          target_type: 'organization',
          target_id: organization.id,
          details: {
            name,
            slug,
            owner_id: ownerId,
            plan_slug: planSlug
          },
          ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
          user_agent: req.headers.get('user-agent')
        });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }

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