
-- First, let's make sure we have the proper trigger for creating profiles when auth users are created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, school_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student'),
    COALESCE((NEW.raw_user_meta_data ->> 'school_id')::uuid, NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    school_id = COALESCE(EXCLUDED.school_id, profiles.school_id);
    
  RETURN NEW;
END;
$$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to safely create demo users with credentials
CREATE OR REPLACE FUNCTION public.create_demo_user(
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_role user_role,
  p_username text,
  p_school_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  profile_exists boolean;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = p_email) INTO profile_exists;
  
  IF profile_exists THEN
    -- Get existing user ID
    SELECT id INTO user_id FROM profiles WHERE email = p_email;
  ELSE
    -- Generate a new UUID for the user
    user_id := gen_random_uuid();
    
    -- Insert into profiles directly (since auth user creation might fail)
    INSERT INTO profiles (id, first_name, last_name, email, role, school_id, is_active)
    VALUES (user_id, p_first_name, p_last_name, p_email, p_role, p_school_id, true)
    ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      role = EXCLUDED.role,
      school_id = EXCLUDED.school_id;
  END IF;
  
  -- Create or update user credentials
  INSERT INTO user_credentials (profile_id, username, default_password, is_active)
  VALUES (user_id, p_username, p_password, true)
  ON CONFLICT (profile_id) DO UPDATE SET
    username = EXCLUDED.username,
    default_password = EXCLUDED.default_password,
    is_active = true;
    
  -- Create role-specific records
  IF p_role = 'student' THEN
    INSERT INTO students (profile_id, student_id, admission_date, parent_name, parent_phone, parent_email)
    VALUES (user_id, 'STD001', CURRENT_DATE, 'Demo Parent', '+1234567890', 'parent@demo.com')
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF p_role = 'teacher' THEN
    INSERT INTO teachers (profile_id, employee_id, hire_date, qualification, specialization)
    VALUES (user_id, 'TCH001', CURRENT_DATE, 'Master of Education', 'Mathematics')
    ON CONFLICT (profile_id) DO NOTHING;
  ELSIF p_role = 'admin' THEN
    INSERT INTO staff (profile_id, employee_id, hire_date, position)
    VALUES (user_id, 'ADM001', CURRENT_DATE, 'School Administrator')
    ON CONFLICT (profile_id) DO NOTHING;
  END IF;
  
  RETURN user_id;
END;
$$;
