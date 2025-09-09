/**
 * Authentication and authorization middleware for multi-tenant SaaS
 * Provides role-based access control (RBAC) and permission-based access control
 */

import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthContext {
  user: User | null;
  session: Session | null;
  orgId: string | null;
  role: string | null;
  isSuperAdmin: boolean;
  isAuthenticated: boolean;
  permissions: string[];
}

/**
 * Get current authentication context with organization and role info
 */
export const getAuthContext = async (): Promise<AuthContext> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return {
      user: null,
      session: null,
      orgId: null,
      role: null,
      isSuperAdmin: false,
      isAuthenticated: false,
      permissions: []
    };
  }

  // Extract JWT claims
  const claims = session.access_token ? JSON.parse(atob(session.access_token.split('.')[1])) : {};
  const orgId = claims.org_id || null;
  const role = claims.role || null;
  const isSuperAdmin = claims.is_super_admin || false;

  // Fetch user permissions - placeholder since tables don't exist yet
  let permissions: string[] = [];
  if (role === 'admin') {
    permissions = ['organizations.read', 'users.invite', 'users.read'];
  }

  return {
    user: session.user,
    session,
    orgId,
    role,
    isSuperAdmin,
    isAuthenticated: true,
    permissions
  };
};

/**
 * Require user to be authenticated
 */
export const requireAuth = (authContext: AuthContext) => {
  if (!authContext.isAuthenticated) {
    throw new Error('Authentication required');
  }
  return authContext;
};

/**
 * Require user to have specific role
 */
export const requireRole = (authContext: AuthContext, requiredRole: string | string[]) => {
  requireAuth(authContext);
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  if (!authContext.role || !roles.includes(authContext.role)) {
    throw new Error(`Required role: ${roles.join(' or ')}`);
  }
  
  return authContext;
};

/**
 * Require user to have specific permission
 */
export const requirePermission = (authContext: AuthContext, permission: string) => {
  requireAuth(authContext);
  
  if (!authContext.permissions.includes(permission) && !authContext.isSuperAdmin) {
    throw new Error(`Required permission: ${permission}`);
  }
  
  return authContext;
};

/**
 * Require user to belong to specific organization
 */
export const requireOrganization = (authContext: AuthContext, orgId: string) => {
  requireAuth(authContext);
  
  if (authContext.orgId !== orgId && !authContext.isSuperAdmin) {
    throw new Error('Organization access required');
  }
  
  return authContext;
};

/**
 * Check if user has access to specific plan feature
 */
export const requirePlanFeature = async (authContext: AuthContext, feature: string) => {
  requireAuth(authContext);
  
  if (authContext.isSuperAdmin) return authContext;
  
  // Get organization's current subscription and plan - placeholder
  const features = { [feature]: true }; // Mock access for now
  
  if (!features[feature]) {
    throw new Error(`Plan feature required: ${feature}`);
  }
  
  return authContext;
};

/**
 * Attribute-based access control (ABAC) helper
 */
export const checkAccess = (
  authContext: AuthContext,
  resource: any,
  action: string,
  context?: Record<string, any>
) => {
  requireAuth(authContext);
  
  // Super admin has access to everything
  if (authContext.isSuperAdmin) return true;
  
  // Check role-based access
  const roleAccess = authContext.permissions.includes(`${resource.type}.${action}`);
  if (roleAccess) return true;
  
  // Check attribute-based access
  // Example: Users can edit their own resources
  if (action === 'update' && resource.user_id === authContext.user?.id) {
    return true;
  }
  
  // Example: Organization members can view organization resources
  if (action === 'read' && resource.organization_id === authContext.orgId) {
    return true;
  }
  
  return false;
};

/**
 * React hook for authentication context
 */
export const useAuthMiddleware = () => {
  return {
    getAuthContext,
    requireAuth,
    requireRole,
    requirePermission,
    requireOrganization,
    requirePlanFeature,
    checkAccess
  };
};