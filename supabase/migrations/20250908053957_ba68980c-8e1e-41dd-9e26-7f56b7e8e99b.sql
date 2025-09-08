-- Multi-tenant SaaS scaffold with billing placeholders
-- This migration creates the full schema for a multi-tenant SaaS application
-- Billing-related fields are marked as nullable and commented for future implementation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE organization_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE member_status AS ENUM ('active', 'invited', 'suspended');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'cancelled', 'past_due', 'paused');
CREATE TYPE audit_action AS ENUM (
  'organization.created', 'organization.updated', 'organization.suspended', 'organization.reactivated',
  'member.invited', 'member.joined', 'member.role_changed', 'member.suspended', 'member.removed',
  'plan.created', 'plan.updated', 'plan.deleted',
  'subscription.created', 'subscription.updated', 'subscription.cancelled',
  'user.impersonated', 'user.created', 'user.updated'
);

-- Organizations (main tenant entity)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  status organization_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  
  -- Billing placeholders (nullable for no-billing mode)
  billing_email VARCHAR(255),
  billing_address JSONB, -- Future: store billing address
  tax_id VARCHAR(100),   -- Future: tax identifier
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT slug_length CHECK (length(slug) >= 2)
);

-- Roles (system-wide role definitions)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted if true
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions (granular permission definitions)
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(50) NOT NULL, -- e.g., 'schools', 'users', 'reports'
  action VARCHAR(50) NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_permission_name CHECK (name ~ '^[a-z0-9_.]+$')
);

-- Role-Permission mapping
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(role_id, permission_id)
);

-- Organization members (users within organizations)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  status member_status NOT NULL DEFAULT 'active',
  
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

-- Organization invitations
CREATE TABLE public.org_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  status invitation_status NOT NULL DEFAULT 'pending',
  
  created_by UUID NOT NULL REFERENCES auth.users(id),
  accepted_by UUID REFERENCES auth.users(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Plans (billing plans - fields nullable for no-billing mode)
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Billing fields (nullable - populate when billing is enabled)
  price_cents INTEGER, -- NULL means free/custom pricing
  billing_interval VARCHAR(20), -- 'monthly', 'yearly', 'one_time', etc.
  trial_days INTEGER DEFAULT 0,
  
  -- Feature flags and limits
  features JSONB NOT NULL DEFAULT '{}', -- e.g., {"analytics": true, "api_access": true}
  limits JSONB NOT NULL DEFAULT '{}',   -- e.g., {"max_users": 100, "max_storage_gb": 10}
  
  -- Billing provider placeholders
  provider_plan_id VARCHAR(255), -- Stripe price ID, Paddle plan ID, etc.
  provider_metadata JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default plan for new organizations
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_billing_interval CHECK (
    billing_interval IS NULL OR 
    billing_interval IN ('monthly', 'yearly', 'one_time', 'weekly')
  )
);

-- Subscriptions (billing subscriptions - records only until billing enabled)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status subscription_status NOT NULL DEFAULT 'trial',
  
  -- Billing provider placeholders
  provider_subscription_id VARCHAR(255), -- Stripe subscription ID, etc.
  provider_customer_id VARCHAR(255),     -- Stripe customer ID, etc.
  provider_metadata JSONB DEFAULT '{}',
  
  -- Subscription periods
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Manual override fields (for admin control before billing is active)
  manual_override BOOLEAN DEFAULT false,
  override_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organization_id) -- One subscription per organization
);

-- Provider mappings (future billing provider integration)
CREATE TABLE public.provider_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL, -- 'organization', 'user', 'subscription', etc.
  entity_id UUID NOT NULL,
  provider_name VARCHAR(50) NOT NULL, -- 'stripe', 'paddle', 'lemonsqueezy', etc.
  provider_entity_id VARCHAR(255) NOT NULL,
  provider_metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(entity_type, entity_id, provider_name)
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  action audit_action NOT NULL,
  
  target_type VARCHAR(50), -- 'organization', 'user', 'subscription', etc.
  target_id UUID,
  
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Local users table (synced with auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  is_super_admin BOOLEAN DEFAULT false,
  
  -- Profile fields
  timezone VARCHAR(50) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_organizations_status ON public.organizations(status);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_status ON public.organization_members(status);
CREATE INDEX idx_org_invitations_token ON public.org_invitations(token);
CREATE INDEX idx_org_invitations_email ON public.org_invitations(email);
CREATE INDEX idx_org_invitations_status ON public.org_invitations(status);
CREATE INDEX idx_subscriptions_org_id ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_audit_logs_org_id ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_users_email ON public.users(email);

-- Update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_organizations_updated_at 
  BEFORE UPDATE ON public.organizations 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_organization_members_updated_at 
  BEFORE UPDATE ON public.organization_members 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_plans_updated_at 
  BEFORE UPDATE ON public.plans 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, public.users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, public.users.last_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper functions for RLS
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid,
    (
      SELECT organization_id 
      FROM public.organization_members 
      WHERE user_id = auth.uid() AND status = 'active' 
      LIMIT 1
    )
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    (
      SELECT r.name
      FROM public.organization_members om
      JOIN public.roles r ON r.id = om.role_id
      WHERE om.user_id = auth.uid() AND om.status = 'active'
      LIMIT 1
    )
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->>'is_super_admin')::boolean,
    (SELECT is_super_admin FROM public.users WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;