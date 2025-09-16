-- Make schools table publicly readable for signup purposes
CREATE POLICY "Allow public read access to schools for signup" 
ON public.schools 
FOR SELECT 
USING (true);

-- Update the existing RLS policy to be more specific about admin management
DROP POLICY IF EXISTS "Admins can manage schools" ON public.schools;

CREATE POLICY "Super admins can manage schools" 
ON public.schools 
FOR ALL
USING ((get_user_role() = 'admin'::user_role) AND (get_user_school_id() IS NULL));

CREATE POLICY "School admins can manage their school" 
ON public.schools 
FOR UPDATE
USING ((get_user_role() = 'admin'::user_role) AND (id = get_user_school_id()));