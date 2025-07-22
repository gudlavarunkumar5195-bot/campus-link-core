
import React from 'react';
import DashboardStats from './DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Users, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  userRole: 'admin' | 'teacher' | 'student';
}

const Dashboard: React.FC<DashboardProps> = ({ userRole }) => {
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: schoolsCount } = useQuery({
    queryKey: ['schools-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
    enabled: profile?.role === 'admin' && profile?.school_id === null,
  });

  const isSuperAdmin = profile?.role === 'admin' && profile?.school_id === null;

  const getWelcomeMessage = () => {
    if (isSuperAdmin) {
      return 'Welcome to the Super Admin Dashboard';
    }
    switch (userRole) {
      case 'admin':
        return 'Welcome to the Admin Dashboard';
      case 'teacher':
        return 'Welcome to the Teacher Dashboard';
      case 'student':
        return 'Welcome to the Student Dashboard';
      default:
        return 'Welcome to the Dashboard';
    }
  };

  const getDescription = () => {
    if (isSuperAdmin) {
      return 'Manage all schools and system-wide settings from here.';
    }
    switch (userRole) {
      case 'admin':
        return 'Manage your school operations from here.';
      case 'teacher':
        return 'Track your classes, students, and assignments.';
      case 'student':
        return 'View your academic progress and assignments.';
      default:
        return '';
    }
  };

  const renderSuperAdminQuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate('/create-school')}
            className="flex flex-col items-center space-y-2 h-20"
          >
            <Plus className="h-6 w-6" />
            <span>Create School</span>
          </Button>
          <Button 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-20"
            onClick={() => navigate('/schools')}
          >
            <Building2 className="h-6 w-6" />
            <span>Manage Schools</span>
          </Button>
          <Button 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-20"
            onClick={() => navigate('/users')}
          >
            <Users className="h-6 w-6" />
            <span>Manage Users</span>
          </Button>
          <Button 
            variant="outline"
            className="flex flex-col items-center space-y-2 h-20"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-6 w-6" />
            <span>System Settings</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSuperAdminStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Schools</p>
              <p className="text-3xl font-bold">{schoolsCount || 0}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold">--</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sessions</p>
              <p className="text-3xl font-bold">--</p>
            </div>
            <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">S</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-3xl font-bold text-green-600">Good</p>
            </div>
            <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">✓</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
        <p className="text-gray-600 mt-2">{getDescription()}</p>
      </div>

      {isSuperAdmin ? renderSuperAdminStats() : <DashboardStats userRole={userRole} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-500 text-center py-8">
              {isSuperAdmin ? (
                <div>
                  <p className="mb-2">System-wide activity monitoring</p>
                  <p className="text-sm">Recent school registrations, user activities, and system events will be displayed here</p>
                </div>
              ) : (
                "Recent activity will be displayed here"
              )}
            </div>
          </CardContent>
        </Card>

        {isSuperAdmin ? (
          renderSuperAdminQuickActions()
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500 text-center py-8">
                Quick action buttons will be displayed here
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
