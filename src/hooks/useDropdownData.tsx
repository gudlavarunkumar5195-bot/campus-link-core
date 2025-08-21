
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useDepartments = () => {
  const { user, profile } = useAuth();
  
  return useQuery({
    queryKey: ['departments', profile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('school_id', profile?.school_id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profile?.school_id,
  });
};

export const useSubjects = () => {
  const { user, profile } = useAuth();
  
  return useQuery({
    queryKey: ['subjects_offered', profile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects_offered')
        .select('*')
        .eq('school_id', profile?.school_id)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profile?.school_id,
  });
};

export const useClasses = () => {
  const { user, profile } = useAuth();
  
  return useQuery({
    queryKey: ['classes', profile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', profile?.school_id)
        .order('grade_level', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profile?.school_id,
  });
};

export const useTeachers = () => {
  const { user, profile } = useAuth();
  
  return useQuery({
    queryKey: ['teachers', profile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          profiles!inner (
            id,
            first_name,
            last_name,
            school_id
          )
        `)
        .eq('profiles.school_id', profile?.school_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profile?.school_id,
  });
};

export const useStaff = () => {
  const { user, profile } = useAuth();
  
  return useQuery({
    queryKey: ['staff', profile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          profiles!inner (
            id,
            first_name,
            last_name,
            school_id
          )
        `)
        .eq('profiles.school_id', profile?.school_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !!profile?.school_id,
  });
};

// Constants for dropdown options
export const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' }
];

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

export const TRANSPORT_MODES = [
  { value: 'own', label: 'Own Transport' },
  { value: 'school_bus', label: 'School Bus' },
  { value: 'public', label: 'Public Transport' },
  { value: 'walking', label: 'Walking' }
];

export const RELIGIONS = [
  { value: 'hinduism', label: 'Hinduism' },
  { value: 'islam', label: 'Islam' },
  { value: 'christianity', label: 'Christianity' },
  { value: 'sikhism', label: 'Sikhism' },
  { value: 'buddhism', label: 'Buddhism' },
  { value: 'jainism', label: 'Jainism' },
  { value: 'other', label: 'Other' }
];

export const GUARDIAN_RELATIONSHIPS = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'brother', label: 'Brother' },
  { value: 'sister', label: 'Sister' },
  { value: 'other', label: 'Other' }
];

export const FEE_CATEGORIES = [
  { value: 'regular', label: 'Regular' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'sports_quota', label: 'Sports Quota' },
  { value: 'merit_scholarship', label: 'Merit Scholarship' },
  { value: 'economically_weaker', label: 'Economically Weaker Section' }
];

export const SHIFT_TIMINGS = [
  { value: 'morning', label: 'Morning (6 AM - 2 PM)' },
  { value: 'afternoon', label: 'Afternoon (2 PM - 10 PM)' },
  { value: 'night', label: 'Night (10 PM - 6 AM)' },
  { value: 'flexible', label: 'Flexible Hours' }
];
