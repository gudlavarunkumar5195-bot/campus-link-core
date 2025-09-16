import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';

const StudentTimetableView = () => {
  const { profile } = useAuth();

  const { data: timetableData, isLoading } = useQuery({
    queryKey: ['student-timetable', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      // First get student's class
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, class_id, classes(id, name)')
        .eq('profile_id', profile.id)
        .single();

      if (studentError) throw studentError;

      // Get timetable for the student's class
      const { data: timetable, error: timetableError } = await supabase
        .from('timetables')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          subjects (id, name, code),
          teachers (
            id,
            profiles (first_name, last_name)
          )
        `)
        .eq('class_id', student.class_id)
        .order('day_of_week')
        .order('start_time');

      if (timetableError) throw timetableError;

      return {
        student,
        timetable: timetable || []
      };
    },
    enabled: !!profile?.id
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading your timetable...</div>;
  }

  if (!timetableData) {
    return <div className="text-center py-12">No timetable available.</div>;
  }

  const { student, timetable } = timetableData;
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [...new Set(timetable.map(t => `${t.start_time}-${t.end_time}`))].sort();

  // Group timetable by day and time
  const timetableGrid = dayNames.reduce((acc, day, dayIndex) => {
    acc[day] = {};
    timeSlots.forEach(slot => {
      const [startTime] = slot.split('-');
      const classForSlot = timetable.find(
        t => t.day_of_week === dayIndex && t.start_time === startTime
      );
      acc[day][slot] = classForSlot || null;
    });
    return acc;
  }, {} as Record<string, Record<string, any>>);

  const workingDays = dayNames.slice(1, 6); // Monday to Friday

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Timetable - {student.classes?.name}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Timetable Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-3 bg-muted/50 text-left font-semibold min-w-[120px]">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Time
                  </th>
                  {workingDays.map((day) => (
                    <th key={day} className="border p-3 bg-muted/50 text-center font-semibold min-w-[200px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot}>
                    <td className="border p-3 bg-muted/30 font-medium text-center">
                      {slot}
                    </td>
                    {workingDays.map((day) => {
                      const classItem = timetableGrid[day][slot];
                      return (
                        <td key={`${day}-${slot}`} className="border p-3 h-24">
                          {classItem ? (
                            <div className="h-full flex flex-col justify-between">
                              <div>
                                <Badge variant="default" className="mb-2">
                                  {classItem.subjects?.name}
                                </Badge>
                                <div className="text-sm font-medium">
                                  {classItem.subjects?.code}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <div className="flex items-center gap-1 mb-1">
                                  <MapPin className="h-3 w-3" />
                                  {classItem.room_number || 'TBA'}
                                </div>
                                <div>
                                  {classItem.teachers?.profiles?.first_name} {classItem.teachers?.profiles?.last_name}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                              -
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {timeSlots.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No timetable has been set up yet for your class.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">Subject</Badge>
              <span className="text-sm text-muted-foreground">Subject Name</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Room Number</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Time Duration</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTimetableView;