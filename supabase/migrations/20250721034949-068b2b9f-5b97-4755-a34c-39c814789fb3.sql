
-- Create schools table
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    address TEXT,
    contact_email TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on schools table
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for schools
CREATE POLICY "Users can view their own school" ON public.schools
FOR SELECT USING (id = public.get_user_school_id());

CREATE POLICY "Super admins can manage all schools" ON public.schools
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND school_id IS NULL
  )
);

-- Add school_id to profiles table (it already exists, but let's make sure it's properly set up)
-- The profiles table already has school_id, so we just need to ensure it's properly configured

-- Update the handle_new_user function to support school assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role, school_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student'),
    (NEW.raw_user_meta_data ->> 'school_id')::uuid
  );
  RETURN NEW;
END;
$$;

-- Create a function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND school_id IS NULL
  );
$$;

-- Update RLS policies to support super admin access
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;
CREATE POLICY "Users can view profiles in their school" ON public.profiles
FOR SELECT USING (
  school_id = public.get_user_school_id() OR public.is_super_admin()
);

DROP POLICY IF EXISTS "Admins can manage all profiles in their school" ON public.profiles;
CREATE POLICY "Admins can manage all profiles in their school" ON public.profiles
FOR ALL USING (
  (public.get_user_role() = 'admin' AND school_id = public.get_user_school_id()) OR
  public.is_super_admin()
);

-- Update other table policies to support super admin access
DROP POLICY IF EXISTS "Users can view classes in their school" ON public.classes;
CREATE POLICY "Users can view classes in their school" ON public.classes
FOR SELECT USING (
  school_id = public.get_user_school_id() OR public.is_super_admin()
);

DROP POLICY IF EXISTS "Admins and teachers can manage classes" ON public.classes;
CREATE POLICY "Admins and teachers can manage classes" ON public.classes
FOR ALL USING (
  (school_id = public.get_user_school_id() AND public.get_user_role() IN ('admin', 'teacher')) OR
  public.is_super_admin()
);

DROP POLICY IF EXISTS "Users can view subjects in their school" ON public.subjects;
CREATE POLICY "Users can view subjects in their school" ON public.subjects
FOR SELECT USING (
  school_id = public.get_user_school_id() OR public.is_super_admin()
);

DROP POLICY IF EXISTS "Admins and teachers can manage subjects" ON public.subjects;
CREATE POLICY "Admins and teachers can manage subjects" ON public.subjects
FOR ALL USING (
  (school_id = public.get_user_school_id() AND public.get_user_role() IN ('admin', 'teacher')) OR
  public.is_super_admin()
);

-- Update students table policies
DROP POLICY IF EXISTS "Users can view students in their school" ON public.students;
CREATE POLICY "Users can view students in their school" ON public.students
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = public.students.profile_id 
    AND (public.profiles.school_id = public.get_user_school_id() OR public.is_super_admin())
  )
);

DROP POLICY IF EXISTS "Admins and teachers can manage students" ON public.students;
CREATE POLICY "Admins and teachers can manage students" ON public.students
FOR ALL USING (
  (public.get_user_role() IN ('admin', 'teacher') AND
   EXISTS (
     SELECT 1 FROM public.profiles 
     WHERE public.profiles.id = public.students.profile_id 
     AND public.profiles.school_id = public.get_user_school_id()
   )) OR
  public.is_super_admin()
);

-- Update teachers table policies
DROP POLICY IF EXISTS "Users can view teachers in their school" ON public.teachers;
CREATE POLICY "Users can view teachers in their school" ON public.teachers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = public.teachers.profile_id 
    AND (public.profiles.school_id = public.get_user_school_id() OR public.is_super_admin())
  )
);

DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
CREATE POLICY "Admins can manage teachers" ON public.teachers
FOR ALL USING (
  (public.get_user_role() = 'admin' AND
   EXISTS (
     SELECT 1 FROM public.profiles 
     WHERE public.profiles.id = public.teachers.profile_id 
     AND public.profiles.school_id = public.get_user_school_id()
   )) OR
  public.is_super_admin()
);

-- Update attendance table policies
DROP POLICY IF EXISTS "Users can view attendance in their school" ON public.attendance;
CREATE POLICY "Users can view attendance in their school" ON public.attendance
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students 
    JOIN public.profiles ON public.profiles.id = public.students.profile_id
    WHERE public.students.id = public.attendance.student_id 
    AND (public.profiles.school_id = public.get_user_school_id() OR public.is_super_admin())
  )
);

DROP POLICY IF EXISTS "Teachers and admins can manage attendance" ON public.attendance;
CREATE POLICY "Teachers and admins can manage attendance" ON public.attendance
FOR ALL USING (
  (public.get_user_role() IN ('admin', 'teacher') AND
   EXISTS (
     SELECT 1 FROM public.students 
     JOIN public.profiles ON public.profiles.id = public.students.profile_id
     WHERE public.students.id = public.attendance.student_id 
     AND public.profiles.school_id = public.get_user_school_id()
   )) OR
  public.is_super_admin()
);

-- Update grades table policies
DROP POLICY IF EXISTS "Users can view grades in their school" ON public.grades;
CREATE POLICY "Users can view grades in their school" ON public.grades
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students 
    JOIN public.profiles ON public.profiles.id = public.students.profile_id
    WHERE public.students.id = public.grades.student_id 
    AND (public.profiles.school_id = public.get_user_school_id() OR public.is_super_admin())
  )
);

DROP POLICY IF EXISTS "Teachers and admins can manage grades" ON public.grades;
CREATE POLICY "Teachers and admins can manage grades" ON public.grades
FOR ALL USING (
  (public.get_user_role() IN ('admin', 'teacher') AND
   EXISTS (
     SELECT 1 FROM public.students 
     JOIN public.profiles ON public.profiles.id = public.students.profile_id
     WHERE public.students.id = public.grades.student_id 
     AND public.profiles.school_id = public.get_user_school_id()
   )) OR
  public.is_super_admin()
);

-- Create updated_at trigger for schools table
CREATE TRIGGER update_schools_updated_at 
BEFORE UPDATE ON public.schools 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
