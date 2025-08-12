
-- Create table for bulk upload tracking
CREATE TABLE public.bulk_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  upload_type VARCHAR(50) NOT NULL, -- 'students', 'teachers', 'staff'
  file_name VARCHAR(255) NOT NULL,
  total_records INTEGER NOT NULL,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_log JSONB
);

-- Create table for school settings/features
CREATE TABLE public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) UNIQUE,
  bulk_upload_enabled BOOLEAN DEFAULT true,
  student_registration_enabled BOOLEAN DEFAULT true,
  teacher_registration_enabled BOOLEAN DEFAULT true,
  staff_registration_enabled BOOLEAN DEFAULT true,
  auto_generate_ids BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for login credentials tracking
CREATE TABLE public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  username VARCHAR(100) UNIQUE,
  default_password VARCHAR(100),
  password_changed BOOLEAN DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for bulk_uploads
ALTER TABLE public.bulk_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bulk uploads in their school" 
ON public.bulk_uploads 
FOR ALL 
USING (
  school_id = get_user_school_id() AND 
  get_user_role() = 'admin'::user_role
);

CREATE POLICY "Users can view bulk uploads in their school" 
ON public.bulk_uploads 
FOR SELECT 
USING (school_id = get_user_school_id());

-- Add RLS policies for school_settings
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage school settings" 
ON public.school_settings 
FOR ALL 
USING (
  school_id = get_user_school_id() AND 
  get_user_role() = 'admin'::user_role
);

CREATE POLICY "Users can view school settings" 
ON public.school_settings 
FOR SELECT 
USING (school_id = get_user_school_id());

-- Add RLS policies for user_credentials
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user credentials in their school" 
ON public.user_credentials 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = user_credentials.profile_id 
    AND profiles.school_id = get_user_school_id()
  ) AND get_user_role() = 'admin'::user_role
);

CREATE POLICY "Users can view their own credentials" 
ON public.user_credentials 
FOR SELECT 
USING (profile_id = auth.uid());

-- Create function to generate username
CREATE OR REPLACE FUNCTION public.generate_username(
  first_name TEXT,
  last_name TEXT,
  role user_role,
  school_id UUID
) RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Insert default settings for existing schools
INSERT INTO public.school_settings (school_id)
SELECT id FROM schools
WHERE id NOT IN (SELECT school_id FROM school_settings WHERE school_id IS NOT NULL);

-- Add trigger to create default settings for new schools
CREATE OR REPLACE FUNCTION public.create_default_school_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.school_settings (school_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_school_settings_trigger
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION create_default_school_settings();

-- Add trigger to update updated_at column
CREATE TRIGGER update_school_settings_updated_at
  BEFORE UPDATE ON school_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credentials_updated_at
  BEFORE UPDATE ON user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
