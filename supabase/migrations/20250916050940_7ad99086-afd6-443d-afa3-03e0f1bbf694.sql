-- Fix all RLS disabled tables by enabling RLS where missing
-- (Only run this for tables that don't already have RLS enabled)

-- First, check which tables need RLS enabled and enable them
DO $$
DECLARE
    tbl_name text;
BEGIN
    -- Enable RLS on all public tables that don't have it enabled
    FOR tbl_name IN 
        SELECT schemaname||'.'||tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_tables t 
            WHERE schemaname = 'public'
            AND EXISTS (
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE c.relname = t.tablename 
                AND n.nspname = 'public'
                AND c.relrowsecurity = true
            )
        )
    LOOP
        EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl_name);
    END LOOP;
END $$;

-- Fix function search paths by updating existing functions
CREATE OR REPLACE FUNCTION public.generate_username(first_name text, last_name text, role user_role, school_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base username from first name + last name + role prefix
  base_username := LOWER(
    CASE 
      WHEN role = 'student' THEN 'std_'
      WHEN role = 'teacher' THEN 'tch_'
      WHEN role = 'admin' THEN 'adm_'
      ELSE 'usr_'
    END || 
    SUBSTRING(first_name, 1, 3) || 
    SUBSTRING(last_name, 1, 3)
  );
  
  final_username := base_username;
  
  -- Check if username exists, if so add counter
  WHILE EXISTS (SELECT 1 FROM user_credentials WHERE username = final_username) LOOP
    final_username := base_username || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_username;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_school_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.school_settings (school_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_admin_school_association()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- When a new school is created, associate the creating admin with it
  UPDATE public.profiles 
  SET school_id = NEW.id 
  WHERE id = auth.uid() 
    AND role = 'admin' 
    AND school_id IS NULL;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_demo_user(p_email text, p_password text, p_first_name text, p_last_name text, p_role user_role, p_username text, p_school_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  select (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid;
$function$;

CREATE OR REPLACE FUNCTION public.generate_default_password()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN 'School' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS uuid
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_default_school_for_admin()
RETURNS uuid
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT id FROM public.schools ORDER BY created_at ASC LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.associate_admin_with_school()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- If this is an admin user and no school_id is set, 
  -- we'll handle this in the application logic
  RETURN NEW;
END;
$function$;