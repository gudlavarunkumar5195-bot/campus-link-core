import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Phone, Mail, MapPin } from 'lucide-react';

const TeacherStudentsView = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');

  // Fetch students from teacher's assigned classes
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['teacher-students', profile?.id],
    queryFn: async () => {
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (teacherError) throw teacherError;

      // Get teacher's assigned classes
      const { data: assignments, error: assignmentsError } = await supabase
        .from('teacher_class_assignments')
        .select('class_id')
        .eq('teacher_id', teacherData.id);

      if (assignmentsError) throw assignmentsError;

      const classIds = assignments.map(a => a.class_id);

      // Get students from these classes
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          roll_number,
          section,
          parent_name,
          parent_phone,
          parent_email,
          profiles (
            first_name,
            last_name,
            email,
            phone,
            date_of_birth,
            address,
            blood_group
          ),
          classes (
            id,
            name,
            grade_level,
            academic_year
          )
        `)
        .in('class_id', classIds);

      if (studentsError) throw studentsError;

      // Get classes for filter dropdown
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, grade_level')
        .in('id', classIds);

      if (classesError) throw classesError;

      return { students: students || [], classes: classes || [] };
    },
    enabled: !!profile?.id
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading students...</div>;
  }

  const students = studentData?.students || [];
  const classes = studentData?.classes || [];

  // Filter students based on search and class selection
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = selectedClass === 'all' || student.classes?.id === selectedClass;

    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold">My Students</h2>
          <p className="text-muted-foreground">View students from your assigned classes</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - Grade {cls.grade_level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStudents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <Badge variant="outline">{classes.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Badge variant="secondary">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredStudents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg">
                  {student.profiles?.first_name} {student.profiles?.last_name}
                </span>
                <Badge variant="outline">
                  {student.classes?.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Student ID</p>
                    <p className="font-medium">{student.student_id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Roll Number</p>
                    <p className="font-medium">{student.roll_number || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Class</p>
                    <p className="font-medium">Grade {student.classes?.grade_level}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Section</p>
                    <p className="font-medium">{student.section || 'N/A'}</p>
                  </div>
                </div>

                {student.profiles?.date_of_birth && (
                  <div>
                    <p className="text-muted-foreground text-sm">Date of Birth</p>
                    <p className="font-medium text-sm">
                      {new Date(student.profiles.date_of_birth).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {student.profiles?.blood_group && (
                  <div>
                    <p className="text-muted-foreground text-sm">Blood Group</p>
                    <Badge variant="secondary" className="text-xs">
                      {student.profiles.blood_group}
                    </Badge>
                  </div>
                )}

                {/* Parent/Guardian Information */}
                {student.parent_name && (
                  <div className="border-t pt-3">
                    <p className="text-muted-foreground text-sm mb-2">Parent/Guardian</p>
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{student.parent_name}</p>
                      {student.parent_phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{student.parent_phone}</span>
                        </div>
                      )}
                      {student.parent_email && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span>{student.parent_email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div className="space-y-1">
                  {student.profiles?.phone && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{student.profiles.phone}</span>
                    </div>
                  )}
                  {student.profiles?.email && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{student.profiles.email}</span>
                    </div>
                  )}
                  {student.profiles?.address && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{student.profiles.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedClass !== 'all' 
                ? 'No students match your current filters.' 
                : 'No students are assigned to your classes yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherStudentsView;