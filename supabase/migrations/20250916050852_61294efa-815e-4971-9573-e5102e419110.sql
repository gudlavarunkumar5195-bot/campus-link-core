-- Add teacher class assignments table
CREATE TABLE public.teacher_class_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID NOT NULL,
  class_id UUID NOT NULL,
  subject_id UUID NULL,
  academic_year VARCHAR NOT NULL,
  is_class_teacher BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID,
  UNIQUE(teacher_id, class_id, subject_id)
);

-- Add homework table
CREATE TABLE public.homework (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID
);

-- Add announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'general', -- 'general', 'class', 'school'
  class_id UUID NULL, -- null for school-wide announcements
  created_by UUID NOT NULL,
  priority VARCHAR DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  is_published BOOLEAN DEFAULT true,
  publish_date TIMESTAMPTZ DEFAULT now(),
  expire_date TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID
);

-- Add fee structures table for super admin
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL,
  class_id UUID NOT NULL,
  academic_year VARCHAR NOT NULL,
  fee_heads JSONB NOT NULL DEFAULT '{}', -- {fee_head_id: amount}
  total_amount NUMERIC NOT NULL DEFAULT 0,
  discount_percentage NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  final_amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID
);

-- Add user permissions table for role management
CREATE TABLE public.user_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  permission_type VARCHAR NOT NULL, -- 'class_access', 'subject_access', 'module_access'
  resource_id UUID NULL, -- class_id, subject_id, etc.
  permission_level VARCHAR NOT NULL DEFAULT 'read', -- 'read', 'write', 'admin'
  granted_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  tenant_id UUID,
  UNIQUE(profile_id, permission_type, resource_id)
);

-- Enable RLS on new tables
ALTER TABLE public.teacher_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teacher_class_assignments
CREATE POLICY "Teachers can view their own class assignments"
ON public.teacher_class_assignments
FOR SELECT
USING (
  teacher_id IN (
    SELECT t.id FROM teachers t WHERE t.profile_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN teachers t ON t.profile_id = p.id
    WHERE t.id = teacher_class_assignments.teacher_id
    AND p.school_id = get_user_school_id()
    AND get_user_role() IN ('admin', 'teacher')
  )
);

CREATE POLICY "Admins can manage teacher class assignments"
ON public.teacher_class_assignments
FOR ALL
USING (
  get_user_role() = 'admin' AND
  EXISTS (
    SELECT 1 FROM teachers t
    JOIN profiles p ON p.id = t.profile_id
    WHERE t.id = teacher_class_assignments.teacher_id
    AND p.school_id = get_user_school_id()
  )
);

CREATE POLICY "tenant_isolation_teacher_class_assignments"
ON public.teacher_class_assignments
FOR ALL
USING (tenant_id = tenant_id());

-- RLS Policies for homework
CREATE POLICY "Teachers can manage homework for their classes"
ON public.homework
FOR ALL
USING (
  teacher_id IN (
    SELECT t.id FROM teachers t WHERE t.profile_id = auth.uid()
  ) OR
  (get_user_role() = 'admin' AND
   EXISTS (
     SELECT 1 FROM classes c WHERE c.id = homework.class_id AND c.school_id = get_user_school_id()
   ))
);

CREATE POLICY "Students can view homework for their classes"
ON public.homework
FOR SELECT
USING (
  class_id IN (
    SELECT s.class_id FROM students s WHERE s.profile_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM classes c WHERE c.id = homework.class_id AND c.school_id = get_user_school_id()
  )
);

CREATE POLICY "tenant_isolation_homework"
ON public.homework
FOR ALL
USING (tenant_id = tenant_id());

-- RLS Policies for announcements
CREATE POLICY "Users can view announcements in their school"
ON public.announcements
FOR SELECT
USING (
  (class_id IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND school_id = get_user_school_id())) OR
  (class_id IN (
    SELECT s.class_id FROM students s WHERE s.profile_id = auth.uid()
  )) OR
  EXISTS (
    SELECT 1 FROM classes c WHERE c.id = announcements.class_id AND c.school_id = get_user_school_id()
  )
);

CREATE POLICY "Teachers and admins can manage announcements"
ON public.announcements
FOR ALL
USING (
  get_user_role() IN ('admin', 'teacher') AND
  (class_id IS NULL OR EXISTS (
    SELECT 1 FROM classes c WHERE c.id = announcements.class_id AND c.school_id = get_user_school_id()
  ))
);

CREATE POLICY "tenant_isolation_announcements"
ON public.announcements
FOR ALL
USING (tenant_id = tenant_id());

-- RLS Policies for fee_structures
CREATE POLICY "Admins can manage fee structures in their school"
ON public.fee_structures
FOR ALL
USING (
  get_user_role() = 'admin' AND school_id = get_user_school_id()
);

CREATE POLICY "Users can view fee structures in their school"
ON public.fee_structures
FOR SELECT
USING (school_id = get_user_school_id());

CREATE POLICY "tenant_isolation_fee_structures"
ON public.fee_structures
FOR ALL
USING (tenant_id = tenant_id());

-- RLS Policies for user_permissions
CREATE POLICY "Admins can manage user permissions in their school"
ON public.user_permissions
FOR ALL
USING (
  get_user_role() = 'admin' AND
  EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = user_permissions.profile_id AND p.school_id = get_user_school_id()
  )
);

CREATE POLICY "Users can view their own permissions"
ON public.user_permissions
FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "tenant_isolation_user_permissions"
ON public.user_permissions
FOR ALL
USING (tenant_id = tenant_id());

-- Add updated_at triggers
CREATE TRIGGER update_teacher_class_assignments_updated_at
  BEFORE UPDATE ON public.teacher_class_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homework_updated_at
  BEFORE UPDATE ON public.homework
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_structures_updated_at
  BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();