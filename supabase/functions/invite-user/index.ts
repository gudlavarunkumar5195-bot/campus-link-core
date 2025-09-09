import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from "https://deno.land/std@0.168.0/crypto/mod.ts";

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

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const { email, roleSlug, organizationId } = await req.json();

    if (!email || !roleSlug || !organizationId) {
      throw new Error('Email, role, and organization ID are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check if user has permission to invite to this organization
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role, is_super_admin')
      .eq('id', user.id)
      .single();

    const canInvite = profile?.is_super_admin || 
                     (profile?.school_id === organizationId && 
                      ['admin', 'owner'].includes(profile?.role));

    if (!canInvite) {
      throw new Error('Insufficient permissions to invite users to this organization');
    }

    // Get role ID
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', roleSlug)
      .single();

    if (roleError || !role) {
      throw new Error(`Role '${roleSlug}' not found`);
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .eq('school_id', organizationId)
      .single();

    if (existingMember) {
      throw new Error('User is already a member of this organization');
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabaseAdmin
      .from('org_invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      throw new Error('User already has a pending invitation');
    }

    // Generate secure invitation token
    const tokenData = `${email}:${organizationId}:${Date.now()}:${Math.random()}`;
    const tokenHash = createHash("sha256").update(tokenData).toString();
    const inviteToken = tokenHash.substring(0, 32);

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('org_invitations')
      .insert({
        organization_id: organizationId,
        email,
        role_id: role.id,
        token: inviteToken,
        status: 'pending',
        created_by: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (inviteError) {
      throw new Error(`Failed to create invitation: ${inviteError.message}`);
    }

    // Get organization details for email
    const { data: organization } = await supabaseAdmin
      .from('schools')
      .select('name')
      .eq('id', organizationId)
      .single();

    // Log audit event
    try {
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          actor_user_id: user.id,
          organization_id: organizationId,
          action: 'member.invited',
          target_type: 'invitation',
          target_id: invitation.id,
          details: {
            email,
            role: roleSlug,
            expires_at: expiresAt.toISOString()
          },
          ip_address: req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for'),
          user_agent: req.headers.get('user-agent')
        });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }

    // TODO: Send invitation email
    // For now, return the invitation details including the accept URL
    const acceptUrl = `${req.headers.get('origin')}/invite/accept?token=${inviteToken}`;

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: roleSlug,
          organization: organization?.name,
          expires_at: expiresAt.toISOString(),
          accept_url: acceptUrl
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    );

  } catch (error) {
    console.error('Error creating invitation:', error);
    
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