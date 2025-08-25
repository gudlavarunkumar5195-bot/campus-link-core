
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Static dropdown data
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

export const BLOOD_GROUPS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
];

export const RELIGIONS = [
  { value: 'christianity', label: 'Christianity' },
  { value: 'islam', label: 'Islam' },
  { value: 'hinduism', label: 'Hinduism' },
  { value: 'buddhism', label: 'Buddhism' },
  { value: 'judaism', label: 'Judaism' },
  { value: 'sikhism', label: 'Sikhism' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];

export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'intern', label: 'Intern' }
];

export const SHIFT_TIMINGS = [
  { value: 'morning', label: 'Morning (6 AM - 2 PM)' },
  { value: 'day', label: 'Day (9 AM - 5 PM)' },
  { value: 'evening', label: 'Evening (2 PM - 10 PM)' },
  { value: 'night', label: 'Night (10 PM - 6 AM)' },
  { value: 'flexible', label: 'Flexible' }
];

export const TRANSPORT_MODES = [
  { value: 'school_bus', label: 'School Bus' },
  { value: 'private_transport', label: 'Private Transport' },
  { value: 'public_transport', label: 'Public Transport' },
  { value: 'walking', label: 'Walking' },
  { value: 'cycling', label: 'Cycling' }
];

export const GUARDIAN_RELATIONSHIPS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'legal_guardian', label: 'Legal Guardian' },
  { value: 'other', label: 'Other' }
];

export const FEE_CATEGORIES = [
  { value: 'regular', label: 'Regular' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'sports_quota', label: 'Sports Quota' },
  { value: 'academic_excellence', label: 'Academic Excellence' },
  { value: 'staff_ward', label: 'Staff Ward' },
  { value: 'sibling_discount', label: 'Sibling Discount' },
  { value: 'other', label: 'Other' }
];

// Database-driven dropdown hooks
export const useDepartments = () => {
  return useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useSubjects = () => {
  return useQuery({
    queryKey: ['subjects_offered'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects_offered')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useClasses = () => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('grade_level, name');
      
      if (error) throw error;
      return data || [];
    }
  });
};

export const useStaff = () => {
  return useQuery({
    queryKey: ['staff_with_profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          profiles:profile_id(first_name, last_name)
        `)
        .order('created_at');
      
      if (error) throw error;
      return data || [];
    }
  });
};
