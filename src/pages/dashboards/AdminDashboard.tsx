
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, UserPlus, GraduationCap, Settings, Upload, Key, FileText, Calendar, BarChart3, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import IndiaFlagSection from '@/components/ui/india-flag-section';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const navigationCards = [
    {
      title: 'Add Student',
      description: 'Register new students in the system',
      icon: <UserPlus className="h-6 w-6" />,
      path: '/admin/add-student',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Add Teacher',
      description: 'Add new teaching staff members',
      icon: <GraduationCap className="h-6 w-6" />,
      path: '/admin/add-teacher',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      title: 'Add Staff',
      description: 'Register administrative staff',
      icon: <Users className="h-6 w-6" />,
      path: '/admin/add-staff',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Bulk Upload',
      description: 'Import multiple records at once',
      icon: <Upload className="h-6 w-6" />,
      path: '/bulk-upload',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      iconColor: 'text-orange-600'
    },
    {
      title: 'User Credentials',
      description: 'Generate and manage login credentials',
      icon: <Key className="h-6 w-6" />,
      path: '/school-config',
      color: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',
      iconColor: 'text-cyan-600'
    },
    {
      title: 'Manage Classes',
      description: 'Create and manage class structures',
      icon: <BookOpen className="h-6 w-6" />,
      path: '/classes',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'School Settings',
      description: 'Configure school preferences',
      icon: <Settings className="h-6 w-6" />,
      path: '/school-config',
      color: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
      iconColor: 'text-gray-600'
    },
    {
      title: 'Academic Year',
      description: 'Configure academic calendar',
      icon: <Calendar className="h-6 w-6" />,
      path: '#',
      onClick: () => navigate('/', { state: { page: 'academic-years' } }),
      color: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
      iconColor: 'text-teal-600'
    },
    {
      title: 'Analytics',
      description: 'View school performance metrics',
      icon: <BarChart3 className="h-6 w-6" />,
      path: '#',
      onClick: () => navigate('/', { state: { page: 'analytics' } }),
      color: 'bg-red-50 hover:bg-red-100 border-red-200',
      iconColor: 'text-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <IndiaFlagSection
        title="School Administration Dashboard"
        subtitle={`Welcome back, ${profile?.first_name}! Manage your school efficiently with our comprehensive tools.`}
        className="mb-8"
      >
        <div className="flex justify-center">
          <Badge variant="secondary" className="bg-white/80 text-slate-700">
            Administrative Panel
          </Badge>
        </div>
      </IndiaFlagSection>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card, index) => (
            <Card 
              key={index} 
              className={`${card.color} border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer`}
              onClick={() => card.onClick ? card.onClick() : navigate(card.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className={`${card.iconColor} p-2 rounded-lg bg-white/50`}>
                    {card.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    {card.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 text-sm mb-4">{card.description}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full bg-white/50 hover:bg-white/80 border-white/50"
                >
                  Access {card.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="mt-12">
          <IndiaFlagSection
            title="Quick Overview"
            subtitle="Essential school statistics at a glance"
            className="rounded-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/90 p-6 rounded-lg shadow-sm border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Total Students</p>
                    <p className="text-2xl font-bold text-slate-800">--</p>
                  </div>
                  <UserPlus className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white/90 p-6 rounded-lg shadow-sm border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Teaching Staff</p>
                    <p className="text-2xl font-bold text-slate-800">--</p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white/90 p-6 rounded-lg shadow-sm border border-white/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Active Classes</p>
                    <p className="text-2xl font-bold text-slate-800">--</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>
          </IndiaFlagSection>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
