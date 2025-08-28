
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import TestCredentialsDialog from './TestCredentialsDialog';

const LoginSystem = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [credentialsLogin, setCredentialsLogin] = useState({
    username: '',
    password: ''
  });

  const [emailLogin, setEmailLogin] = useState({
    email: '',
    password: ''
  });

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with username:', credentialsLogin.username);
      
      // Get credentials and profile information
      const { data: credentials, error: credError } = await supabase
        .from('user_credentials')
        .select(`
          *,
          profiles:profile_id (
            id,
            email,
            first_name,
            last_name,
            role,
            school_id
          )
        `)
        .eq('username', credentialsLogin.username)
        .eq('is_active', true)
        .maybeSingle();

      console.log('Credentials lookup result:', credentials, credError);

      if (credError) {
        console.error('Database error:', credError);
        throw new Error('Database error occurred');
      }

      if (!credentials || !credentials.profiles) {
        throw new Error('Invalid username or password');
      }

      // Check password
      if (credentials.default_password !== credentialsLogin.password) {
        throw new Error('Invalid username or password');
      }

      console.log('Password matches, attempting Supabase auth...');

      // Try to sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.profiles.email,
        password: credentialsLogin.password
      });

      console.log('Auth result:', authData, authError);

      if (authError) {
        console.log('Auth user not found, creating...');
        
        // Try to create the auth user first
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: credentials.profiles.email,
          password: credentialsLogin.password,
          options: {
            data: {
              first_name: credentials.profiles.first_name,
              last_name: credentials.profiles.last_name,
              role: credentials.profiles.role,
              school_id: credentials.profiles.school_id
            },
            emailRedirectTo: window.location.origin
          }
        });

        console.log('SignUp result:', signUpData, signUpError);

        if (signUpError && !signUpError.message.includes('already registered')) {
          console.error('SignUp error:', signUpError);
          throw new Error(`Failed to create auth user: ${signUpError.message}`);
        }

        // Wait a moment then try signing in again
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
          email: credentials.profiles.email,
          password: credentialsLogin.password
        });

        if (retryError) {
          console.error('Retry auth error:', retryError);
          throw new Error('Login failed after account creation. Please try again in a moment.');
        }

        console.log('Login successful after creation');
      }

      // Update last login time
      await supabase
        .from('user_credentials')
        .update({ last_login: new Date().toISOString() })
        .eq('id', credentials.id);

      toast({
        title: "Login successful",
        description: `Welcome back, ${credentials.profiles.first_name}!`
      });

    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || 'An error occurred during login',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailLogin.email,
        password: emailLogin.password
      });

      if (error) throw error;

      toast({
        title: "Login successful",
        description: "Welcome back!"
      });

    } catch (error: any) {
      toast({
        title: "Login failed", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6" />
            School Management Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credentials">Username Login</TabsTrigger>
              <TabsTrigger value="email">Email Login</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials">
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={credentialsLogin.username}
                    onChange={(e) => setCredentialsLogin({ ...credentialsLogin, username: e.target.value })}
                    placeholder="Enter your username"
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={credentialsLogin.password}
                      onChange={(e) => setCredentialsLogin({ ...credentialsLogin, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                      className="bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Signing in...' : 'Sign in with Username'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailLogin.email}
                    onChange={(e) => setEmailLogin({ ...emailLogin, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                    className="bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="email-password"
                      type={showPassword ? "text" : "password"}
                      value={emailLogin.password}
                      onChange={(e) => setEmailLogin({ ...emailLogin, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                      className="bg-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Signing in...' : 'Sign in with Email'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Use your username and default password provided by admin</p>
            <p>or sign in with your registered email</p>
          </div>

          {/* Test Credentials Generator */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 mb-2">For Testing Purposes:</p>
            <TestCredentialsDialog />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginSystem;
