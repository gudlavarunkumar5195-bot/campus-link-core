
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, UserCheck, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStatsProps {
  userRole: 'admin' | 'teacher' | 'student';
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ userRole }) => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats', userRole],
    queryFn: async () => {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('No user');

      if (userRole === 'admin') {
        const [studentsCount, teachersCount, classesCount, subjectsCount] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact' }),
          supabase.from('teachers').select('id', { count: 'exact' }),
          supabase.from('classes').select('id', { count: 'exact' }),
          supabase.from('subjects').select('id', { count: 'exact' }),
        ]);

        return {
          students: studentsCount.count || 0,
          teachers: teachersCount.count || 0,
          classes: classesCount.count || 0,
          subjects: subjectsCount.count || 0,
        };
      }

      if (userRole === 'teacher') {
        const teacher = await supabase
          .from('teachers')
          .select('id')
          .eq('profile_id', user.data.user.id)
          .single();

        if (!teacher.data) return { classes: 0, students: 0, subjects: 0 };

        const [classesCount, studentsCount, subjectsCount] = await Promise.all([
          supabase
            .from('teacher_subjects')
            .select('class_id', { count: 'exact' })
            .eq('teacher_id', teacher.data.id),
          supabase
            .from('students')
            .select('id', { count: 'exact' })
            .in('class_id', []),
          supabase
            .from('teacher_subjects')
            .select('subject_id', { count: 'exact' })
            .eq('teacher_id', teacher.data.id),
        ]);

        return {
          classes: classesCount.count || 0,
          students: studentsCount.count || 0,
          subjects: subjectsCount.count || 0,
        };
      }

      // Student stats
      const student = await supabase
        .from('students')
        .select('id, class_id')
        .eq('profile_id', user.data.user.id)
        .single();

      if (!student.data) return { attendance: 0, grades: 0, assignments: 0 };

      const [attendanceCount, gradesCount, assignmentsCount] = await Promise.all([
        supabase
          .from('attendance')
          .select('id', { count: 'exact' })
          .eq('student_id', student.data.id),
        supabase
          .from('grades')
          .select('id', { count: 'exact' })
          .eq('student_id', student.data.id),
        supabase
          .from('assignments')
          .select('id', { count: 'exact' })
          .eq('class_id', student.data.class_id),
      ]);

      return {
        attendance: attendanceCount.count || 0,
        grades: gradesCount.count || 0,
        assignments: assignmentsCount.count || 0,
      };
    },
  });

  const getStatsConfig = () => {
    if (userRole === 'admin') {
      return [
        { title: 'Total Students', value: stats?.students || 0, icon: Users, color: 'text-blue-600' },
        { title: 'Total Teachers', value: stats?.teachers || 0, icon: UserCheck, color: 'text-green-600' },
        { title: 'Total Classes', value: stats?.classes || 0, icon: BookOpen, color: 'text-purple-600' },
        { title: 'Total Subjects', value: stats?.subjects || 0, icon: FileText, color: 'text-orange-600' },
      ];
    }

    if (userRole === 'teacher') {
      return [
        { title: 'My Classes', value: stats?.classes || 0, icon: BookOpen, color: 'text-blue-600' },
        { title: 'My Students', value: stats?.students || 0, icon: Users, color: 'text-green-600' },
        { title: 'My Subjects', value: stats?.subjects || 0, icon: FileText, color: 'text-purple-600' },
      ];
    }

    return [
      { title: 'Attendance Records', value: stats?.attendance || 0, icon: UserCheck, color: 'text-blue-600' },
      { title: 'Grades', value: stats?.grades || 0, icon: FileText, color: 'text-green-600' },
      { title: 'Assignments', value: stats?.assignments || 0, icon: BookOpen, color: 'text-purple-600' },
    ];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {getStatsConfig().map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
