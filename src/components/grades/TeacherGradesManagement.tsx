import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import GradeAnalytics from './GradeAnalytics';
import AttendanceAnalytics from './AttendanceAnalytics';
import GradeBookManager from './GradeBookManager';
import { BarChart, TrendingUp, Users, Award } from 'lucide-react';

const TeacherGradesManagement = () => {
  const { profile } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Fetch classes taught by this teacher
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['teacher-classes', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          grade_level,
          academic_year,
          students (
            id,
            profiles (first_name, last_name)
          )
        `)
        .eq('school_id', profile?.school_id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id
  });

  // Fetch overall statistics
  const { data: stats } = useQuery({
    queryKey: ['teacher-stats', profile?.id],
    queryFn: async () => {
      const [gradesResult, attendanceResult, studentsResult] = await Promise.all([
        supabase
          .from('grades')
          .select('score, max_score')
          .not('score', 'is', null),
        supabase
          .from('attendance')
          .select('status')
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase
          .from('students')
          .select('id, profiles!inner(school_id)')
          .eq('profiles.school_id', profile?.school_id)
      ]);

      const grades = gradesResult.data || [];
      const attendance = attendanceResult.data || [];
      const students = studentsResult.data || [];

      const avgGrade = grades.length > 0 
        ? grades.reduce((sum, g) => sum + (g.score || 0) / (g.max_score || 100) * 100, 0) / grades.length 
        : 0;
      
      const attendanceRate = attendance.length > 0 
        ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 
        : 0;

      return {
        totalStudents: students.length,
        averageGrade: Math.round(avgGrade),
        attendanceRate: Math.round(attendanceRate),
        totalGrades: grades.length
      };
    },
    enabled: !!profile?.school_id
  });

  if (classesLoading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Across all classes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageGrade || 0}%</div>
            <p className="text-xs text-muted-foreground">Class performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.attendanceRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGrades || 0}</div>
            <p className="text-xs text-muted-foreground">Grades entered</p>
          </CardContent>
        </Card>
      </div>

      {/* Class Selection */}
      <div className="flex flex-wrap gap-2">
        <Badge 
          variant={selectedClass === '' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSelectedClass('')}
        >
          All Classes
        </Badge>
        {classes?.map((cls) => (
          <Badge
            key={cls.id}
            variant={selectedClass === cls.id ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedClass(cls.id)}
          >
            {cls.name} - Grade {cls.grade_level}
          </Badge>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="gradebook">Grade Book</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="complement">Complement Grades</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <GradeAnalytics classId={selectedClass} />
        </TabsContent>

        <TabsContent value="gradebook" className="space-y-4">
          <GradeBookManager classId={selectedClass} />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <AttendanceAnalytics classId={selectedClass} />
        </TabsContent>

        <TabsContent value="complement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complement Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Complement grades feature allows you to add additional assessment methods and 
                alternative grading scales. This will be implemented to support:
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Competency-based assessments</li>
                <li>• Portfolio evaluations</li>
                <li>• Peer assessments</li>
                <li>• Self-reflection grades</li>
                <li>• Project-based scoring</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherGradesManagement;