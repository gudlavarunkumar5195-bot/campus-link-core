import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';

const StudentAttendanceView = () => {
  const { profile } = useAuth();

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['student-attendance', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      // Get student record
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, classes(id, name)')
        .eq('profile_id', profile.id)
        .single();

      if (studentError) throw studentError;

      // Get attendance records (last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('id, date, status, notes')
        .eq('student_id', student.id)
        .gte('date', threeMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;

      return {
        student,
        attendance: attendance || []
      };
    },
    enabled: !!profile?.id
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading your attendance...</div>;
  }

  if (!attendanceData) {
    return <div className="text-center py-12">No attendance data available.</div>;
  }

  const { student, attendance } = attendanceData;

  // Calculate statistics
  const totalDays = attendance.length;
  const presentDays = attendance.filter(a => a.status === 'present').length;
  const absentDays = attendance.filter(a => a.status === 'absent').length;
  const lateDays = attendance.filter(a => a.status === 'late').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  // Group attendance by month
  const attendanceByMonth = attendance.reduce((acc, record) => {
    const month = format(new Date(record.date), 'yyyy-MM');
    if (!acc[month]) {
      acc[month] = { present: 0, absent: 0, late: 0, total: 0 };
    }
    acc[month][record.status as keyof typeof acc[string]]++;
    acc[month].total++;
    return acc;
  }, {} as Record<string, { present: number; absent: number; late: number; total: number }>);

  // Recent attendance (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentAttendance = attendance.filter(a => new Date(a.date) >= thirtyDaysAgo);

  // Calendar view for current month
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getStatusBadge = (status: string) => {
    const variants = {
      present: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      absent: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      late: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' }
    };
    const config = variants[status as keyof typeof variants];
    const Icon = config?.icon || Clock;
    return (
      <Badge variant={config?.variant || 'outline'}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getAttendanceForDate = (date: Date) => {
    return attendance.find(a => a.date === format(date, 'yyyy-MM-dd'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Attendance - {student.classes?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{attendanceRate}%</div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{presentDays}</div>
              <p className="text-sm text-muted-foreground">Present Days</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{absentDays}</div>
              <p className="text-sm text-muted-foreground">Absent Days</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{lateDays}</div>
              <p className="text-sm text-muted-foreground">Late Days</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Overall Attendance</span>
              <span className="text-sm">{attendanceRate}%</span>
            </div>
            <Progress value={attendanceRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(attendanceByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 6)
              .map(([month, stats]) => {
                const monthRate = Math.round((stats.present / stats.total) * 100);
                return (
                  <div key={month} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">
                        {format(new Date(month + '-01'), 'MMMM yyyy')}
                      </h4>
                      <div className="flex gap-4 mt-2">
                        <span className="text-sm text-green-600">Present: {stats.present}</span>
                        <span className="text-sm text-red-600">Absent: {stats.absent}</span>
                        <span className="text-sm text-yellow-600">Late: {stats.late}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{monthRate}%</div>
                      <Progress value={monthRate} className="w-20 h-2 mt-2" />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAttendance.slice(0, 10).map((record) => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="font-medium">
                    {format(new Date(record.date), 'EEEE, MMMM do')}
                  </div>
                  {getStatusBadge(record.status)}
                </div>
                {record.notes && (
                  <div className="text-sm text-muted-foreground italic">
                    {record.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
          {recentAttendance.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No attendance records for the last 30 days.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Month Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>
            {format(currentMonth, 'MMMM yyyy')} Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-semibold text-sm text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }, (_, i) => (
              <div key={`empty-${i}`} className="p-2"></div>
            ))}
            
            {daysInMonth.map(date => {
              const attendanceRecord = getAttendanceForDate(date);
              const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isFutureDate = date > new Date();
              
              return (
                <div
                  key={format(date, 'yyyy-MM-dd')}
                  className={`
                    p-2 text-center border rounded text-sm
                    ${isToday ? 'bg-primary text-primary-foreground' : ''}
                    ${isWeekend(date) ? 'bg-muted/50' : ''}
                    ${isFutureDate ? 'opacity-50' : ''}
                  `}
                >
                  <div className="font-medium">{format(date, 'd')}</div>
                  {attendanceRecord && !isWeekend(date) && (
                    <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${
                      attendanceRecord.status === 'present' ? 'bg-green-500' :
                      attendanceRecord.status === 'absent' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }`}></div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span>Late</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAttendanceView;