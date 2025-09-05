
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Log tenant info for debugging
      if (session?.user?.user_metadata) {
        console.log('Auth initialized - User metadata:', {
          tenant_id: session.user.user_metadata.tenant_id,
          role: session.user.user_metadata.role,
          email: session.user.email
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Log tenant info when auth state changes
      if (session?.user?.user_metadata) {
        console.log('Auth state changed - User metadata:', {
          tenant_id: session.user.user_metadata.tenant_id,
          role: session.user.user_metadata.role,
          email: session.user.email
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    tenantId: user?.user_metadata?.tenant_id,
    userRole: user?.user_metadata?.role,
  };
};
