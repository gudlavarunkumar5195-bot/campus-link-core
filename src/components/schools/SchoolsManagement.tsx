
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const SchoolsManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deletingSchool, setDeletingSchool] = useState<string | null>(null);

  const { data: schools, isLoading, refetch } = useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDeleteSchool = async (schoolId: string) => {
    setDeletingSchool(schoolId);
    try {
      const { error } = await supabase
        .from('schools')
        .delete()
        .eq('id', schoolId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "School deleted successfully",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete school",
        variant: "destructive",
      });
    } finally {
      setDeletingSchool(null);
    }
  };

  // Helper function to generate a slug from school name
  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Schools Management</h2>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create School
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Schools Management</h2>
          <p className="text-gray-600">Manage all schools in the system</p>
        </div>
        <Button onClick={() => navigate('/create-school')}>
          <Plus className="h-4 w-4 mr-2" />
          Create School
        </Button>
      </div>

      {schools && schools.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schools Found</h3>
            <p className="text-gray-600 mb-4">Create your first school to get started.</p>
            <Button onClick={() => navigate('/create-school')}>
              <Plus className="h-4 w-4 mr-2" />
              Create School
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools?.map((school) => (
            <Card key={school.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {school.logo_url ? (
                      <img 
                        src={school.logo_url} 
                        alt={`${school.name} logo`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{school.name}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {generateSlug(school.name)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {school.address && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {school.address}
                    </p>
                  )}
                  {school.email && (
                    <p className="text-sm text-gray-600">
                      {school.email}
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDeleteSchool(school.id)}
                      disabled={deletingSchool === school.id}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {deletingSchool === school.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchoolsManagement;
