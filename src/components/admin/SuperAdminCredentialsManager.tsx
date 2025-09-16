import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown, Copy, Eye, EyeOff, UserPlus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface SuperAdminCredential {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  password?: string;
  is_active: boolean;
}

const SuperAdminCredentialsManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<SuperAdminCredential[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: ''
  });
  const { toast } = useToast();

  const loadSuperAdmins = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          is_active,
          user_credentials (username, default_password)
        `)
        .eq('role', 'admin')
        .is('school_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedCredentials = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.user_credentials?.[0]?.username,
        password: profile.user_credentials?.[0]?.default_password,
        is_active: profile.is_active
      })) || [];

      setCredentials(formattedCredentials);
    } catch (error: any) {
      console.error('Error loading super admins:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSuperAdmin = async () => {
    if (!newAdmin.firstName || !newAdmin.lastName || !newAdmin.email || !newAdmin.username || !newAdmin.password) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Call secure Edge Function to create auth user + profile + credentials
      const { data, error } = await supabase.functions.invoke('create-super-admin', {
        body: {
          first_name: newAdmin.firstName,
          last_name: newAdmin.lastName,
          email: newAdmin.email,
          username: newAdmin.username,
          password: newAdmin.password,
        },
      });

      if (error || !data?.success) {
        const serverMsg = (data as any)?.error || (error as any)?.context?.body?.error || (error as any)?.context?.error || error?.message || 'Failed to create super admin';
        throw new Error(serverMsg);
      }

      toast({ title: "Success", description: "Super admin created successfully" });
      setNewAdmin({ firstName: '', lastName: '', email: '', username: '', password: '' });
      setCreateDialogOpen(false);
      loadSuperAdmins();
    } catch (error: any) {
      console.error('Error creating super admin:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deactivateSuperAdmin = async (adminId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Super admin deactivated",
      });

      loadSuperAdmins();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  const copyAllCredentials = () => {
    const credentialsText = credentials
      .filter(cred => cred.is_active && cred.username && cred.password)
      .map(cred => 
        `Name: ${cred.first_name} ${cred.last_name}\nEmail: ${cred.email}\nUsername: ${cred.username}\nPassword: ${cred.password}\n`
      ).join('\n---\n');
    
    if (credentialsText) {
      copyToClipboard(credentialsText);
    }
  };

  React.useEffect(() => {
    loadSuperAdmins();
  }, []);

  return (
    <Card className="bg-white max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          <span>Super Admin Credentials</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage super administrator accounts with system-wide access.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <Button
            onClick={loadSuperAdmins}
            disabled={loading}
            variant="outline"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-yellow-600 hover:bg-yellow-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Super Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Super Admin</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newAdmin.firstName}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newAdmin.lastName}
                      onChange={(e) => setNewAdmin(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="super.admin"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="SecurePassword123"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createSuperAdmin}
                    disabled={loading}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    {loading ? 'Creating...' : 'Create Super Admin'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {credentials.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Super Admin Accounts</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showPasswords ? 'Hide' : 'Show'} Passwords
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyAllCredentials}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy All
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {credentials.map((cred) => (
                <div key={cred.id} className={`p-4 border rounded-lg ${cred.is_active ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-4 w-4 text-yellow-500" />
                      <Badge variant={cred.is_active ? "default" : "secondary"}>
                        {cred.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="font-medium">{cred.first_name} {cred.last_name}</span>
                    </div>
                    {cred.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateSuperAdmin(cred.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Deactivate
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    Email: {cred.email}
                  </div>

                  {cred.username && cred.password && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-600">Username:</label>
                        <div className="flex items-center space-x-2">
                          <code className="bg-white p-1 rounded font-mono text-sm border">
                            {cred.username}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(cred.username)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-600">Password:</label>
                        <div className="flex items-center space-x-2">
                          <code className="bg-white p-1 rounded font-mono text-sm border">
                            {showPasswords ? cred.password : '••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(cred.password || '')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">Super Admin Access:</h4>
              <div className="text-sm text-yellow-800 space-y-2">
                <div className="mb-2">
                  <strong>Login Instructions:</strong>
                </div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Use "Username Login" tab on the login page</li>
                  <li>Enter your username and password</li>
                  <li>Click "Sign in with Username"</li>
                  <li>Access "Super Admin" section from the navigation</li>
                </ol>
                <div className="mt-2 p-2 bg-yellow-100 rounded">
                  <strong>Super Admin Capabilities:</strong> Create organizations, manage all schools, invite users across organizations, view system analytics.
                </div>
              </div>
            </div>
          </div>
        )}

        {credentials.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No super admin accounts found. Create one to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminCredentialsManager;