
-- Create academic_years table
CREATE TABLE public.academic_years (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create class_structure table
CREATE TABLE public.class_structure (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_name VARCHAR NOT NULL,
  sections TEXT[] NOT NULL DEFAULT '{}',
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create custom_fields table
CREATE TABLE public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  module VARCHAR NOT NULL CHECK (module IN ('student', 'teacher', 'fee', 'document')),
  label VARCHAR NOT NULL,
  field_type VARCHAR NOT NULL CHECK (field_type IN ('text', 'number', 'dropdown', 'checkbox', 'date')),
  options TEXT[] NOT NULL DEFAULT '{}',
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create document_types table
CREATE TABLE public.document_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create fee_heads table
CREATE TABLE public.fee_heads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_structure ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_heads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for academic_years
CREATE POLICY "Users can view academic years in their school" ON public.academic_years
  FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "Admins can manage academic years" ON public.academic_years
  FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- Create RLS policies for class_structure
CREATE POLICY "Users can view class structure in their school" ON public.class_structure
  FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "Admins can manage class structure" ON public.class_structure
  FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- Create RLS policies for custom_fields
CREATE POLICY "Users can view custom fields in their school" ON public.custom_fields
  FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "Admins can manage custom fields" ON public.custom_fields
  FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- Create RLS policies for document_types
CREATE POLICY "Users can view document types in their school" ON public.document_types
  FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "Admins can manage document types" ON public.document_types
  FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- Create RLS policies for fee_heads
CREATE POLICY "Users can view fee heads in their school" ON public.fee_heads
  FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "Admins can manage fee heads" ON public.fee_heads
  FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- Add updated_at triggers
CREATE TRIGGER update_academic_years_updated_at
  BEFORE UPDATE ON public.academic_years
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_structure_updated_at
  BEFORE UPDATE ON public.class_structure
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_fields_updated_at
  BEFORE UPDATE ON public.custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_document_types_updated_at
  BEFORE UPDATE ON public.document_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_heads_updated_at
  BEFORE UPDATE ON public.fee_heads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
