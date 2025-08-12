
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, UserCheck, RefreshCw, Eye, EyeOff } from 'lucide-react';

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
        .eq('profiles.school_id', schoolId);
      
      if (error) throw error;
      return data as UserCredential[];
    },
  });

  const generateCredentialsMutation = useMutation({
    mutationFn: async () => {
      // Get all profiles in the school without credentials
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('school_id', schoolId)
        .not('id', 'in', `(${credentials?.map(c => `'${c.profile_id}'`).join(',') || 'null'})`);

      if (profilesError) throw profilesError;

      // Generate credentials for each profile
      for (const profile of profiles || []) {
        const username = await generateUsername(profile.first_name, profile.last_name, profile.role as UserRole);
        const defaultPassword = generateDefaultPassword();

        const { error } = await supabase
          .from('user_credentials')
          .insert({
            profile_id: profile.id,
            username,
            default_password: defaultPassword,
          });

        if (error) throw error;
      }

      return profiles?.length || 0;
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

  const generateUsername = async (firstName: string, lastName: string, role: UserRole) => {
    const { data, error } = await supabase.rpc('generate_username', {
      first_name: firstName,
      last_name: lastName,
      role: role,
      school_id: schoolId
    });

    if (error) throw error;
    return data;
  };

  const generateDefaultPassword = () => {
    return 'School' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  };

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const resetPassword = async (credentialId: string) => {
    const newPassword = generateDefaultPassword();
    
    const { error } = await supabase
      .from('user_credentials')
      .update({ 
        default_password: newPassword,
        password_changed: false 
      })
      .eq('id', credentialId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Password reset successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['user-credentials', schoolId] });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Key className="h-5 w-5" />
            <span>User Credentials</span>
          </CardTitle>
          <Button
            onClick={() => generateCredentialsMutation.mutate()}
            disabled={generateCredentialsMutation.isPending}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Generate Missing Credentials
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
              {credentials?.map((credential) => (
                <TableRow key={credential.id}>
                  <TableCell>
                    {credential.profiles.first_name} {credential.profiles.last_name}
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
                      <Badge variant={credential.is_active ? "default" : "secondary"}>
                        {credential.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {!credential.password_changed && (
                        <Badge variant="outline" className="text-xs">
                          Default Password
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetPassword(credential.id)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCredentialsManager;
