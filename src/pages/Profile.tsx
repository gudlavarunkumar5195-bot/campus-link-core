
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  if (!user || !profile) {
    return (
      <div className="min-h-screen page-container animated-bg flex items-center justify-center">
        <div className="text-center form-container border-white/50 shadow-lg p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-2 text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-container animated-bg">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 glass-effect"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
              <p className="text-muted-foreground">Update your profile information and preferences</p>
            </div>
          </div>
        </div>

        <Card className="form-container border-white/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>My Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Current Information</h3>
                <p><strong>Name:</strong> {profile.first_name} {profile.last_name}</p>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Role:</strong> {profile.role}</p>
                <p><strong>Phone:</strong> {profile.phone || 'Not provided'}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-muted-foreground">
                  Profile editing functionality will be implemented here. 
                  This page will allow you to update your personal information, preferences, and settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
