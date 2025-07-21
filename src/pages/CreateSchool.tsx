
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2 } from 'lucide-react';
import CreateSchoolForm from '@/components/schools/CreateSchoolForm';

const CreateSchool = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [createdSchool, setCreatedSchool] = useState(null);

  // Check if user is super admin
  const isSuperAdmin = profile?.role === 'admin' && profile?.school_id === null;

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Only super administrators can create schools.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSchoolCreated = (school: any) => {
    setCreatedSchool(school);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Create New School</h1>
              <p className="text-gray-600">Set up a new school in the system</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <CreateSchoolForm onSchoolCreated={handleSchoolCreated} />
        </div>

        {createdSchool && (
          <div className="mt-8 flex justify-center">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-center text-green-600">
                  School Created Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  {createdSchool.name} has been created successfully.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => navigate('/')}
                    className="w-full"
                  >
                    Return to Dashboard
                  </Button>
                  <Button 
                    onClick={() => setCreatedSchool(null)}
                    variant="outline"
                    className="w-full"
                  >
                    Create Another School
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateSchool;
