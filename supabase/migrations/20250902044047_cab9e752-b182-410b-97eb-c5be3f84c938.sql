-- Enable RLS on all tables that have policies but RLS is disabled
-- This fixes the critical security warnings

-- Enable RLS on tables that have policies but RLS disabled
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for tables that need them

-- Assignments policies (school-based access)
CREATE POLICY "Users can view assignments in their school" ON public.assignments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM classes c
    JOIN profiles p ON p.school_id = get_user_school_id()
    WHERE c.id = assignments.class_id AND c.school_id = p.school_id
  )
);

CREATE POLICY "Teachers and admins can manage assignments" ON public.assignments
FOR ALL USING (
  get_user_role() = ANY(ARRAY['admin'::user_role, 'teacher'::user_role]) AND
  EXISTS (
    SELECT 1 FROM classes c
    JOIN profiles p ON p.school_id = get_user_school_id()
    WHERE c.id = assignments.class_id AND c.school_id = p.school_id
  )
);

-- Assignment submissions policies
CREATE POLICY "Students can view their own submissions" ON public.assignment_submissions
FOR SELECT USING (
  student_id IN (
    SELECT s.id FROM students s WHERE s.profile_id = auth.uid()
  )
);

CREATE POLICY "Teachers and admins can manage submissions" ON public.assignment_submissions
FOR ALL USING (
  get_user_role() = ANY(ARRAY['admin'::user_role, 'teacher'::user_role]) AND
  EXISTS (
    SELECT 1 FROM students s
    JOIN profiles p ON p.id = s.profile_id
    WHERE s.id = assignment_submissions.student_id AND p.school_id = get_user_school_id()
  )
);

-- Teacher subjects policies
CREATE POLICY "Users can view teacher subjects in their school" ON public.teacher_subjects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teachers t
    JOIN profiles p ON p.id = t.profile_id
    WHERE t.id = teacher_subjects.teacher_id AND p.school_id = get_user_school_id()
  )
);

CREATE POLICY "Admins and teachers can manage teacher subjects" ON public.teacher_subjects
FOR ALL USING (
  get_user_role() = ANY(ARRAY['admin'::user_role, 'teacher'::user_role]) AND
  EXISTS (
    SELECT 1 FROM teachers t
    JOIN profiles p ON p.id = t.profile_id
    WHERE t.id = teacher_subjects.teacher_id AND p.school_id = get_user_school_id()
  )
);

-- Timetables policies
CREATE POLICY "Users can view timetables in their school" ON public.timetables
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = timetables.class_id AND c.school_id = get_user_school_id()
  )
);

CREATE POLICY "Admins and teachers can manage timetables" ON public.timetables
FOR ALL USING (
  get_user_role() = ANY(ARRAY['admin'::user_role, 'teacher'::user_role]) AND
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = timetables.class_id AND c.school_id = get_user_school_id()
  )
);