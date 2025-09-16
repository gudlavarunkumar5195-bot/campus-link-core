
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
import Classes from '@/pages/Classes';
import Students from '@/pages/Students';
import Timetable from '@/pages/Timetable';
import Attendance from '@/pages/Attendance';
import Grades from '@/pages/Grades';
import Assignments from '@/pages/Assignments';
import Documents from '@/pages/Documents';
import Schedule from '@/pages/Schedule';
import Profile from '@/pages/Profile';
import CreateSchool from '@/pages/CreateSchool';
import SchoolsManagement from '@/pages/SchoolsManagement';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import AcceptInvitePage from '@/components/invite/AcceptInvitePage';
import Announcements from '@/pages/Announcements';
import Analytics from '@/pages/Analytics';
import BulkUpload from '@/pages/BulkUpload';
import Home from '@/pages/Home';
import SystemSettings from '@/pages/SystemSettings';
import UsersManagement from '@/pages/UsersManagement';
import AcademicYear from '@/pages/AcademicYear';

const queryClient = new QueryClient();

function AppContent() {
  const { user, profile, loading } = useAuth();

  // Enable auto-credentials generation
  useAutoCredentials(profile?.school_id || '');

  if (loading) {
    return (
      <div className="min-h-screen page-container animated-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
        <Route path="/home" element={<Home />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/bulk-upload" element={<BulkUpload />} />
        <Route path="/system-settings" element={<SystemSettings />} />
        <Route path="/users-management" element={<UsersManagement />} />
        <Route path="/school-config" element={<SchoolConfig />} />
        <Route path="/admin/add-student" element={<AddStudent />} />
        <Route path="/admin/add-teacher" element={<AddTeacher />} />
        <Route path="/admin/add-staff" element={<AddStaff />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/students" element={<Students />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-school" element={<CreateSchool />} />
        <Route path="/schools" element={<SchoolsManagement />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/academic-year" element={<AcademicYear />} />
        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
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
