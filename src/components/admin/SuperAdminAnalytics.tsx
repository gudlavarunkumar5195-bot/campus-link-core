import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Building2, Users, GraduationCap, BookOpen, TrendingUp, Calendar } from 'lucide-react';

const SuperAdminAnalytics = () => {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['super-admin-analytics'],
    queryFn: async () => {
      // Fetch all statistics in parallel
      const [
        schoolsResult,
        profilesResult,
        studentsResult,
        teachersResult,
        staffResult,
        gradesResult,
        attendanceResult,
        subjectsResult
      ] = await Promise.all([
        supabase.from('schools').select('id, name, created_at'),
        supabase.from('profiles').select('id, role, school_id, created_at'),
        supabase.from('students').select('id, profiles!inner(school_id)'),
        supabase.from('teachers').select('id, profiles!inner(school_id)'),
        supabase.from('staff').select('id, profile_id, profiles!staff_profile_id_fkey(school_id)'),
        supabase.from('grades').select('score, max_score, date').not('score', 'is', null),
        supabase.from('attendance').select('status, date').gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase.from('subjects').select('id, school_id')
      ]);

      const schools = schoolsResult.data || [];
      const profiles = profilesResult.data || [];
      const students = studentsResult.data || [];
      const teachers = teachersResult.data || [];
      const staff = staffResult.data || [];
      const grades = gradesResult.data || [];
      const attendance = attendanceResult.data || [];
      const subjects = subjectsResult.data || [];

      // Calculate statistics
      const totalSchools = schools.length;
      const totalStudents = students.length;
      const totalTeachers = teachers.length;
      const totalStaff = staff.length;
      const totalSubjects = subjects.length;

      // School-wise statistics
      const schoolStats = schools.map(school => {
        const schoolStudents = students.filter(s => s.profiles?.school_id === school.id).length;
        const schoolTeachers = teachers.filter(t => t.profiles?.school_id === school.id).length;
        const schoolStaff = staff.filter(st => st.profiles && st.profiles.school_id === school.id).length;
        
        return {
          name: school.name,
          students: schoolStudents,
          teachers: schoolTeachers,
          staff: schoolStaff,
          total: schoolStudents + schoolTeachers + schoolStaff
        };
      });

      // Role distribution
      const roleDistribution = profiles.reduce((acc, profile) => {
        acc[profile.role] = (acc[profile.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const roleData = Object.entries(roleDistribution).map(([role, count]) => ({
        role: role.charAt(0).toUpperCase() + role.slice(1),
        count,
        percentage: Math.round((count / profiles.length) * 100)
      }));

      // Performance metrics
      const avgGrade = grades.length > 0 
        ? grades.reduce((sum, g) => sum + (g.score || 0) / (g.max_score || 100) * 100, 0) / grades.length 
        : 0;
      
      const attendanceRate = attendance.length > 0 
        ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 
        : 0;

      // Monthly growth (schools created)
      const monthlyGrowth = schools.reduce((acc, school) => {
        const month = new Date(school.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const growthData = Object.entries(monthlyGrowth).map(([month, count]) => ({
        month,
        schools: count
      })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      return {
        totalSchools,
        totalStudents,
        totalTeachers,
        totalStaff,
        totalSubjects,
        schoolStats,
        roleData,
        avgGrade: Math.round(avgGrade),
        attendanceRate: Math.round(attendanceRate),
        growthData,
        totalGrades: grades.length
      };
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading analytics...</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalSchools || 0}</div>
            <p className="text-xs text-muted-foreground">Active organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Across all schools</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalTeachers || 0}</div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalStaff || 0}</div>
            <p className="text-xs text-muted-foreground">Administrative staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.avgGrade || 0}%</div>
            <p className="text-xs text-muted-foreground">System-wide average</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schools Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Schools Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData?.schoolStats?.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#8884d8" name="Students" />
                <Bar dataKey="teachers" fill="#82ca9d" name="Teachers" />
                <Bar dataKey="staff" fill="#ffc658" name="Staff" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData?.roleData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({role, percentage}) => `${role}: ${percentage}%`}
                >
                  {analyticsData?.roleData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Growth Trend */}
        <Card>
          <CardHeader>
            <CardTitle>School Registration Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData?.growthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="schools" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analyticsData?.attendanceRate}%</div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analyticsData?.totalGrades}</div>
                <p className="text-sm text-muted-foreground">Total Assessments</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Schools</span>
                <span>{analyticsData?.totalSchools}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Users</span>
                <span>{(analyticsData?.totalStudents || 0) + (analyticsData?.totalTeachers || 0) + (analyticsData?.totalStaff || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subjects Offered</span>
                <span>{analyticsData?.totalSubjects}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;