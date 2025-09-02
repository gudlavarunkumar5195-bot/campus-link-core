-- Add unique constraints for proper upsert operations

-- Add unique constraint on profiles.email if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_email_key' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- Add unique constraint on user_credentials.profile_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_credentials_profile_id_key' 
        AND table_name = 'user_credentials'
    ) THEN
        ALTER TABLE public.user_credentials ADD CONSTRAINT user_credentials_profile_id_key UNIQUE (profile_id);
    END IF;
END $$;

-- Add unique constraint on students.profile_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'students_profile_id_key' 
        AND table_name = 'students'
    ) THEN
        ALTER TABLE public.students ADD CONSTRAINT students_profile_id_key UNIQUE (profile_id);
    END IF;
END $$;

-- Add unique constraint on teachers.profile_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'teachers_profile_id_key' 
        AND table_name = 'teachers'
    ) THEN
        ALTER TABLE public.teachers ADD CONSTRAINT teachers_profile_id_key UNIQUE (profile_id);
    END IF;
END $$;

-- Add unique constraint on staff.profile_id if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'staff_profile_id_key' 
        AND table_name = 'staff'  
    ) THEN
        ALTER TABLE public.staff ADD CONSTRAINT staff_profile_id_key UNIQUE (profile_id);
    END IF;
END $$;