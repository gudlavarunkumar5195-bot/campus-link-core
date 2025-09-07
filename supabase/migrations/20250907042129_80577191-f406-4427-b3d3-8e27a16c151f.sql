-- Migration: Create subscriptions table for future Stripe integration
-- Date: 2025-01-20
-- Purpose: Skeleton table to support future billing functionality

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NULL, -- Will be populated when Stripe is integrated
  plan TEXT NOT NULL DEFAULT 'free', -- free, basic, premium, enterprise
  status TEXT NOT NULL DEFAULT 'active', -- active, canceled, past_due, incomplete
  current_period_start TIMESTAMPTZ NULL,
  current_period_end TIMESTAMPTZ NULL,
  trial_start TIMESTAMPTZ NULL,
  trial_end TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id UUID NULL -- For multi-tenant isolation
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_school_id ON public.subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their school's subscription" 
ON public.subscriptions 
FOR SELECT 
USING (school_id = get_user_school_id());

CREATE POLICY "Admins can manage their school's subscription" 
ON public.subscriptions 
FOR ALL 
USING (
  get_user_role() = 'admin'::user_role 
  AND school_id = get_user_school_id()
);

-- Create policy for tenant isolation if tenant_id is used
CREATE POLICY "tenant_isolation_subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (tenant_id = tenant_id() OR tenant_id IS NULL);

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default free subscriptions for existing schools
INSERT INTO public.subscriptions (school_id, plan, status)
SELECT id, 'free', 'active'
FROM public.schools
WHERE id NOT IN (SELECT school_id FROM public.subscriptions);

-- Comments for future reference
COMMENT ON TABLE public.subscriptions IS 'Subscription management for schools - ready for Stripe integration';
COMMENT ON COLUMN public.subscriptions.stripe_subscription_id IS 'Stripe subscription ID - will be populated when Stripe is integrated';
COMMENT ON COLUMN public.subscriptions.plan IS 'Subscription plan: free, basic, premium, enterprise';
COMMENT ON COLUMN public.subscriptions.status IS 'Subscription status: active, canceled, past_due, incomplete';