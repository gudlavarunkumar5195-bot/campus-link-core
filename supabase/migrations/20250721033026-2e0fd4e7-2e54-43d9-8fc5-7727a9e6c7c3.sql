
-- Create enum types for roles and other constants
CREATE TYPE public.user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');
CREATE TYPE public.grade_type AS ENUM ('A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F');

-- Schools table
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'student',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    date_of_birth DATE,
    gender gender,
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    grade_level INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    class_teacher_id UUID REFERENCES public.profiles(id),
    max_students INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, code)
);

-- Students table (additional student-specific info)
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    student_id VARCHAR(50) NOT NULL,
    admission_date DATE NOT NULL,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(255),
    medical_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id)
);

-- Teachers table (additional teacher-specific info)
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL,
    hire_date DATE NOT NULL,
    qualification TEXT,
    specialization TEXT,
    salary DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id)
);

-- Teacher-Subject assignments
CREATE TABLE public.teacher_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, subject_id, class_id)
);

-- Timetable table
CREATE TABLE public.timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'present',
    notes TEXT,
    marked_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Grades table
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL, -- 'exam', 'quiz', 'assignment', 'project'
    assessment_name VARCHAR(255) NOT NULL,
    grade grade_type,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    date DATE NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments table
CREATE TABLE public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_points INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment submissions table
CREATE TABLE public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    grade DECIMAL(5,2),
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES public.teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Create function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Create function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- RLS Policies for schools
CREATE POLICY "Users can view their school" ON public.schools
FOR SELECT USING (id = public.get_user_school_id());

CREATE POLICY "Admins can manage schools" ON public.schools
FOR ALL USING (public.get_user_role() = 'admin');

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their school" ON public.profiles
FOR SELECT USING (school_id = public.get_user_school_id());

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles in their school" ON public.profiles
FOR ALL USING (public.get_user_role() = 'admin' AND school_id = public.get_user_school_id());

-- RLS Policies for classes
CREATE POLICY "Users can view classes in their school" ON public.classes
FOR SELECT USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins and teachers can manage classes" ON public.classes
FOR ALL USING (
  school_id = public.get_user_school_id() AND 
  public.get_user_role() IN ('admin', 'teacher')
);

-- RLS Policies for subjects
CREATE POLICY "Users can view subjects in their school" ON public.subjects
FOR SELECT USING (school_id = public.get_user_school_id());

CREATE POLICY "Admins and teachers can manage subjects" ON public.subjects
FOR ALL USING (
  school_id = public.get_user_school_id() AND 
  public.get_user_role() IN ('admin', 'teacher')
);

-- RLS Policies for students
CREATE POLICY "Users can view students in their school" ON public.students
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = public.students.profile_id 
    AND public.profiles.school_id = public.get_user_school_id()
  )
);

CREATE POLICY "Students can view their own record" ON public.students
FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins and teachers can manage students" ON public.students
FOR ALL USING (
  public.get_user_role() IN ('admin', 'teacher') AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = public.students.profile_id 
    AND public.profiles.school_id = public.get_user_school_id()
  )
);

-- RLS Policies for teachers
CREATE POLICY "Users can view teachers in their school" ON public.teachers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = public.teachers.profile_id 
    AND public.profiles.school_id = public.get_user_school_id()
  )
);

CREATE POLICY "Teachers can view their own record" ON public.teachers
FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage teachers" ON public.teachers
FOR ALL USING (
  public.get_user_role() = 'admin' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = public.teachers.profile_id 
    AND public.profiles.school_id = public.get_user_school_id()
  )
);

-- RLS Policies for attendance
CREATE POLICY "Users can view attendance in their school" ON public.attendance
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students 
    JOIN public.profiles ON public.profiles.id = public.students.profile_id
    WHERE public.students.id = public.attendance.student_id 
    AND public.profiles.school_id = public.get_user_school_id()
  )
);

CREATE POLICY "Students can view their own attendance" ON public.attendance
FOR SELECT USING (
  student_id IN (
    SELECT id FROM public.students WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Teachers and admins can manage attendance" ON public.attendance
FOR ALL USING (
  public.get_user_role() IN ('admin', 'teacher') AND
  EXISTS (
    SELECT 1 FROM public.students 
    JOIN public.profiles ON public.profiles.id = public.students.profile_id
    WHERE public.students.id = public.attendance.student_id 
    AND public.profiles.school_id = public.get_user_school_id()
  )
);

-- RLS Policies for grades
CREATE POLICY "Users can view grades in their school" ON public.grades
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students 
    JOIN public.profiles ON public.profiles.id = public.students.profile_id
    WHERE public.students.id = public.grades.student_id 
    AND public.profiles.school_id = public.get_user_school_id()
  )
);

CREATE POLICY "Students can view their own grades" ON public.grades
FOR SELECT USING (
  student_id IN (
    SELECT id FROM public.students WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "Teachers and admins can manage grades" ON public.grades
FOR ALL USING (
  public.get_user_role() IN ('admin', 'teacher') AND
  EXISTS (
    SELECT 1 FROM public.students 
    JOIN public.profiles ON public.profiles.id = public.students.profile_id
    WHERE public.students.id = public.grades.student_id 
    AND public.profiles.school_id = public.get_user_school_id()
  )
);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON public.schools FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_timetables_updated_at BEFORE UPDATE ON public.timetables FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
