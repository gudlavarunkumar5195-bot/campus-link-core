import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, UserPlus } from 'lucide-react';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [inviteDetails, setInviteDetails] = useState<any>(null);
  
  const token = searchParams.get('token');

  const acceptInviteMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('accept-invite', {
        body: { 
          token,
          userEmail: user?.email 
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      toast({ 
        description: `Successfully joined ${data.organization.name}!` 
      });
      
      // Redirect to dashboard after successful acceptance
      setTimeout(() => {
        navigate('/');
        window.location.reload(); // Refresh to update auth context
      }, 2000);
    },
    onError: (error: any) => {
      if (error.message.includes('requires signup') || error.message.includes('sign up first')) {
        // Handle case where user needs to sign up first
        setInviteDetails(error.response?.data || { requiresSignup: true });
      } else {
        toast({ 
          variant: 'destructive', 
          description: error.message 
        });
      }
    }
  });

  useEffect(() => {
    if (!token) {
      toast({ 
        variant: 'destructive', 
        description: 'Invalid invitation link' 
      });
      navigate('/');
      return;
    }

    // If user is loaded and authenticated, try to accept the invite
    if (!loading && user) {
      acceptInviteMutation.mutate();
    }
  }, [token, user, loading]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Invalid invitation link. Please check your email for the correct link.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Processing invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user && !inviteDetails?.requiresSignup) {
    // Try to accept the invite for unauthenticated users
    // This will likely return a "requiresSignup" response
    if (!acceptInviteMutation.isPending && !acceptInviteMutation.isError) {
      acceptInviteMutation.mutate();
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Checking invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (inviteDetails?.requiresSignup || (!user && acceptInviteMutation.isError)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <UserPlus className="h-6 w-6" />
              Complete Your Invitation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please create an account to accept this invitation.
              </AlertDescription>
            </Alert>
            
            {inviteDetails && (
              <div className="text-center text-sm text-muted-foreground">
                <p>You've been invited to join as a <strong>{inviteDetails.role}</strong></p>
                <p>Email: <strong>{inviteDetails.email}</strong></p>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={() => navigate('/auth?mode=signup&email=' + (inviteDetails?.email || ''))} 
                className="w-full"
              >
                Create Account
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth?mode=login')} 
                className="w-full"
              >
                Sign In Instead
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              After creating your account, you'll automatically join the organization.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (acceptInviteMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Welcome!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>You've successfully joined the organization.</p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to the dashboard...
            </p>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (acceptInviteMutation.isPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Accepting invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (acceptInviteMutation.isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {acceptInviteMutation.error?.message || 'Failed to accept invitation'}
              </AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate('/')}>
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}