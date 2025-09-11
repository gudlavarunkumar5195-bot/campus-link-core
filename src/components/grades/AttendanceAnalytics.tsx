import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Users, TrendingDown, TrendingUp } from 'lucide-react';

interface AttendanceAnalyticsProps {
  classId: string;
}

const AttendanceAnalytics: React.FC<AttendanceAnalyticsProps> = ({ classId }) => {
  const { profile } = useAuth();

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-analytics', classId, profile?.school_id],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select(`
          id,
          date,
          status,
          students (
            id,
            profiles (first_name, last_name),
            class_id
          )
        `)
        .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Filter by class if selected
      if (classId) {
        const { data: classStudents } = await supabase
          .from('students')
          .select('id')
          .eq('class_id', classId);
        
        const studentIds = classStudents?.map(s => s.id) || [];
        if (studentIds.length > 0) {
          query = query.in('student_id', studentIds);
        }
      } else {
        // Filter by school
        const { data: schoolStudents } = await supabase
          .from('students')
          .select(`
            id,
            profiles!inner (school_id)
          `)
          .eq('profiles.school_id', profile?.school_id);
        
        const studentIds = schoolStudents?.map(s => s.id) || [];
        if (studentIds.length > 0) {
          query = query.in('student_id', studentIds);
        }
      }

      const { data: attendance, error } = await query;
      if (error) throw error;

      // Calculate daily attendance rates
      const dailyAttendance = attendance?.reduce((acc, record) => {
        const date = record.date;
        if (!acc[date]) {
          acc[date] = { present: 0, absent: 0, late: 0, total: 0 };
        }
        acc[date][record.status as keyof typeof acc[typeof date]] += 1;
        acc[date].total += 1;
        return acc;
      }, {} as Record<string, { present: number; absent: number; late: number; total: number }>);

      const dailyData = Object.entries(dailyAttendance || {}).map(([date, data]) => ({
        date,
        attendanceRate: Math.round((data.present / data.total) * 100),
        present: data.present,
        absent: data.absent,
        late: data.late,
        total: data.total
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Student attendance summary
      const studentAttendance = attendance?.reduce((acc, record) => {
        const studentName = `${record.students?.profiles?.first_name || ''} ${record.students?.profiles?.last_name || ''}`.trim();
        if (!acc[studentName]) {
          acc[studentName] = { present: 0, absent: 0, late: 0, total: 0 };
        }
        acc[studentName][record.status as keyof typeof acc[typeof studentName]] += 1;
        acc[studentName].total += 1;
        return acc;
      }, {} as Record<string, { present: number; absent: number; late: number; total: number }>);

      const studentData = Object.entries(studentAttendance || {})
        .map(([name, data]) => ({
          name,
          attendanceRate: Math.round((data.present / data.total) * 100),
          present: data.present,
          absent: data.absent,
          late: data.late,
          total: data.total
        }))
        .sort((a, b) => b.attendanceRate - a.attendanceRate);

      // Weekly summary
      const weeklyData = dailyData.reduce((acc, day) => {
        const week = `Week ${Math.ceil((new Date().getTime() - new Date(day.date).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
        if (!acc[week]) {
          acc[week] = { totalPresent: 0, totalRecords: 0 };
        }
        acc[week].totalPresent += day.present;
        acc[week].totalRecords += day.total;
        return acc;
      }, {} as Record<string, { totalPresent: number; totalRecords: number }>);

      const weeklyAttendance = Object.entries(weeklyData).map(([week, data]) => ({
        week,
        rate: Math.round((data.totalPresent / data.totalRecords) * 100)
      }));

      const totalRecords = attendance?.length || 0;
      const presentRecords = attendance?.filter(a => a.status === 'present').length || 0;
      const overallRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

      return {
        dailyData,
        studentData,
        weeklyAttendance,
        totalRecords,
        overallRate,
        presentRecords,
        absentRecords: attendance?.filter(a => a.status === 'absent').length || 0,
        lateRecords: attendance?.filter(a => a.status === 'late').length || 0
      };
    },
    enabled: !!profile?.school_id
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading attendance analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Rate</CardTitle>
            {(attendanceData?.overallRate || 0) >= 85 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData?.overallRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Last 90 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData?.presentRecords || 0}</div>
            <p className="text-xs text-muted-foreground">Total present</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData?.absentRecords || 0}</div>
            <p className="text-xs text-muted-foreground">Total absent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceData?.lateRecords || 0}</div>
            <p className="text-xs text-muted-foreground">Total late</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData?.dailyData?.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="attendanceRate" 
                  stroke="#8884d8" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData?.weeklyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rate" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Student Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Student Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceData?.studentData?.slice(0, 10).map((student) => (
              <div key={student.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{student.name || 'Unknown Student'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {student.present} present • {student.absent} absent • {student.late} late
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{student.attendanceRate}%</div>
                  <Badge variant={
                    student.attendanceRate >= 95 ? 'default' :
                    student.attendanceRate >= 90 ? 'secondary' :
                    student.attendanceRate >= 80 ? 'outline' : 'destructive'
                  }>
                    {student.attendanceRate >= 95 ? 'Excellent' :
                     student.attendanceRate >= 90 ? 'Good' :
                     student.attendanceRate >= 80 ? 'Fair' : 'Poor'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceAnalytics;