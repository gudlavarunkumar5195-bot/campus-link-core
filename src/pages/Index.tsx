
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/auth/AuthForm';
import Navigation from '@/components/layout/Navigation';
import Dashboard from '@/components/dashboard/Dashboard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentPage, setCurrentPage] = useState('dashboard');

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <AuthForm mode={authMode} onToggleMode={toggleAuthMode} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userRole={profile.role} />;
      case 'users':
        return <div className="p-6">Users management coming soon...</div>;
      case 'classes':
        return <div className="p-6">Classes management coming soon...</div>;
      case 'subjects':
        return <div className="p-6">Subjects management coming soon...</div>;
      case 'timetable':
        return <div className="p-6">Timetable management coming soon...</div>;
      case 'attendance':
        return <div className="p-6">Attendance management coming soon...</div>;
      case 'grades':
        return <div className="p-6">Grades management coming soon...</div>;
      case 'assignments':
        return <div className="p-6">Assignments management coming soon...</div>;
      case 'settings':
        return <div className="p-6">Settings coming soon...</div>;
      default:
        return <Dashboard userRole={profile.role} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
