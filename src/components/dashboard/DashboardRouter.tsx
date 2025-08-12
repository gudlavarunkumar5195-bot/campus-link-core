
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AdminDashboard from '@/pages/dashboards/AdminDashboard';
import TeacherDashboard from '@/pages/dashboards/TeacherDashboard';
import StudentDashboard from '@/pages/dashboards/StudentDashboard';
import StaffDashboard from '@/pages/dashboards/StaffDashboard';
import Header from '../layout/Header';

const DashboardRouter: React.FC = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Please log in to continue.</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        // For staff or any other role
        return <StaffDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div>
        {renderDashboard()}
      </div>
    </div>
  );
};

export default DashboardRouter;
