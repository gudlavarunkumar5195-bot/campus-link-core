import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, GraduationCap } from 'lucide-react';

const StudentClassesView = () => {
  const { profile } = useAuth();

  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student-classes', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      // Get student record and class information
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          class_id,
          roll_number,
          section,
          academic_year,
          classes (
            id,
            name,
            grade_level,
            academic_year,
            max_students,
            class_teacher_id,
            teachers (
              id,
              profiles (first_name, last_name)
            )
          )
        `)
        .eq('profile_id', profile.id)
        .single();

      if (studentError) throw studentError;

      // Get subjects for the student's class
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, code, description')
        .eq('school_id', profile.school_id);

      if (subjectsError) throw subjectsError;

      // Get timetable for the student's class
      const { data: timetable, error: timetableError } = await supabase
        .from('timetables')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          subjects (name, code),
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
        subjects: subjects || [],
        timetable: timetable || []
      };
    },
    enabled: !!profile?.id
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading your classes...</div>;
  }

  if (!studentData) {
    return <div className="text-center py-12">No class information available.</div>;
  }

  const { student, subjects, timetable } = studentData;
  const classTeacher = student.classes?.teachers?.[0];

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Group timetable by day
  const timetableByDay = timetable.reduce((acc, item) => {
    const day = dayNames[item.day_of_week];
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<string, typeof timetable>);

  return (
    <div className="space-y-6">
      {/* Class Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            My Class Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Class</h4>
              <p className="text-lg font-bold">{student.classes?.name}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Roll Number</h4>
              <p className="text-lg font-bold">{student.roll_number || 'Not assigned'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Section</h4>
              <p className="text-lg font-bold">{student.section || 'Not assigned'}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Academic Year</h4>
              <p className="text-lg font-bold">{student.academic_year || student.classes?.academic_year}</p>
            </div>
          </div>
          
          {classTeacher && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold text-sm text-muted-foreground mb-2">Class Teacher</h4>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{classTeacher.profiles?.first_name} {classTeacher.profiles?.last_name}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{subject.name}</h4>
                    <p className="text-sm text-muted-foreground">{subject.code}</p>
                    {subject.description && (
                      <p className="text-xs text-muted-foreground mt-2">{subject.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{subject.code}</Badge>
                </div>
              </div>
            ))}
          </div>
          {subjects.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No subjects assigned yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Weekly Schedule Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(timetableByDay)
              .filter(([day]) => day !== 'Sunday') // Skip Sunday typically
              .map(([day, classes]) => (
                <div key={day} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{day}</h4>
                  <div className="space-y-2">
                    {classes.map((classItem) => (
                      <div key={classItem.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">
                            {classItem.start_time} - {classItem.end_time}
                          </div>
                          <Badge variant="outline">{classItem.subjects?.name}</Badge>
                          {classItem.room_number && (
                            <span className="text-xs text-muted-foreground">
                              Room: {classItem.room_number}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {classItem.teachers?.profiles?.first_name} {classItem.teachers?.profiles?.last_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
          {Object.keys(timetableByDay).length === 0 && (
            <p className="text-center text-muted-foreground py-8">No timetable available yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentClassesView;