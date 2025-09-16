
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, UserCheck, RefreshCw, Eye, EyeOff, Search, Download } from 'lucide-react';

interface UserCredentialsManagerProps {
  schoolId: string;
}

interface UserCredential {
  id: string;
  profile_id: string;
  username: string;
  default_password: string;
  password_changed: boolean;
  is_active: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}

type UserRole = 'admin' | 'teacher' | 'student';

const UserCredentialsManager: React.FC<UserCredentialsManagerProps> = ({ schoolId }) => {
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: credentials } = useQuery({
    queryKey: ['user-credentials', schoolId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_credentials')
        .select(`
          *,
          profiles!inner(
            first_name,
            last_name,
            email,
            role,
            school_id
          )
        `)
        .eq('profiles.school_id', schoolId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserCredential[];
    },
  });

  const generateCredentialsMutation = useMutation({
    mutationFn: async () => {
      // Get all profiles in the school without credentials
      const existingCredentialIds = credentials?.map(c => c.profile_id) || [];

      let profilesQuery = supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('school_id', schoolId);

      // Only add NOT IN filter if there are existing credentials
      if (existingCredentialIds.length > 0) {
        profilesQuery = profilesQuery.not('id', 'in', `(${existingCredentialIds.join(',')})`);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        throw new Error('No profiles found without credentials');
      }

      // Generate credentials for each profile
      const credentialsToInsert = [];
      for (const profile of profiles) {
        const { data: username } = await supabase.rpc('generate_username', {
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role as UserRole,
          school_id: schoolId
        });

        const defaultPassword = 'School' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        credentialsToInsert.push({
          profile_id: profile.id,
          username,
          default_password: defaultPassword,
        });
      }

      const { error: insertError } = await supabase
        .from('user_credentials')
        .insert(credentialsToInsert);

      if (insertError) throw insertError;

      return profiles.length;
    },
    onSuccess: (count) => {
      toast({
        title: "Success",
        description: `Generated credentials for ${count} users!`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-credentials', schoolId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate credentials",
        variant: "destructive",
      });
    },
  });

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const resetPasswordMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      const newPassword = 'School' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      const { error } = await supabase
        .from('user_credentials')
        .update({ 
          default_password: newPassword,
          password_changed: false 
        })
        .eq('id', credentialId);

      if (error) throw error;
      return newPassword;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['user-credentials', schoolId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ credentialId, isActive }: { credentialId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('user_credentials')
        .update({ is_active: !isActive })
        .eq('id', credentialId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User status updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['user-credentials', schoolId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const exportCredentials = () => {
    if (!credentials) return;

    const csvContent = [
      'Name,Role,Username,Password,Status',
      ...credentials.map(cred => 
        `"${cred.profiles.first_name} ${cred.profiles.last_name}","${cred.profiles.role}","${cred.username}","${cred.default_password}","${cred.is_active ? 'Active' : 'Inactive'}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_credentials.csv';
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Credentials exported successfully!",
    });
  };

  // Filter credentials based on search and role
  const filteredCredentials = credentials?.filter(credential => {
    const matchesSearch = searchTerm === '' || 
      credential.profiles.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.profiles.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credential.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || credential.profiles.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>User Credentials Management</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={exportCredentials}
              disabled={!credentials || credentials.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={() => generateCredentialsMutation.mutate()}
              disabled={generateCredentialsMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Generate Missing Credentials
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="admin">Admin/Staff</option>
          </select>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{credentials?.length || 0}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {credentials?.filter(c => c.is_active).length || 0}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {credentials?.filter(c => !c.password_changed).length || 0}
            </div>
            <div className="text-sm text-gray-600">Default Passwords</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {credentials?.filter(c => !c.is_active).length || 0}
            </div>
            <div className="text-sm text-gray-600">Inactive</div>
          </div>
        </div>

        {/* Credentials Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredentials?.map((credential) => (
                <TableRow key={credential.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {credential.profiles.first_name} {credential.profiles.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{credential.profiles.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {credential.profiles.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">
                    {credential.username}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">
                        {showPasswords[credential.id] 
                          ? credential.default_password 
                          : '••••••••'
                        }
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(credential.id)}
                      >
                        {showPasswords[credential.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      <Badge 
                        variant={credential.is_active ? "default" : "secondary"}
                        className={credential.is_active ? "bg-green-100 text-green-800" : ""}
                      >
                        {credential.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {!credential.password_changed && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                          Default Password
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetPasswordMutation.mutate(credential.id)}
                        disabled={resetPasswordMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={credential.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({
                          credentialId: credential.id,
                          isActive: credential.is_active
                        })}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {credential.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {(!filteredCredentials || filteredCredentials.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <Key className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No Credentials Found</h3>
            <p className="mb-4">
              {searchTerm || roleFilter !== 'all' 
                ? 'No credentials match your search criteria.' 
                : 'No user credentials have been generated yet.'
              }
            </p>
            {!searchTerm && roleFilter === 'all' && (
              <Button
                onClick={() => generateCredentialsMutation.mutate()}
                disabled={generateCredentialsMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Generate Credentials
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserCredentialsManager;
