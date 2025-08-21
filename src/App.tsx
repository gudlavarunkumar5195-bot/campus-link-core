
import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAutoCredentials } from '@/hooks/useAutoCredentials';
import LoginForm from '@/components/auth/LoginForm';
import DashboardRouter from '@/components/dashboard/DashboardRouter';
import SchoolConfig from '@/pages/SchoolConfig';
import AddStudent from '@/pages/admin/AddStudent';
import AddTeacher from '@/pages/admin/AddTeacher';
import AddStaff from '@/pages/admin/AddStaff';

const queryClient = new QueryClient();

function AppContent() {
  const { user, profile, loading } = useAuth();

  // Enable auto-credentials generation
  useAutoCredentials(profile?.school_id || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardRouter />} />
        <Route path="/school-config" element={<SchoolConfig />} />
        <Route path="/admin/add-student" element={<AddStudent />} />
        <Route path="/admin/add-teacher" element={<AddTeacher />} />
        <Route path="/admin/add-staff" element={<AddStaff />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
