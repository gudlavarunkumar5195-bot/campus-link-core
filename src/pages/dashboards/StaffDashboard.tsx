
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, Calendar, ClipboardList, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-amber-600">Staff Dashboard</h1>
          <p className="text-gray-600">Welcome back, {profile?.first_name}!</p>
          <p className="text-sm text-gray-500">Position: Administrative Staff</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white border-gray-200 hover:border-amber-500 transition-colors shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <Users className="h-5 w-5" />
                <span>Student Records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                View and manage student information and records
              </p>
              <Button 
                onClick={() => navigate('/students')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Manage Students
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:border-amber-500 transition-colors shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <FileText className="h-5 w-5" />
                <span>Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Manage school documents and administrative files
              </p>
              <Button 
                onClick={() => navigate('/documents')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Documents
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:border-amber-500 transition-colors shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <Calendar className="h-5 w-5" />
                <span>Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                View your work schedule and important dates
              </p>
              <Button 
                onClick={() => navigate('/schedule')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Schedule
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:border-amber-500 transition-colors shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <ClipboardList className="h-5 w-5" />
                <span>Attendance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                View your attendance records and working hours
              </p>
              <Button 
                onClick={() => navigate('/attendance')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                View Attendance
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 hover:border-amber-500 transition-colors shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <Settings className="h-5 w-5" />
                <span>Profile Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">
                Update your profile information and preferences
              </p>
              <Button 
                onClick={() => navigate('/profile')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
