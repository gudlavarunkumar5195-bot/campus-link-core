/**
 * Serverless function to assign tenant_id and role to users
 * Uses Supabase Service Role key for admin operations
 * 
 * Environment variables required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - ASSIGN_TENANT_SECRET
 */

const { createClient } = require('@supabase/supabase-js');

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-assign-tenant-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({}).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST']
    });
  }

  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] assignTenant request started`, {
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']
  });

  try {
    // Validate required environment variables
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ASSIGN_TENANT_SECRET } = process.env;
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ASSIGN_TENANT_SECRET) {
      console.error(`[${requestId}] Missing required environment variables`);
      return res.status(500).json({ 
        error: 'Server configuration error',
        requestId 
      });
    }

    // Validate secret header for basic auth protection
    const providedSecret = req.headers['x-assign-tenant-secret'];
    if (!providedSecret || providedSecret !== ASSIGN_TENANT_SECRET) {
      console.warn(`[${requestId}] Invalid or missing secret header`, {
        hasSecret: !!providedSecret,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress
      });
      return res.status(401).json({ 
        error: 'Unauthorized',
        requestId 
      });
    }

    // Validate request body
    const { userId, tenantId, role } = req.body;
    
    if (!userId || !tenantId || !role) {
      console.warn(`[${requestId}] Invalid request body`, {
        hasUserId: !!userId,
        hasTenantId: !!tenantId,
        hasRole: !!role
      });
      return res.status(400).json({ 
        error: 'Missing required fields: userId, tenantId, role',
        requestId 
      });
    }

    // Validate role value
    const validRoles = ['admin', 'teacher', 'student', 'staff'];
    if (!validRoles.includes(role)) {
      console.warn(`[${requestId}] Invalid role provided`, { role, validRoles });
      return res.status(400).json({ 
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        requestId 
      });
    }

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(tenantId)) {
      console.warn(`[${requestId}] Invalid UUID format`, { userId, tenantId });
      return res.status(400).json({ 
        error: 'Invalid UUID format for userId or tenantId',
        requestId 
      });
    }

    console.log(`[${requestId}] Request validated`, { userId, tenantId, role });

    // Initialize Supabase admin client with service role key
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify the user exists in auth.users
    const { data: user, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError) {
      console.error(`[${requestId}] Error fetching user`, { error: getUserError.message, userId });
      return res.status(404).json({ 
        error: 'User not found',
        requestId 
      });
    }

    console.log(`[${requestId}] User found`, { userId, email: user.user?.email });

    // Verify the tenant exists (assuming tenantId refers to school_id)
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('id, name')
      .eq('id', tenantId)
      .single();

    if (schoolError) {
      console.error(`[${requestId}] Error fetching school/tenant`, { error: schoolError.message, tenantId });
      return res.status(404).json({ 
        error: 'Tenant/School not found',
        requestId 
      });
    }

    console.log(`[${requestId}] Tenant/School found`, { tenantId, schoolName: school.name });

    // Update user metadata with tenant_id and role
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          ...user.user?.user_metadata,
          tenant_id: tenantId,
          role: role
        }
      }
    );

    if (updateError) {
      console.error(`[${requestId}] Error updating user metadata`, { 
        error: updateError.message, 
        userId, 
        tenantId, 
        role 
      });
      return res.status(500).json({ 
        error: 'Failed to update user metadata',
        requestId 
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Successfully assigned tenant and role`, {
      userId,
      tenantId,
      role,
      schoolName: school.name,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    // Set CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(200).json({
      success: true,
      message: 'Tenant and role assigned successfully',
      data: {
        userId,
        tenantId,
        role,
        schoolName: school.name
      },
      requestId,
      duration: `${duration}ms`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Unexpected error in assignTenant`, {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });

    // Set CORS headers even for errors
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    return res.status(500).json({
      error: 'Internal server error',
      requestId,
      duration: `${duration}ms`
    });
  }
};