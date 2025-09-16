
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import SignUpForm from './SignUpForm';

const AuthForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Log session data for debugging (check if tenant_id and role are in JWT)
      console.log('Login successful - Session data:', {
        user: data.user,
        session: data.session,
        userMetadata: data.user?.user_metadata
      });
      
      // Verify tenant_id and role are in user metadata
      if (data.user?.user_metadata?.tenant_id && data.user?.user_metadata?.role) {
        console.log('✅ JWT contains tenant_id and role:', {
          tenant_id: data.user.user_metadata.tenant_id,
          role: data.user.user_metadata.role
        });
      } else {
        console.warn('⚠️ JWT missing tenant_id or role in user_metadata');
      }
      
      toast({
        title: "Success",
        description: "Logged in successfully!",
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showSignUp) {
    return (
      <div className="min-h-screen page-container animated-bg flex items-center justify-center">
        <div className="form-container border-white/50 shadow-lg p-8 rounded-lg">
          <SignUpForm onBackToLogin={() => setShowSignUp(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-container animated-bg flex items-center justify-center">
        <Card className="w-full max-w-md form-container border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-foreground">
              School ERP Login
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your credentials to access your school account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-foreground font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass-effect"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-foreground font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="glass-effect"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full glass-effect" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full glass-effect" 
                  onClick={() => setShowSignUp(true)}
                  disabled={loading}
                >
                  Create New Account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
};

export default AuthForm;
