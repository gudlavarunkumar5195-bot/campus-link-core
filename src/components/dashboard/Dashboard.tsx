
import React from 'react';
import DashboardStats from './DashboardStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardProps {
  userRole: 'admin' | 'teacher' | 'student';
}

const Dashboard: React.FC<DashboardProps> = ({ userRole }) => {
  const getWelcomeMessage = () => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
        <p className="text-gray-600 mt-2">
          {userRole === 'admin' && 'Manage your school operations from here.'}
          {userRole === 'teacher' && 'Track your classes, students, and assignments.'}
          {userRole === 'student' && 'View your academic progress and assignments.'}
        </p>
      </div>

      <DashboardStats userRole={userRole} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-500 text-center py-8">
              Recent activity will be displayed here
            </div>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
};

export default Dashboard;
