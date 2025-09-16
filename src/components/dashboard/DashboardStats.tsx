import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, UserCheck, TrendingUp, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import IndiaFlagSection from '@/components/ui/india-flag-section';

interface DashboardStatsProps {
  userRole: 'admin' | 'teacher' | 'student';
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ userRole }) => {
  const { profile } = useAuth();

  // Fetch school information
  const { data: school } = useQuery({
    queryKey: ['school', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return null;
      
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id,
  });

  // Fetch counts for statistics
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return null;

      const [studentsResult, teachersResult, staffResult, classesResult] = await Promise.all([
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('profiles.school_id', profile.school_id),
        supabase
          .from('teachers') 
          .select('id', { count: 'exact', head: true })
          .eq('profiles.school_id', profile.school_id),
        supabase
          .from('staff')
          .select('id', { count: 'exact', head: true })
          .eq('profiles.school_id', profile.school_id),
        supabase
          .from('classes')
          .select('id', { count: 'exact', head: true })
          .eq('school_id', profile.school_id)
      ]);

      return {
        students: studentsResult.count || 0,
        teachers: teachersResult.count || 0,
        staff: staffResult.count || 0,
        classes: classesResult.count || 0,
      };
    },
    enabled: !!profile?.school_id,
  });

  const statsCards = [
    {
      title: 'Total Students',
      value: stats?.students?.toString() || '0',
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Teachers',
      value: stats?.teachers?.toString() || '0',
      icon: <UserCheck className="h-5 w-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Staff',
      value: stats?.staff?.toString() || '0',
      icon: <Building2 className="h-5 w-5" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Active Classes',
      value: stats?.classes?.toString() || '0',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <IndiaFlagSection
        title={`${userRole === 'admin' ? 'Admin' : userRole === 'teacher' ? 'Teacher' : 'Student'} Dashboard`}
        subtitle={school ? `Welcome to ${school.name} - Your academic management hub` : 'Welcome to your dashboard'}
        className="mb-8"
      />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <Card key={index} className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <div className={stat.color}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {school && (
          <Card className="mt-8 bg-white/80 backdrop-blur-sm border-white/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>School Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-slate-600">School Name</p>
                <p className="font-semibold text-slate-900">{school.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Address</p>
                <p className="font-semibold text-slate-900">{school.address || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Contact</p>
                <p className="font-semibold text-slate-900">{school.email || school.phone || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardStats;