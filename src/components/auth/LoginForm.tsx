
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, Users } from 'lucide-react';

const LoginForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, find the user credentials
      const { data: credentials, error: credentialsError } = await supabase
        .from('user_credentials')
        .select(`
          *,
          profiles!inner(email, role, school_id)
        `)
        .eq('username', username)
        .eq('default_password', password)
        .eq('is_active', true)
        .single();

      if (credentialsError || !credentials) {
        throw new Error('Invalid username or password');
      }

      // Create a temporary session by signing up the user if they don't exist in auth
      const email = credentials.profiles.email;
      
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        // If sign in fails, try to sign up the user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              first_name: '',
              last_name: '',
              role: credentials.profiles.role,
              school_id: credentials.profiles.school_id
            }
          }
        });

        if (signUpError) throw signUpError;
      }

      // Update password_changed status if using default password
      if (!credentials.password_changed) {
        await supabase
          .from('user_credentials')
          .update({ 
            password_changed: true,
            last_login: new Date().toISOString()
          })
          .eq('id', credentials.id);
      }

      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-amber-600">
            School ERP Login
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Choose your login method below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>Admin</span>
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>User</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="admin" className="space-y-4">
              <div className="text-center text-sm text-gray-600 mb-4">
                Login with your admin email and password
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <Label htmlFor="admin-email" className="text-red-700 font-semibold">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-password" className="text-red-700 font-semibold">Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                </div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In as Admin
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="user" className="space-y-4">
              <div className="text-center text-sm text-gray-600 mb-4">
                Login with your generated username and password
              </div>
              <form onSubmit={handleUserLogin} className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-red-700 font-semibold">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    placeholder="e.g., std_johsmi, tch_janedo"
                  />
                </div>
                <div>
                  <Label htmlFor="user-password" className="text-red-700 font-semibold">Password</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    placeholder="Your generated password"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;
