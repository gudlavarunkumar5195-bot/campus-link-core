-- Add RLS policies for multi-tenant SaaS scaffold
-- This migration adds comprehensive RLS policies for tenant isolation

-- Organizations policies
CREATE POLICY "Super admins can manage all organizations" 
ON public.organizations FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Organization members can view their organization" 
ON public.organizations FOR SELECT
USING (
  id = public.get_user_org_id() OR 
  public.is_super_admin()
);

CREATE POLICY "Organization owners can update their organization" 
ON public.organizations FOR UPDATE
USING (
  id = public.get_user_org_id() AND 
  public.get_user_role() IN ('owner', 'admin')
);

-- Organization members policies
CREATE POLICY "Super admins can manage all members" 
ON public.organization_members FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Organization members can view members in their org" 
ON public.organization_members FOR SELECT
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Organization admins can manage members in their org" 
ON public.organization_members FOR ALL
USING (
  organization_id = public.get_user_org_id() AND 
  public.get_user_role() IN ('owner', 'admin')
);

-- Organization invitations policies
CREATE POLICY "Super admins can manage all invitations" 
ON public.org_invitations FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Organization admins can manage invitations in their org" 
ON public.org_invitations FOR ALL
USING (
  organization_id = public.get_user_org_id() AND 
  public.get_user_role() IN ('owner', 'admin')
);

CREATE POLICY "Public can view invitations by token" 
ON public.org_invitations FOR SELECT
USING (true); -- Tokens are secure, allow lookup by token

-- Roles policies (read-only for most users)
CREATE POLICY "Everyone can view roles" 
ON public.roles FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage roles" 
ON public.roles FOR ALL
USING (public.is_super_admin());

-- Permissions policies (read-only for most users)
CREATE POLICY "Everyone can view permissions" 
ON public.permissions FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage permissions" 
ON public.permissions FOR ALL
USING (public.is_super_admin());

-- Role permissions policies
CREATE POLICY "Everyone can view role permissions" 
ON public.role_permissions FOR SELECT
USING (true);

CREATE POLICY "Super admins can manage role permissions" 
ON public.role_permissions FOR ALL
USING (public.is_super_admin());

-- Plans policies
CREATE POLICY "Everyone can view active plans" 
ON public.plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admins can manage all plans" 
ON public.plans FOR ALL
USING (public.is_super_admin());

-- Subscriptions policies (updated table name)
CREATE POLICY "Super admins can manage all subscriptions" 
ON public.subscriptions FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Organization members can view their subscription" 
ON public.subscriptions FOR SELECT
USING (organization_id = public.get_user_org_id());

CREATE POLICY "Organization owners can update their subscription" 
ON public.subscriptions FOR UPDATE
USING (
  organization_id = public.get_user_org_id() AND 
  public.get_user_role() IN ('owner', 'admin')
);

-- Provider mappings policies
CREATE POLICY "Super admins can manage all provider mappings" 
ON public.provider_mappings FOR ALL
USING (public.is_super_admin());

-- Audit logs policies
CREATE POLICY "Super admins can view all audit logs" 
ON public.audit_logs FOR SELECT
USING (public.is_super_admin());

CREATE POLICY "Organization members can view their org audit logs" 
ON public.audit_logs FOR SELECT
USING (organization_id = public.get_user_org_id());

CREATE POLICY "All authenticated users can create audit logs" 
ON public.audit_logs FOR INSERT
WITH CHECK (actor_user_id = auth.uid());

-- Users policies
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Super admins can manage all users" 
ON public.users FOR ALL
USING (public.is_super_admin());

CREATE POLICY "Organization members can view users in their org" 
ON public.users FOR SELECT
USING (
  id IN (
    SELECT user_id FROM public.organization_members 
    WHERE organization_id = public.get_user_org_id()
  )
);

-- Seed default roles
INSERT INTO public.roles (name, description, is_system_role) VALUES
('super_admin', 'Super administrator with global access', true),
('owner', 'Organization owner with full admin rights', true),
('admin', 'Organization administrator', true),
('manager', 'Department or team manager', true),
('teacher', 'Teaching staff member', true),
('member', 'Regular organization member', true),
('viewer', 'Read-only access member', true)
ON CONFLICT (name) DO NOTHING;

-- Seed default permissions
INSERT INTO public.permissions (name, description, resource, action) VALUES
-- Organization permissions
('organizations.create', 'Create new organizations', 'organizations', 'create'),
('organizations.read', 'View organization details', 'organizations', 'read'),
('organizations.update', 'Update organization settings', 'organizations', 'update'),
('organizations.delete', 'Delete organizations', 'organizations', 'delete'),
('organizations.suspend', 'Suspend organizations', 'organizations', 'suspend'),

