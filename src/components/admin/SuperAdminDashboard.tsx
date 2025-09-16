import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Users, Crown, Eye, Pause, Play, DollarSign, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import SuperAdminAnalytics from './SuperAdminAnalytics';
import FeeStructureManagement from '../super-admin/FeeStructureManagement';

interface Organization {
  id: string;
  name: string;
  created_at: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  // Mock fields for SaaS functionality
  slug?: string;
  status?: string;
}

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_super_admin: boolean;
  school_id?: string;
  role?: string;
}

interface Plan {
  id: string;
  slug: string;
  name: string;
  features: Record<string, any>;
  limits: Record<string, any>;
  is_active: boolean;
}

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [deleteOrgDialogOpen, setDeleteOrgDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedOrgToDelete, setSelectedOrgToDelete] = useState<string>('');

  // Fetch organizations
  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select(`
          id,
          name,
          created_at,
          address,
          phone,
          email,
          website
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Add mock SaaS fields
      return data?.map(school => ({
        ...school,
        slug: school.name.toLowerCase().replace(/\s+/g, '-'),
        status: 'active'
      })) as Organization[];
    }
  });

  // Fetch users - using existing profiles table
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, school_id, role')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data?.map(u => ({ ...u, is_super_admin: false })) as User[];
    }
  });

  // Fetch plans - placeholder since plans table may not exist yet
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      // Return mock plans since table doesn't exist yet
      return [
        { id: '1', slug: 'free', name: 'Free Plan', features: {}, limits: {}, is_active: true },
        { id: '2', slug: 'starter', name: 'Starter Plan', features: {}, limits: {}, is_active: true }
      ] as Plan[];
    }
  });

  // Create organization mutation
  const createOrgMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string; planSlug: string }) => {
      const { data: result, error } = await supabase.functions.invoke('admin-create-organization', {
        body: data
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    onSuccess: () => {
      toast({ description: 'Organization created successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      setCreateOrgDialogOpen(false);
    },
    onError: (error) => {
      toast({ variant: 'destructive', description: error.message });
    }
  });

  // Invite user mutation
  // Handler functions for organization and user actions
  const handleViewOrganization = (orgId: string) => {
    toast({ description: `Viewing organization: ${orgId}` });
  };

  const handleSuspendOrganization = async (orgId: string) => {
    try {
      const { error } = await supabase.rpc('toggle_school_status', {
        school_id: orgId,
        new_status: 'suspended'
      });
      if (error) throw error;
      
      toast({ description: 'Organization suspended successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
    } catch (error: any) {
      toast({ variant: 'destructive', description: error.message });
    }
  };

  const handleActivateOrganization = async (orgId: string) => {
    try {
      const { error } = await supabase.rpc('toggle_school_status', {
        school_id: orgId,
        new_status: 'active'
      });
      if (error) throw error;
      
      toast({ description: 'Organization activated successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
    } catch (error: any) {
      toast({ variant: 'destructive', description: error.message });
    }
  };

  const handleViewUser = (userId: string) => {
    toast({ description: `Viewing user: ${userId}` });
  };

  const handleEditUser = (userId: string) => {
    setSelectedUserId(userId);
    setEditUserDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      
      toast({ description: 'User deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error: any) {
      toast({ variant: 'destructive', description: error.message });
    }
  };

  const handleDeleteOrganization = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from('schools')
        .update({ status: 'deleted' })
        .eq('id', orgId);
      if (error) throw error;
      
      toast({ description: 'Organization deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      setDeleteOrgDialogOpen(false);
    } catch (error: any) {
      toast({ variant: 'destructive', description: error.message });
    }
  };

  const inviteUserMutation = useMutation({
    mutationFn: async (data: { email: string; roleSlug: string; organizationId: string }) => {
      const { data: result, error } = await supabase.functions.invoke('invite-user', {
        body: data
      });

      if (error) throw error;
      if (!result.success) throw new Error(result.error);
      
      return result;
    },
    onSuccess: (data) => {
      toast({ 
        description: `Invitation sent to ${data.invitation.email}. Accept URL: ${data.invitation.accept_url}` 
      });
      setInviteDialogOpen(false);
    },
    onError: (error) => {
      toast({ variant: 'destructive', description: error.message });
    }
  });

  const handleCreateOrg = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const rawSlug = (formData.get('slug') as string) || '';
    // Sanitize slug: strip protocol/paths and keep lowercase letters, numbers and hyphens
    let cleanedSlug = rawSlug.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*/, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (cleanedSlug !== rawSlug) {
      toast({ description: `Slug adjusted to: ${cleanedSlug}` });
    }
    
    createOrgMutation.mutate({
      name: formData.get('name') as string,
      slug: cleanedSlug,
      planSlug: (formData.get('planSlug') as string) || 'free'
    });
  };

  const handleInviteUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    inviteUserMutation.mutate({
      email: formData.get('email') as string,
      roleSlug: formData.get('roleSlug') as string,
      organizationId: selectedOrgId
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: 'default',
      suspended: 'destructive',
      deleted: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage organizations, users, and plans</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createOrgDialogOpen} onOpenChange={setCreateOrgDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateOrg} className="space-y-4">
                <div>
                  <Label htmlFor="name">Organization Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (URL identifier)</Label>
                  <Input id="slug" name="slug" pattern="^[a-z0-9-]+$" required />
                  <p className="text-sm text-muted-foreground">
                    Only lowercase letters, numbers, and hyphens
                  </p>
                </div>
                <div>
                  <Label htmlFor="planSlug">Initial Plan</Label>
                  <Select name="planSlug" defaultValue="free">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.slug}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createOrgMutation.isPending}>
                  {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User to Organization</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInviteUser} className="space-y-4">
                <div>
                  <Label htmlFor="organizationSelect">Organization</Label>
                  <Select name="organizationId" value={selectedOrgId} onValueChange={setSelectedOrgId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations?.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div>
                  <Label htmlFor="roleSlug">Role</Label>
                  <Select name="roleSlug" defaultValue="member">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={inviteUserMutation.isPending}>
                  {inviteUserMutation.isPending ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit User Dialog */}
          <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>User editing functionality would be implemented here.</p>
                <p className="text-sm text-muted-foreground">
                  This would allow editing user roles, permissions, and basic information.
                </p>
                <Button onClick={() => setEditUserDialogOpen(false)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="organizations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="fees">Fee Management</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <SuperAdminAnalytics />
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orgsLoading ? (
                <div>Loading organizations...</div>
              ) : (
                <div className="space-y-4">
                  {organizations?.map((org) => (
                    <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{org.name}</h3>
                        <p className="text-sm text-muted-foreground">/{org.slug}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {getStatusBadge(org.status || 'active')}
                          <Badge variant="outline">
                            Free Plan
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewOrganization(org.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleSuspendOrganization(org.id)}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleActivateOrganization(org.id)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Activate
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{org.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOrganization(org.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div>Loading users...</div>
              ) : (
                <div className="space-y-4">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {user.first_name || user.last_name 
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : user.email
                          }
                          {user.is_super_admin && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {user.role && (
                          <Badge variant="outline" className="mt-1">
                            {user.role}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewUser(user.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Billing Plans</CardTitle>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div>Loading plans...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans?.map((plan) => (
                    <Card key={plan.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {plan.name}
                          {!plan.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-medium">Features:</h4>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(plan.features).map(([key, value]) => (
                                <Badge key={key} variant={value ? 'default' : 'outline'}>
                                  {key}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium">Limits:</h4>
                            <ul className="text-sm text-muted-foreground">
                              {Object.entries(plan.limits).map(([key, value]) => (
                                <li key={key}>
                                  {key}: {value === -1 ? 'Unlimited' : value}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <FeeStructureManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}