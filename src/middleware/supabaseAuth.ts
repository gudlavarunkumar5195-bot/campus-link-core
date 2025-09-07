/**
 * Supabase Authentication Middleware
 * Provides helper functions for JWT token validation and tenant extraction
 */

import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthContext {
  user: User | null;
  session: Session | null;
  tenantId: string | null;
  role: string | null;
  isAuthenticated: boolean;
}

/**
 * Extract tenant_id and role from user metadata
 */
export const extractTenantInfo = (session: Session | null): { tenantId: string | null; role: string | null } => {
  if (!session?.user?.user_metadata) {
    return { tenantId: null, role: null };
  }

  const metadata = session.user.user_metadata;
  return {
    tenantId: metadata.tenant_id || null,
    role: metadata.role || null
  };
};

/**
 * Get current authentication context
 */
export const getAuthContext = async (): Promise<AuthContext> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return {
      user: null,
      session: null,
      tenantId: null,
      role: null,
      isAuthenticated: false
    };
  }

  const { tenantId, role } = extractTenantInfo(session);

  return {
    user: session?.user || null,
    session,
    tenantId,
    role,
    isAuthenticated: !!session?.user
  };
};

/**
 * Validate that user has required role
 */
export const hasRole = (session: Session | null, requiredRole: string | string[]): boolean => {
  const { role } = extractTenantInfo(session);
  
  if (!role) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(role);
  }
  
  return role === requiredRole;
};

/**
 * Validate that user belongs to specific tenant
 */
export const hasTenantAccess = (session: Session | null, requiredTenantId: string): boolean => {
  const { tenantId } = extractTenantInfo(session);
  return tenantId === requiredTenantId;
};

/**
 * Create Supabase client with service role (for server-side use only)
 * DO NOT use this in frontend code - only in serverless functions
 */
export const createServiceRoleClient = (serviceRoleKey?: string) => {
  const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  const serviceKey = serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  }

  // Import createClient dynamically to avoid bundle issues
  const createClient = require('@supabase/supabase-js').createClient;
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

/**
 * Middleware for protecting routes that require authentication
 */
export const requireAuth = (authContext: AuthContext) => {
  if (!authContext.isAuthenticated) {
    throw new Error('Authentication required');
  }
  return authContext;
};

/**
 * Middleware for protecting routes that require specific role
 */
export const requireRole = (authContext: AuthContext, requiredRole: string | string[]) => {
  requireAuth(authContext);
  
  if (!hasRole(authContext.session, requiredRole)) {
    throw new Error(`Required role: ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}`);
  }
  
  return authContext;
};

/**
 * Middleware for protecting routes that require tenant access
 */
export const requireTenant = (authContext: AuthContext, requiredTenantId: string) => {
  requireAuth(authContext);
  
  if (!hasTenantAccess(authContext.session, requiredTenantId)) {
    throw new Error('Tenant access required');
  }
  
  return authContext;
};

/**
 * Hook for React components to get auth context
 */
export const useAuthContext = () => {
  // This would typically use React hooks in a real implementation
  // For now, return a promise-based version
  return getAuthContext();
};