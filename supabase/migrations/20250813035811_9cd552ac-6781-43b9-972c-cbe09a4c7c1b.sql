
-- Update the profiles table to ensure admin users can be associated with schools
-- Add a trigger to automatically assign school_id for super admins or when creating schools

-- First, let's add a function to handle school association for admins
CREATE OR REPLACE FUNCTION public.associate_admin_with_school()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this is an admin user and no school_id is set, 
  -- we'll handle this in the application logic
  RETURN NEW;
END;
$$;

-- Create a function to get the first available school for super admins
CREATE OR REPLACE FUNCTION public.get_default_school_for_admin()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT id FROM public.schools ORDER BY created_at ASC LIMIT 1;
$$;

-- Update the school settings creation to ensure admins get associated
CREATE OR REPLACE FUNCTION public.handle_admin_school_association()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a new school is created, associate the creating admin with it
  UPDATE public.profiles 
  SET school_id = NEW.id 
  WHERE id = auth.uid() 
    AND role = 'admin' 
    AND school_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic admin-school association
DROP TRIGGER IF EXISTS on_school_created_associate_admin ON public.schools;
CREATE TRIGGER on_school_created_associate_admin
  AFTER INSERT ON public.schools
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_admin_school_association();
