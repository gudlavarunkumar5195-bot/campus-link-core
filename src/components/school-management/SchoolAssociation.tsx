
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { School, Plus } from 'lucide-react';
import CreateSchoolForm from '@/components/schools/CreateSchoolForm';

const SchoolAssociation = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch available schools
  const { data: schools, isLoading } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && profile?.role === 'admin',
  });

  // Associate admin with school
  const associateWithSchoolMutation = useMutation({
    mutationFn: async (schoolId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ school_id: schoolId })
        .eq('id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully associated with school",
      });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to associate with school",
        variant: "destructive",
      });
    },
  });

  const handleSchoolCreated = (school: any) => {
    setShowCreateForm(false);
    // The trigger will automatically associate the admin with the new school
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['schools'] });
    toast({
      title: "Success",
      description: "School created and associated successfully",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create New School</h2>
          <Button
            variant="outline"
            onClick={() => setShowCreateForm(false)}
          >
            Cancel
          </Button>
        </div>
        <CreateSchoolForm onSchoolCreated={handleSchoolCreated} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <School className="h-16 w-16 mx-auto text-amber-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">School Association Required</h2>
        <p className="text-gray-600 mb-6">
          To access the system features, you need to be associated with a school. 
          You can either create a new school or associate with an existing one.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-2 border-dashed border-gray-300 hover:border-amber-500 transition-colors">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create New School</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Set up a new school with your configuration
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Create School
            </Button>
          </CardContent>
        </Card>

        {schools && schools.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Associate with Existing School</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schools.map((school) => (
                  <div key={school.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{school.name}</h4>
                      {school.address && (
                        <p className="text-sm text-gray-600">{school.address}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => associateWithSchoolMutation.mutate(school.id)}
                      disabled={associateWithSchoolMutation.isPending}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Associate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SchoolAssociation;
