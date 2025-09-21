import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, User, GraduationCap, Shield, Edit, Save, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: 'student' | 'teacher' | 'admin';
  is_active: boolean;
  school_id: string;
  students?: any[];
  teachers?: any[];
  staff?: any[];
}

const ProfileManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Profile>>({});

  // Fetch profiles
  const { data: profiles, isLoading } = useQuery({
    queryKey: ['profiles', selectedRole],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          students(*),
          teachers(*),
          staff(*)
        `);

      if (selectedRole !== 'all') {
        query = query.eq('role', selectedRole as 'student' | 'teacher' | 'admin');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedProfile: Partial<Profile> & { id: string }) => {
      const { id, students, teachers, staff, ...profileData } = updatedProfile;
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Profile has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      setEditingProfile(null);
      setEditForm({});
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update profile: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile.id);
    setEditForm(profile);
  };

  const handleSaveProfile = () => {
    if (editForm.id) {
      updateProfileMutation.mutate(editForm as Profile & { id: string });
    }
  };

  const handleCancelEdit = () => {
    setEditingProfile(null);
    setEditForm({});
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student': return <User className="h-4 w-4" />;
      case 'teacher': return <GraduationCap className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen page-container animated-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-container animated-bg">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile Management</h1>
          <p className="text-muted-foreground">View and manage user profiles</p>
        </div>

        {/* Filter by role */}
        <Card className="form-container border-white/50 shadow-lg mb-6">
          <CardHeader>
            <CardTitle>Filter Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-background border-white/50 z-50">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="admin">Administrators</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles?.map((profile) => (
            <Card key={profile.id} className="form-container border-white/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getRoleColor(profile.role)}>
                      {getRoleIcon(profile.role)}
                      <span className="ml-1 capitalize">{profile.role}</span>
                    </Badge>
                    <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {editingProfile !== profile.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProfile(profile)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingProfile === profile.id ? (
                  // Edit Form
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <Input
                          value={editForm.first_name || ''}
                          onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input
                          value={editForm.last_name || ''}
                          onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={editForm.phone || ''}
                        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} size="sm">
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                    {profile.phone && (
                      <p className="text-sm text-muted-foreground">{profile.phone}</p>
                    )}
                    
                    {/* Role-specific information */}
                    {profile.role === 'student' && profile.students?.[0] && (
                      <div className="text-sm space-y-1">
                        <p><strong>Student ID:</strong> {profile.students[0].student_id}</p>
                        <p><strong>Class:</strong> {profile.students[0].class_id || 'Not assigned'}</p>
                      </div>
                    )}
                    
                    {profile.role === 'teacher' && profile.teachers?.[0] && (
                      <div className="text-sm space-y-1">
                        <p><strong>Employee ID:</strong> {profile.teachers[0].employee_id}</p>
                        <p><strong>Qualification:</strong> {profile.teachers[0].qualification}</p>
                      </div>
                    )}
                    
                    {profile.role === 'admin' && profile.staff?.[0] && (
                      <div className="text-sm space-y-1">
                        <p><strong>Employee ID:</strong> {profile.staff[0].employee_id}</p>
                        <p><strong>Position:</strong> {profile.staff[0].position}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {profiles?.length === 0 && (
          <Card className="form-container border-white/50 shadow-lg">
            <CardContent className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Profiles Found</h3>
              <p className="text-muted-foreground">
                No profiles match the selected criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfileManager;