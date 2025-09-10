-- Script to create a Super Admin user
-- 
-- INSTRUCTIONS:
-- 1. Replace 'your-email@example.com' with the actual email address
-- 2. Run this script in your Supabase SQL Editor
-- 3. The user will become a super admin on their next login

-- Method 1: Make an existing user a super admin
-- Replace the email with the user you want to promote
UPDATE profiles 
SET role = 'admin', school_id = NULL 
WHERE email = 'your-email@example.com';

-- Method 2: Create a new super admin user profile (if user already exists in auth.users)
-- Replace with actual details
INSERT INTO profiles (id, first_name, last_name, email, role, school_id, is_active)
VALUES (
  -- Replace this UUID with the actual auth.users.id from Supabase Auth
  '00000000-0000-0000-0000-000000000000',
  'Super',
  'Admin', 
  'superadmin@example.com',
  'admin',
  NULL,  -- NULL school_id makes them a super admin
  true
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  school_id = NULL;

-- Verify the super admin was created
SELECT 
  id, 
  email, 
  first_name, 
  last_name, 
  role, 
  school_id,
  CASE 
    WHEN role = 'admin' AND school_id IS NULL THEN 'Super Admin'
    WHEN role = 'admin' AND school_id IS NOT NULL THEN 'School Admin'
    ELSE 'Regular User'
  END as admin_type
FROM profiles 
WHERE role = 'admin'
ORDER BY school_id NULLS FIRST;