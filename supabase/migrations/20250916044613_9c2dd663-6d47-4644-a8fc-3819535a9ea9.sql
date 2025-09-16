-- Add status and slug columns to schools table
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update existing schools with slugs based on their names
UPDATE public.schools 
SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '''', ''))
WHERE slug IS NULL;

-- Make slug unique
CREATE UNIQUE INDEX IF NOT EXISTS schools_slug_unique ON public.schools(slug);

-- Promote the current admin user to super admin (school_id = NULL means super admin)
UPDATE public.profiles 
SET school_id = NULL 
WHERE email = 'admin@demo.com' AND role = 'admin';

-- Create a function to suspend/activate schools
CREATE OR REPLACE FUNCTION public.toggle_school_status(school_id UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.schools 
  SET status = new_status 
  WHERE id = school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;