-- User management permissions
('users.invite', 'Invite new users', 'users', 'invite'),
('users.read', 'View user profiles', 'users', 'read'),
('users.update', 'Update user profiles', 'users', 'update'),
('users.suspend', 'Suspend user accounts', 'users', 'suspend'),
('users.delete', 'Delete user accounts', 'users', 'delete'),

-- Plan management permissions
('plans.create', 'Create billing plans', 'plans', 'create'),
('plans.read', 'View billing plans', 'plans', 'read'),
('plans.update', 'Update billing plans', 'plans', 'update'),
('plans.delete', 'Delete billing plans', 'plans', 'delete'),

-- Subscription permissions
('subscriptions.read', 'View subscription details', 'subscriptions', 'read'),
('subscriptions.update', 'Update subscription settings', 'subscriptions', 'update'),
('subscriptions.cancel', 'Cancel subscriptions', 'subscriptions', 'cancel'),

-- Reporting permissions
('reports.view', 'View reports and analytics', 'reports', 'view'),
('reports.export', 'Export report data', 'reports', 'export'),

-- Audit permissions
('audit.read', 'View audit logs', 'audit', 'read'),
('impersonation.use', 'Impersonate other users', 'impersonation', 'use')
ON CONFLICT (name) DO NOTHING;

-- Get role IDs for permission assignments
DO $$
DECLARE
    super_admin_id UUID;
    owner_id UUID;
    admin_id UUID;
    manager_id UUID;
    teacher_id UUID;
    member_id UUID;
    viewer_id UUID;
BEGIN
    SELECT id INTO super_admin_id FROM public.roles WHERE name = 'super_admin';
    SELECT id INTO owner_id FROM public.roles WHERE name = 'owner';
    SELECT id INTO admin_id FROM public.roles WHERE name = 'admin';
    SELECT id INTO manager_id FROM public.roles WHERE name = 'manager';
    SELECT id INTO teacher_id FROM public.roles WHERE name = 'teacher';
    SELECT id INTO member_id FROM public.roles WHERE name = 'member';
    SELECT id INTO viewer_id FROM public.roles WHERE name = 'viewer';

    -- Super admin gets all permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT super_admin_id, id FROM public.permissions
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Owner gets most permissions except global ones
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT owner_id, id FROM public.permissions 
    WHERE name NOT IN ('organizations.create', 'organizations.delete', 'organizations.suspend', 'impersonation.use')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Admin gets user and plan management permissions
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT admin_id, id FROM public.permissions 
    WHERE name IN (
        'organizations.read', 'organizations.update',
        'users.invite', 'users.read', 'users.update', 'users.suspend',
        'plans.read', 'subscriptions.read', 'subscriptions.update',
        'reports.view', 'audit.read'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Manager gets limited user management
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT manager_id, id FROM public.permissions 
    WHERE name IN (
        'organizations.read', 'users.invite', 'users.read', 'users.update',
        'plans.read', 'subscriptions.read', 'reports.view'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Teacher gets basic access
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT teacher_id, id FROM public.permissions 
    WHERE name IN ('organizations.read', 'users.read', 'plans.read', 'subscriptions.read')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Member gets basic read access
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT member_id, id FROM public.permissions 
    WHERE name IN ('organizations.read', 'users.read', 'plans.read')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Viewer gets read-only access
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT viewer_id, id FROM public.permissions 
    WHERE name IN ('organizations.read', 'users.read', 'plans.read')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- Seed default plans
INSERT INTO public.plans (slug, name, description, features, limits, is_default) VALUES
('free', 'Free Plan', 'Basic features for small teams', 
 '{"basic_features": true, "analytics": false, "api_access": false, "priority_support": false}',
 '{"max_users": 5, "max_storage_gb": 1, "api_calls_per_month": 1000}',
 true),
('starter', 'Starter Plan', 'Perfect for growing teams', 
 '{"basic_features": true, "analytics": true, "api_access": true, "priority_support": false}',
 '{"max_users": 25, "max_storage_gb": 10, "api_calls_per_month": 10000}',
 false),
('professional', 'Professional Plan', 'Advanced features for established organizations', 
 '{"basic_features": true, "analytics": true, "api_access": true, "priority_support": true, "advanced_reporting": true}',
 '{"max_users": 100, "max_storage_gb": 50, "api_calls_per_month": 50000}',
 false),
('enterprise', 'Enterprise Plan', 'Custom solution for large organizations', 
 '{"basic_features": true, "analytics": true, "api_access": true, "priority_support": true, "advanced_reporting": true, "custom_integrations": true, "sso": true}',
 '{"max_users": -1, "max_storage_gb": -1, "api_calls_per_month": -1}',
 false)
ON CONFLICT (slug) DO NOTHING;