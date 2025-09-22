import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, User, Mail, Phone, MapPin, Calendar, Users, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ProfileViewProps {
  userId?: string; // If provided, shows another user's profile (admin only)
}

const ProfileView: React.FC<ProfileViewProps> = ({ userId }) => {
  const { profile: currentUserProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const targetUserId = userId || currentUserProfile?.id;
  const canEdit = currentUserProfile?.role === 'admin' || (!userId && targetUserId === currentUserProfile?.id);

  // Fetch profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile_view', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          students(*),
          teachers(*),
          staff(*)
        `)
        .eq('id', targetUserId)
        .single();
      
      if (error) throw error;
      return profile;
    },
    enabled: !!targetUserId
  });

  // Fetch school info
  const { data: school } = useQuery({
    queryKey: ['school_info', profileData?.school_id],
    queryFn: async () => {
      if (!profileData?.school_id) return null;
      
      const { data } = await supabase
        .from('schools')
        .select('name, address')
        .eq('id', profileData.school_id)
        .single();
      
      return data;
    },
    enabled: !!profileData?.school_id
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', targetUserId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Profile updated successfully!' });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile_view', targetUserId] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to update profile',
        variant: 'destructive' 
      });
    }
  });

  const handleEdit = () => {
    setEditForm({
      first_name: profileData?.first_name || '',
      last_name: profileData?.last_name || '',
      phone: profileData?.phone || '',
      address: profileData?.address || '',
      emergency_contact_name: profileData?.emergency_contact_name || '',
      emergency_contact_phone: profileData?.emergency_contact_phone || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfileMutation.mutate(editForm);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({});
  };

  if (isLoading) {
    return (
      <Card className="form-container border-white/50 shadow-lg animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-white/20 rounded-full"></div>
            <div>
              <div className="w-32 h-6 bg-white/20 rounded mb-2"></div>
              <div className="w-24 h-4 bg-white/10 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profileData) {
    return (
      <Card className="form-container border-white/50 shadow-lg">
        <CardContent className="text-center py-8">
          <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Profile not found.</p>
        </CardContent>
      </Card>
    );
  }

  const roleColor = {
    admin: 'bg-red-500/20 text-red-300 border-red-500/30',
    teacher: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    student: 'bg-green-500/20 text-green-300 border-green-500/30',
    staff: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  }[profileData.role] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="form-container border-white/50 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-lg">
                  {profileData.first_name?.[0]}{profileData.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {profileData.first_name} {profileData.last_name}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={`${roleColor} border`}>
                    {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                  </Badge>
                  {school && (
                    <Badge variant="outline" className="glass-effect">
                      {school.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {canEdit && !isEditing && (
              <Button onClick={handleEdit} variant="outline" className="glass-effect">
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            
            {isEditing && (
              <div className="flex space-x-2">
                <Button onClick={handleSave} disabled={updateProfileMutation.isPending} className="glass-effect">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" className="glass-effect">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="form-container border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label className="text-foreground">First Name</Label>
                  <Input
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    className="glass-effect"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Last Name</Label>
                  <Input
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    className="glass-effect"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Phone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="glass-effect"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profileData.email}</span>
                </div>
                {profileData.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{profileData.phone}</span>
                  </div>
                )}
                {profileData.date_of_birth && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">
                      {new Date(profileData.date_of_birth).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {(profileData.nationality || profileData.religion) && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profileData.nationality && (
                      <Badge variant="secondary" className="glass-effect">
                        {profileData.nationality}
                      </Badge>
                    )}
                    {profileData.religion && (
                      <Badge variant="secondary" className="glass-effect">
                        {profileData.religion}
                      </Badge>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="form-container border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MapPin className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label className="text-foreground">Address</Label>
                  <Textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="glass-effect"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Emergency Contact Name</Label>
                  <Input
                    value={editForm.emergency_contact_name}
                    onChange={(e) => setEditForm({...editForm, emergency_contact_name: e.target.value})}
                    className="glass-effect"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Emergency Contact Phone</Label>
                  <Input
                    value={editForm.emergency_contact_phone}
                    onChange={(e) => setEditForm({...editForm, emergency_contact_phone: e.target.value})}
                    className="glass-effect"
                  />
                </div>
              </>
            ) : (
              <>
                {profileData.address && (
                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="text-foreground mt-1">{profileData.address}</p>
                  </div>
                )}
                {profileData.emergency_contact_name && (
                  <div>
                    <Label className="text-muted-foreground">Emergency Contact</Label>
                    <p className="text-foreground mt-1">
                      {profileData.emergency_contact_name}
                      {profileData.emergency_contact_phone && (
                        <span className="text-muted-foreground ml-2">
                          ({profileData.emergency_contact_phone})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Information */}
      {profileData.students?.[0] && (
        <Card className="form-container border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BookOpen className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground">Student ID</Label>
                <p className="text-foreground font-mono">{profileData.students[0].student_id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Roll Number</Label>
                <p className="text-foreground">{profileData.students[0].roll_number || 'Not assigned'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Academic Year</Label>
                <p className="text-foreground">{profileData.students[0].academic_year || 'Not set'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Section</Label>
                <p className="text-foreground">{profileData.students[0].section || 'Not assigned'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profileData.teachers?.[0] && (
        <Card className="form-container border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5" />
              Teacher Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-muted-foreground">Employee ID</Label>
                <p className="text-foreground font-mono">{profileData.teachers[0].employee_id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Department</Label>
                <p className="text-foreground">{profileData.teachers[0].department || 'Not assigned'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Specialization</Label>
                <p className="text-foreground">{profileData.teachers[0].specialization || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileView;