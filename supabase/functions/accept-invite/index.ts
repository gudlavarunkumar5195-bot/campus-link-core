import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { token, userEmail } = await req.json();

    if (!token) {
      throw new Error('Invitation token is required');
    }

    // Find invitation by token
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('org_invitations')
      .select(`
        id,
        organization_id,
        email,
        role_id,
        status,
        expires_at,
        roles (name)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation token');
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (now > expiresAt) {
      // Mark invitation as expired
      await supabaseAdmin
        .from('org_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
        
      throw new Error('Invitation has expired');
    }

    // If user is authenticated, use their email, otherwise use provided email
    let acceptingUserEmail = userEmail;
    let acceptingUserId = null;

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const authToken = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(authToken);
      if (user) {
        acceptingUserEmail = user.email;
        acceptingUserId = user.id;
      }
    }

    // Verify email matches invitation
    if (acceptingUserEmail !== invitation.email) {
      throw new Error('Email address does not match invitation');
    }

    // If user is not authenticated, they need to sign up first
    if (!acceptingUserId) {
      return new Response(
        JSON.stringify({
          success: false,
          requiresSignup: true,
          email: invitation.email,
          organization: invitation.organization_id,
          role: invitation.roles?.name,
          message: 'Please sign up first to accept this invitation'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Check if user is already a member of this organization
    const { data: existingMember } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', acceptingUserId)
      .eq('school_id', invitation.organization_id)
      .single();

    if (existingMember) {
      throw new Error('You are already a member of this organization');
    }

    // Update user's profile to join the organization
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        school_id: invitation.organization_id,
        role: invitation.roles?.name,
        updated_at: new Date().toISOString()
      })
      .eq('id', acceptingUserId);

    if (profileError) {
      throw new Error(`Failed to update profile: ${profileError.message}`);
    }

    // Create organization membership record (if table exists)
    try {
      await supabaseAdmin
        .from('organization_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: acceptingUserId,
          role_id: invitation.role_id,
          status: 'active',
          invited_by: invitation.created_by,
          invited_at: invitation.created_at,
          joined_at: new Date().toISOString()
        });
    } catch (error) {
      // organization_members table might not exist yet, that's okay
      console.log('Could not create organization_members record:', error);
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabaseAdmin
      .from('org_invitations')
      .update({
        status: 'accepted',
        accepted_by: acceptingUserId,
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Failed to update invitation status:', updateError);
    }

    // Get organization details
    const { data: organization } = await supabaseAdmin
      .from('schools')
      .select('name, slug')
      .eq('id', invitation.organization_id)
      .single();

    // Log audit event
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          actor_user_id: acceptingUserId,
          organization_id: invitation.organization_id,
          action: 'member.joined',
          target_type: 'user',
          target_id: acceptingUserId,
          details: {
            email: invitation.email,
            role: invitation.roles?.name,
            invitation_id: invitation.id
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
          id: invitation.organization_id,
          name: organization?.name,
          slug: organization?.slug
        },
        role: invitation.roles?.name,
        message: 'Successfully joined organization'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error accepting invitation:', error);
    
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