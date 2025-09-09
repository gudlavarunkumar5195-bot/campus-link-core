-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.get_user_school_id();

-- Create the missing tables and seed data for multi-tenant SaaS
-- Add tables that don't exist yet
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  timezone VARCHAR(50) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_cents INTEGER,
  billing_interval VARCHAR(20),
  trial_days INTEGER DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  provider_plan_id VARCHAR(255),
  provider_metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.schools(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create helper functions for RLS
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid,
    (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    (SELECT role::text FROM public.profiles WHERE id = auth.uid())
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'is_super_admin')::boolean,
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Enable RLS on new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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
('organizations.create', 'Create new organizations', 'organizations', 'create'),
('organizations.read', 'View organization details', 'organizations', 'read'),
('organizations.update', 'Update organization settings', 'organizations', 'update'),
('organizations.delete', 'Delete organizations', 'organizations', 'delete'),
('users.invite', 'Invite new users', 'users', 'invite'),
('users.read', 'View user profiles', 'users', 'read'),
('users.update', 'Update user profiles', 'users', 'update'),
('plans.create', 'Create billing plans', 'plans', 'create'),
('plans.read', 'View billing plans', 'plans', 'read'),
('plans.update', 'Update billing plans', 'plans', 'update'),
('subscriptions.read', 'View subscription details', 'subscriptions', 'read'),
('subscriptions.update', 'Update subscription settings', 'subscriptions', 'update'),
('reports.view', 'View reports and analytics', 'reports', 'view'),
('audit.read', 'View audit logs', 'audit', 'read')
ON CONFLICT (name) DO NOTHING;

-- Seed default plans
INSERT INTO public.plans (slug, name, description, features, limits, is_default) VALUES
('free', 'Free Plan', 'Basic features for small teams', 
 '{"basic_features": true, "analytics": false, "api_access": false}',
 '{"max_users": 5, "max_storage_gb": 1}',
 true),
('starter', 'Starter Plan', 'Perfect for growing teams', 
 '{"basic_features": true, "analytics": true, "api_access": true}',
 '{"max_users": 25, "max_storage_gb": 10}',
 false),
('professional', 'Professional Plan', 'Advanced features for established organizations', 
 '{"basic_features": true, "analytics": true, "api_access": true, "priority_support": true}',
 '{"max_users": 100, "max_storage_gb": 50}',
 false)
ON CONFLICT (slug) DO NOTHING;