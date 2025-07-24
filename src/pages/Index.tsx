
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import AuthForm from '@/components/auth/AuthForm';
import Navigation from '@/components/layout/Navigation';
import Dashboard from '@/components/dashboard/Dashboard';
import SchoolsManagement from '@/components/schools/SchoolsManagement';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Role-based routing
  useEffect(() => {
    if (isAuthenticated && profile) {
      const roleDashboards = {
        admin: '/admin-dashboard',
        teacher: '/teacher-dashboard',
        student: '/student-dashboard'
      };
      
      const targetDashboard = roleDashboards[profile.role];
      if (targetDashboard && window.location.pathname === '/') {
        navigate(targetDashboard);
      }
    }
  }, [isAuthenticated, profile, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <AuthForm />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
      case 'academic-years':
      case 'class-structure':
      case 'school-config':
      case 'users':
      case 'classes':
      case 'subjects':
      case 'timetable':
      case 'attendance':
      case 'grades':
      case 'assignments':
      case 'settings':
        return <Dashboard userRole={profile.role} currentPage={currentPage} />;
      case 'schools':
        return <SchoolsManagement />;
      case 'create-school':
        window.location.href = '/create-school';
        return null;
      default:
        return <Dashboard userRole={profile.role} currentPage="dashboard" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <div className="w-64 flex-shrink-0">
        <Navigation
          userRole={profile.role}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderCurrentPage()}
        </div>
      </div>
    </div>
  );
};

export default Index;
