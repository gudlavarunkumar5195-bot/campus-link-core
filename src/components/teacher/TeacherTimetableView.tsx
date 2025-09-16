import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, BookOpen, MapPin } from 'lucide-react';

const TeacherTimetableView = () => {
  const { profile } = useAuth();

  // Fetch teacher's timetable
  const { data: timetableData, isLoading } = useQuery({
    queryKey: ['teacher-timetable', profile?.id],
    queryFn: async () => {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (teacherError) throw teacherError;

      const { data, error } = await supabase
        .from('timetables')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          classes (
            id,
            name,
            grade_level,
            academic_year
          ),
          subjects (
            id,
            name,
            code
          )
        `)
        .eq('teacher_id', teacherData.id)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading your timetable...</div>;
  }

  const timetable: any[] = Array.isArray(timetableData) ? (timetableData as any[]) : [];


  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Group timetable by day (with guards)
  const timetableByDay = timetable.reduce((acc: Record<string, any[]>, item: any) => {
    const dayIndex = Math.max(0, Math.min(6, Number(item?.day_of_week ?? 0)));
    const day = dayNames[dayIndex] || 'Unknown';
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate teaching stats (with null-safety)
  const stats = React.useMemo(() => {
    const uniqueClasses = new Set(timetable.map((t: any) => t?.classes?.id).filter(Boolean));
    const uniqueSubjects = new Set(timetable.map((t: any) => t?.subjects?.id).filter(Boolean));
    const totalPeriods = timetable.length;
    const daysTeaching = Object.keys(timetableByDay).length;

    return {
      totalClasses: uniqueClasses.size,
      totalSubjects: uniqueSubjects.size,
      totalPeriods,
      daysTeaching
    };
  }, [timetable, timetableByDay]);

  const formatTime = (time: string) => {
    if (!time) return '';
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">My Teaching Schedule</h2>
        <p className="text-muted-foreground">View your weekly timetable and teaching assignments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">Different classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <Badge variant="outline">{stats.totalSubjects}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">Teaching subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Periods</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPeriods}</div>
            <p className="text-xs text-muted-foreground">Per week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.daysTeaching}</div>
            <p className="text-xs text-muted-foreground">Days per week</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Timetable */}
      <div className="space-y-4">
        {Object.entries(timetableByDay)
          .filter(([day]) => day !== 'Sunday') // Typically skip Sunday
          .map(([day, periods]) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {day}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(periods as any[]).map((period: any) => (
                    <div
                      key={period.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {formatTime(period.start_time)} - {formatTime(period.end_time)}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {period.subjects.code}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Subject</p>
                          <p className="font-semibold">{period.subjects.name}</p>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground">Class</p>
                          <p className="font-medium">
                            {period.classes.name} - Grade {period.classes.grade_level}
                          </p>
                        </div>

                        {period.room_number && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Room: {period.room_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {Object.keys(timetableByDay).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Timetable Found</h3>
            <p className="text-muted-foreground">
              Your teaching schedule hasn't been set up yet. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule Highlight */}
      {Object.keys(timetableByDay).length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Clock className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const today = dayNames[new Date().getDay()];
              const todaysPeriods = timetableByDay[today] || [];
              
              if (todaysPeriods.length === 0) {
                return (
                  <p className="text-muted-foreground">No classes scheduled for today.</p>
                );
              }

              return (
                <div className="space-y-2">
                  {todaysPeriods.map((period) => (
                    <div key={period.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          {formatTime(period.start_time)} - {formatTime(period.end_time)}
                        </Badge>
                        <span className="font-medium">{period.subjects.name}</span>
                        <span className="text-muted-foreground">• {period.classes.name}</span>
                      </div>
                      {period.room_number && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>Room {period.room_number}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherTimetableView;