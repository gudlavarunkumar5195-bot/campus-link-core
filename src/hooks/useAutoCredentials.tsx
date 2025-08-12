
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAutoCredentials = (schoolId: string) => {
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to profile insertions for automatic credential generation
    const channel = supabase
      .channel('profile-insertions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles',
          filter: `school_id=eq.${schoolId}`,
        },
        async (payload) => {
          try {
            const newProfile = payload.new;
            
            // Check if credentials already exist
            const { data: existingCredentials } = await supabase
              .from('user_credentials')
              .select('id')
              .eq('profile_id', newProfile.id)
              .single();

            if (existingCredentials) return; // Credentials already exist

            // Generate username
            const { data: username } = await supabase.rpc('generate_username', {
              first_name: newProfile.first_name,
              last_name: newProfile.last_name,
              role: newProfile.role,
              school_id: schoolId
            });

            // Generate default password
            const defaultPassword = 'School' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

            // Insert credentials
            const { error } = await supabase
              .from('user_credentials')
              .insert({
                profile_id: newProfile.id,
                username,
                default_password: defaultPassword,
              });

            if (error) throw error;

            toast({
              title: "Credentials Generated",
              description: `Login credentials created for ${newProfile.first_name} ${newProfile.last_name}`,
            });
          } catch (error: any) {
            console.error('Error generating credentials:', error);
            toast({
              title: "Error",
              description: "Failed to generate login credentials automatically",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [schoolId, toast]);
};
