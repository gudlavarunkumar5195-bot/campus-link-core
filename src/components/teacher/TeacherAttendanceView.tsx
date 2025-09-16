import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Users, Check, X, Clock, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AttendanceStatus = 'present' | 'absent' | 'late';

interface StudentAttendance {
  student_id: string;
  student_name: string;
  roll_number: string;
  status: AttendanceStatus;
  existing_id?: string;
}

const TeacherAttendanceView = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, StudentAttendance>>({});

  // Fetch teacher's assigned classes
  const { data: assignedClasses } = useQuery({
    queryKey: ['teacher-classes', profile?.id],
    queryFn: async () => {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (teacherError) throw teacherError;

      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .select(`
          class_id,
          classes (
            id,
            name,
            grade_level,
            academic_year
          )
        `)
        .eq('teacher_id', teacherData.id);

      if (error) throw error;
      
      // Remove duplicates
      const uniqueClasses = data.reduce((acc, item) => {
        const classId = item.classes.id;
        if (!acc.find(c => c.id === classId)) {
          acc.push(item.classes);
        }
        return acc;
      }, [] as any[]);
      
      return uniqueClasses;
    },
    enabled: !!profile?.id
  });

  // Fetch students and existing attendance for selected class and date
  const { data: classStudents, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students-attendance', selectedClass, selectedDate],
    queryFn: async () => {
      if (!selectedClass) return null;

      // Get students in the class
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          roll_number,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('class_id', selectedClass);

      if (studentsError) throw studentsError;

      // Get existing attendance for this date
      const { data: existingAttendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('id, student_id, status')
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);

      if (attendanceError) throw attendanceError;

      // Combine students with their attendance status
      const studentsWithAttendance = students.map(student => {
        const existing = existingAttendance?.find(a => a.student_id === student.id);
        return {
          student_id: student.id,
          student_name: `${student.profiles?.first_name} ${student.profiles?.last_name}`,
          roll_number: student.roll_number || student.student_id,
          status: (existing?.status as AttendanceStatus) || 'present',
          existing_id: existing?.id
        };
      });

      return studentsWithAttendance;
    },
    enabled: !!selectedClass && !!selectedDate
  });

  // Initialize attendance data when students load
  React.useEffect(() => {
    if (classStudents) {
      const initialData: Record<string, StudentAttendance> = {};
      classStudents.forEach(student => {
        initialData[student.student_id] = student;
      });
      setAttendanceData(initialData);
    }
  }, [classStudents]);

  // Save attendance mutation
  const saveAttendanceMutation = useMutation({
    mutationFn: async (attendanceRecords: StudentAttendance[]) => {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      const operations = attendanceRecords.map(async (record) => {
        if (record.existing_id) {
          // Update existing record
          return supabase
            .from('attendance')
            .update({ 
              status: record.status,
              updated_at: new Date().toISOString()
            })
            .eq('id', record.existing_id);
        } else {
          // Insert new record
          return supabase
            .from('attendance')
            .insert({
              student_id: record.student_id,
              class_id: selectedClass,
              date: selectedDate,
              status: record.status,
              marked_by: teacherData.id,
              tenant_id: profile?.school_id
            });
        }
      });

      const results = await Promise.all(operations);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to save some attendance records: ${errors.map(e => e.error?.message).join(', ')}`);
      }

      return results;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Attendance saved successfully" });
      queryClient.invalidateQueries({ queryKey: ['class-students-attendance'] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save attendance", 
        variant: "destructive" 
      });
    }
  });

  const updateAttendanceStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleSaveAttendance = () => {
    const records = Object.values(attendanceData);
    saveAttendanceMutation.mutate(records);
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'bg-green-500 hover:bg-green-600';
      case 'absent': return 'bg-red-500 hover:bg-red-600';
      case 'late': return 'bg-yellow-500 hover:bg-yellow-600';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return <Check className="h-4 w-4" />;
      case 'absent': return <X className="h-4 w-4" />;
      case 'late': return <Clock className="h-4 w-4" />;
    }
  };

  const attendanceStats = React.useMemo(() => {
    if (!classStudents) return { present: 0, absent: 0, late: 0, total: 0 };
    
    const stats = Object.values(attendanceData).reduce(
      (acc, student) => {
        acc[student.status]++;
        acc.total++;
        return acc;
      },
      { present: 0, absent: 0, late: 0, total: 0 }
    );
    
    return stats;
  }, [attendanceData, classStudents]);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">Take Attendance</h2>
          <p className="text-muted-foreground">Mark attendance for your classes</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {assignedClasses?.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - Grade {cls.grade_level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          />
        </div>
      </div>

      {selectedClass && (
        <>
          {/* Attendance Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendanceStats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present</CardTitle>
                <Check className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
                <p className="text-xs text-muted-foreground">
                  {attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                <X className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
                <p className="text-xs text-muted-foreground">
                  {attendanceStats.total > 0 ? Math.round((attendanceStats.absent / attendanceStats.total) * 100) : 0}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Late</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
                <p className="text-xs text-muted-foreground">
                  {attendanceStats.total > 0 ? Math.round((attendanceStats.late / attendanceStats.total) * 100) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Students List */}
          {studentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p>Loading students...</p>
              </div>
            </div>
          ) : classStudents && classStudents.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Student Attendance - {new Date(selectedDate).toLocaleDateString()}</span>
                  <Button 
                    onClick={handleSaveAttendance}
                    disabled={saveAttendanceMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saveAttendanceMutation.isPending ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.values(attendanceData).map((student) => (
                    <div key={student.student_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{student.student_name}</p>
                          <p className="text-sm text-muted-foreground">Roll: {student.roll_number}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={student.status === 'present' ? 'default' : 'outline'}
                          onClick={() => updateAttendanceStatus(student.student_id, 'present')}
                          className={student.status === 'present' ? getStatusColor('present') : ''}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Present
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={student.status === 'late' ? 'default' : 'outline'}
                          onClick={() => updateAttendanceStatus(student.student_id, 'late')}
                          className={student.status === 'late' ? getStatusColor('late') : ''}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Late
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={student.status === 'absent' ? 'default' : 'outline'}
                          onClick={() => updateAttendanceStatus(student.student_id, 'absent')}
                          className={student.status === 'absent' ? getStatusColor('absent') : ''}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Absent
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
                <p className="text-muted-foreground">
                  No students are enrolled in this class.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedClass && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Class</h3>
            <p className="text-muted-foreground">
              Choose a class from the dropdown above to take attendance.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherAttendanceView;