
-- Add missing columns to profiles table for enhanced student, teacher, and staff information
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS religion VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS previous_school TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guardian_email VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guardian_relationship VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS transport_mode VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS special_needs TEXT;

-- Add missing columns to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS section VARCHAR(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS hostel_resident BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS transport_required BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS fee_category VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS scholarship_details TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_class VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS tc_number VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS documents_submitted TEXT[];

-- Add missing columns to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS subjects_taught TEXT[];
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS previous_experience TEXT;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS training_certifications TEXT[];
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'full_time';
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS probation_period INTEGER;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3,2);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS class_teacher_for VARCHAR(100);

-- Add missing columns to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES profiles(id);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'full_time';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS shift_timing VARCHAR(100);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS probation_period INTEGER;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS performance_rating DECIMAL(3,2);
ALTER TABLE staff ADD COLUMN IF NOT EXISTS responsibilities TEXT[];
ALTER TABLE staff ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- Create departments table for dropdown data
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  head_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects_offered table for dropdown data
CREATE TABLE IF NOT EXISTS subjects_offered (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  description TEXT,
  grade_levels INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects_offered ENABLE ROW LEVEL SECURITY;

-- RLS policies for departments
CREATE POLICY "Users can view departments in their school" ON departments
  FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL USING (school_id = get_user_school_id() AND get_user_role() = 'admin');

-- RLS policies for subjects_offered
CREATE POLICY "Users can view subjects in their school" ON subjects_offered
  FOR SELECT USING (school_id = get_user_school_id());

CREATE POLICY "Admins and teachers can manage subjects" ON subjects_offered
  FOR ALL USING (school_id = get_user_school_id() AND get_user_role() IN ('admin', 'teacher'));

-- Insert default departments
INSERT INTO departments (school_id, name, description) 
SELECT s.id, 'Academic', 'Academic Department' FROM schools s
ON CONFLICT DO NOTHING;

INSERT INTO departments (school_id, name, description) 
SELECT s.id, 'Administration', 'Administration Department' FROM schools s
ON CONFLICT DO NOTHING;

INSERT INTO departments (school_id, name, description) 
SELECT s.id, 'Sports', 'Sports Department' FROM schools s
ON CONFLICT DO NOTHING;

-- Insert default subjects
INSERT INTO subjects_offered (school_id, name, code, grade_levels) 
SELECT s.id, 'Mathematics', 'MATH', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12] FROM schools s
ON CONFLICT DO NOTHING;

INSERT INTO subjects_offered (school_id, name, code, grade_levels) 
SELECT s.id, 'English', 'ENG', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12] FROM schools s
ON CONFLICT DO NOTHING;

INSERT INTO subjects_offered (school_id, name, code, grade_levels) 
SELECT s.id, 'Science', 'SCI', ARRAY[1,2,3,4,5,6,7,8,9,10] FROM schools s
ON CONFLICT DO NOTHING;

INSERT INTO subjects_offered (school_id, name, code, grade_levels) 
SELECT s.id, 'Social Studies', 'SS', ARRAY[1,2,3,4,5,6,7,8,9,10] FROM schools s
ON CONFLICT DO NOTHING;

-- Add trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for new tables
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_subjects_offered_updated_at BEFORE UPDATE ON subjects_offered FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
