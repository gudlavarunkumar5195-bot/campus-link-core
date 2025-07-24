
-- Create academic_years table
CREATE TABLE public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create student_history table
CREATE TYPE public.student_status AS ENUM ('active', 'promoted', 'repeat', 'left');

CREATE TABLE public.student_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section VARCHAR(10),
    status public.student_status DEFAULT 'active',
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_structure table
CREATE TABLE public.class_structure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    class_name VARCHAR(50) NOT NULL,
    sections TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create custom_fields table
CREATE TYPE public.module_type AS ENUM ('student', 'teacher', 'fee', 'document');
CREATE TYPE public.field_type AS ENUM ('text', 'number', 'dropdown', 'checkbox', 'date');

CREATE TABLE public.custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    module public.module_type NOT NULL,
    label VARCHAR(100) NOT NULL,
    field_type public.field_type NOT NULL,
    options TEXT[] DEFAULT '{}',
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_types table
CREATE TABLE public.document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fee_heads table
CREATE TABLE public.fee_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create school_config table for advanced configuration
CREATE TABLE public.school_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, config_key)
);

-- Enable RLS on all new tables
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for academic_years
CREATE POLICY "Users can view academic years in their school" ON public.academic_years
FOR SELECT USING (school_id = public.get_user_school_id() OR public.is_super_admin());

CREATE POLICY "Admins can manage academic years" ON public.academic_years
FOR ALL USING (
  (public.get_user_role() = 'admin' AND school_id = public.get_user_school_id()) OR
  public.is_super_admin()
);

-- Create RLS policies for student_history
CREATE POLICY "Users can view student history in their school" ON public.student_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.students 
    JOIN public.profiles ON public.profiles.id = public.students.profile_id
    WHERE public.students.id = public.student_history.student_id 
    AND (public.profiles.school_id = public.get_user_school_id() OR public.is_super_admin())
  )
);

CREATE POLICY "Admins can manage student history" ON public.student_history
FOR ALL USING (
  (public.get_user_role() = 'admin' AND
   EXISTS (
     SELECT 1 FROM public.students 
     JOIN public.profiles ON public.profiles.id = public.students.profile_id
     WHERE public.students.id = public.student_history.student_id 
     AND public.profiles.school_id = public.get_user_school_id()
   )) OR
  public.is_super_admin()
);

-- Create RLS policies for class_structure
CREATE POLICY "Users can view class structure in their school" ON public.class_structure
FOR SELECT USING (school_id = public.get_user_school_id() OR public.is_super_admin());

CREATE POLICY "Admins can manage class structure" ON public.class_structure
FOR ALL USING (
  (public.get_user_role() = 'admin' AND school_id = public.get_user_school_id()) OR
  public.is_super_admin()
);

-- Create RLS policies for custom_fields
CREATE POLICY "Users can view custom fields in their school" ON public.custom_fields
FOR SELECT USING (school_id = public.get_user_school_id() OR public.is_super_admin());

CREATE POLICY "Admins can manage custom fields" ON public.custom_fields
FOR ALL USING (
  (public.get_user_role() = 'admin' AND school_id = public.get_user_school_id()) OR
  public.is_super_admin()
);

-- Create RLS policies for document_types
CREATE POLICY "Users can view document types in their school" ON public.document_types
FOR SELECT USING (school_id = public.get_user_school_id() OR public.is_super_admin());

CREATE POLICY "Admins can manage document types" ON public.document_types
FOR ALL USING (
  (public.get_user_role() = 'admin' AND school_id = public.get_user_school_id()) OR
  public.is_super_admin()
);

-- Create RLS policies for fee_heads
CREATE POLICY "Users can view fee heads in their school" ON public.fee_heads
FOR SELECT USING (school_id = public.get_user_school_id() OR public.is_super_admin());

CREATE POLICY "Admins can manage fee heads" ON public.fee_heads
FOR ALL USING (
  (public.get_user_role() = 'admin' AND school_id = public.get_user_school_id()) OR
  public.is_super_admin()
);

-- Create RLS policies for school_config
CREATE POLICY "Users can view school config in their school" ON public.school_config
FOR SELECT USING (school_id = public.get_user_school_id() OR public.is_super_admin());

CREATE POLICY "Admins can manage school config" ON public.school_config
FOR ALL USING (
  (public.get_user_role() = 'admin' AND school_id = public.get_user_school_id()) OR
  public.is_super_admin()
);

-- Create updated_at triggers for all new tables
CREATE TRIGGER update_academic_years_updated_at 
BEFORE UPDATE ON public.academic_years 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_student_history_updated_at 
BEFORE UPDATE ON public.student_history 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_class_structure_updated_at 
BEFORE UPDATE ON public.class_structure 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_custom_fields_updated_at 
BEFORE UPDATE ON public.custom_fields 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_document_types_updated_at 
BEFORE UPDATE ON public.document_types 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_fee_heads_updated_at 
BEFORE UPDATE ON public.fee_heads 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_school_config_updated_at 
BEFORE UPDATE ON public.school_config 
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_academic_years_school_id ON public.academic_years(school_id);
CREATE INDEX idx_academic_years_is_active ON public.academic_years(is_active);
CREATE INDEX idx_student_history_student_id ON public.student_history(student_id);
CREATE INDEX idx_student_history_academic_year_id ON public.student_history(academic_year_id);
CREATE INDEX idx_class_structure_school_id ON public.class_structure(school_id);
CREATE INDEX idx_custom_fields_school_id ON public.custom_fields(school_id);
CREATE INDEX idx_document_types_school_id ON public.document_types(school_id);
CREATE INDEX idx_fee_heads_school_id ON public.fee_heads(school_id);
CREATE INDEX idx_school_config_school_id ON public.school_config(school_id);
