
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, UserPlus, GraduationCap, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-amber-600">Admin Dashboard</h1>
          <p className="text-gray-400">Welcome back, {profile?.first_name}!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <UserPlus className="h-5 w-5" />
                <span>Add Student</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Create new student accounts and manage student information
              </p>
              <Button 
                onClick={() => navigate('/admin/add-student')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Add Student
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <GraduationCap className="h-5 w-5" />
                <span>Add Teacher</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Create new teacher accounts and assign subjects
              </p>
              <Button 
                onClick={() => navigate('/admin/add-teacher')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Add Teacher
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <Users className="h-5 w-5" />
                <span>Add Staff</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Create new staff accounts and manage positions
              </p>
              <Button 
                onClick={() => navigate('/admin/add-staff')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Add Staff
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <BookOpen className="h-5 w-5" />
                <span>Manage Classes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Create and manage class structures and assignments
              </p>
              <Button 
                onClick={() => navigate('/classes')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Manage Classes
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-amber-600">
                <Settings className="h-5 w-5" />
                <span>School Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Configure school settings and academic structure
              </p>
              <Button 
                onClick={() => navigate('/school-config')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                School Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
