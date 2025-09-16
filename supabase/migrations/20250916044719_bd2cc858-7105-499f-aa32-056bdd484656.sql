-- Enable RLS on all tables that need it based on the linter warnings
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.toggle_school_status(school_id UUID, new_status TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.schools 
  SET status = new_status 
  WHERE id = school_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;