
import React from 'react';
import { Users, BookOpen, Calendar, UserCheck, CalendarDays, ClipboardList, Cog } from 'lucide-react';
import DashboardStats from './DashboardStats';
import AcademicYearManagement from '../academic-year/AcademicYearManagement';
import ClassStructureManagement from '../class-structure/ClassStructureManagement';
import SchoolConfiguration from '../school-config/SchoolConfiguration';

interface DashboardProps {
  currentPage: string;
  userRole: 'admin' | 'teacher' | 'student';
}

const Dashboard: React.FC<DashboardProps> = ({ currentPage, userRole }) => {
  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardStats userRole={userRole} />;
      case 'academic-years':
        return <AcademicYearManagement />;
      case 'class-structure':
        return <ClassStructureManagement />;
      case 'school-config':
        return <SchoolConfiguration />;
      case 'analytics':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
            <p className="text-gray-600">School analytics and performance metrics will be displayed here.</p>
          </div>
        );
      case 'users':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Users Management</h1>
            <p className="text-gray-600">User management functionality will be implemented here.</p>
          </div>
        );
      case 'classes':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Classes</h1>
            <p className="text-gray-600">Class management functionality will be implemented here.</p>
          </div>
        );
      case 'subjects':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Subjects</h1>
            <p className="text-gray-600">Subject management functionality will be implemented here.</p>
          </div>
        );
      case 'timetable':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Timetable</h1>
            <p className="text-gray-600">Timetable functionality will be implemented here.</p>
          </div>
        );
      case 'attendance':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Attendance</h1>
            <p className="text-gray-600">Attendance functionality will be implemented here.</p>
          </div>
        );
      case 'grades':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Grades</h1>
            <p className="text-gray-600">Grades functionality will be implemented here.</p>
          </div>
        );
      case 'assignments':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Assignments</h1>
            <p className="text-gray-600">Assignments functionality will be implemented here.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Settings</h1>
            <p className="text-gray-600">Settings functionality will be implemented here.</p>
          </div>
        );
      default:
        return <DashboardStats userRole={userRole} />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {renderContent()}
    </div>
  );
};

export default Dashboard;
