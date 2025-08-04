
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SchoolsManagementPage from "./pages/SchoolsManagement";
import CreateSchool from "./pages/CreateSchool";
import UsersManagement from "./pages/UsersManagement";
import SystemSettings from "./pages/SystemSettings";
import Analytics from "./pages/Analytics";
import AddStudent from "./pages/admin/AddStudent";
import AddTeacher from "./pages/admin/AddTeacher";
import AddStaff from "./pages/admin/AddStaff";
import Classes from "./pages/Classes";
import SchoolConfig from "./pages/SchoolConfig";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import TeacherDashboard from "./pages/dashboards/TeacherDashboard";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/schools" element={<SchoolsManagementPage />} />
          <Route path="/create-school" element={<CreateSchool />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/settings" element={<SystemSettings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin/add-student" element={<AddStudent />} />
          <Route path="/admin/add-teacher" element={<AddTeacher />} />
          <Route path="/admin/add-staff" element={<AddStaff />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/school-config" element={<SchoolConfig />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
