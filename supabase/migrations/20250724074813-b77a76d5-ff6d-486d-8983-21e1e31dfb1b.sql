
-- Update the profiles table to better support the ERP system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roll_number VARCHAR(20);

-- Create a staff table for non-teaching staff
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) NOT NULL,
  position VARCHAR(100) NOT NULL,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  salary DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on staff table
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for staff table
CREATE POLICY "Admins can manage staff" ON staff
  FOR ALL 
  USING (
    get_user_role() = 'admin' AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = staff.profile_id 
      AND profiles.school_id = get_user_school_id()
    )
  );

CREATE POLICY "Staff can view their own record" ON staff
  FOR SELECT 
  USING (profile_id = auth.uid());

CREATE POLICY "Users can view staff in their school" ON staff
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = staff.profile_id 
      AND profiles.school_id = get_user_school_id()
    )
  );

-- Add trigger for staff table updated_at
CREATE OR REPLACE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a function to generate default passwords
CREATE OR REPLACE FUNCTION generate_default_password()
RETURNS TEXT AS $$
BEGIN
  RETURN 'School' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Update the handle_new_user function to support admin-created users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, school_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student'),
    COALESCE((NEW.raw_user_meta_data ->> 'school_id')::uuid, NULL)
  );
  RETURN NEW;
END;
$function$;
