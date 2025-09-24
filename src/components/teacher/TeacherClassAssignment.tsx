import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, School, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const TeacherClassAssignment = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAssignment, setNewAssignment] = useState({
    teacher_id: '',
    class_id: '',
    subject_id: '',
    academic_year: new Date().getFullYear().toString(),
    is_class_teacher: false
  });

  // Fetch teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return [];
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          profiles!teachers_profile_id_fkey(first_name, last_name, school_id)
        `)
        .eq('profiles.school_id', profile.school_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.school_id
  });

  // Fetch classes from class_structure
  const { data: classes = [] } = useQuery({
    queryKey: ['class_structure', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return [];
      const { data, error } = await supabase
        .from('class_structure')
        .select('*')
        .eq('school_id', profile.school_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.school_id
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects_offered', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return [];
      const { data, error } = await supabase
        .from('subjects_offered')
        .select('*')
        .eq('school_id', profile.school_id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.school_id
  });

  // Fetch existing assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['teacher_assignments', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return [];
      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .select(`
          *
        `);
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.school_id
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (assignment: typeof newAssignment) => {
      if (!profile?.school_id) throw new Error('No school ID');
      
      const { data, error } = await supabase
        .from('teacher_class_assignments')
        .insert([{
          ...assignment,
          tenant_id: profile.school_id
        }]);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Teacher-class assignment created successfully!' });
      setNewAssignment({
        teacher_id: '',
        class_id: '',
        subject_id: '',
        academic_year: new Date().getFullYear().toString(),
        is_class_teacher: false
      });
      queryClient.invalidateQueries({ queryKey: ['teacher_assignments'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create assignment',
        variant: 'destructive' 
      });
    }
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('teacher_class_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Assignment deleted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['teacher_assignments'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to delete assignment',
        variant: 'destructive' 
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.teacher_id || !newAssignment.class_id) {
      toast({ title: 'Exception', description: 'Please select teacher and class', variant: 'destructive' });
      return;
    }
    createAssignmentMutation.mutate(newAssignment);
  };

  if (profile?.role !== 'admin') {
    return (
      <Card className="form-container border-white/50 shadow-lg">
        <CardContent className="text-center py-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only administrators can manage teacher-class assignments.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Assignment */}
      <Card className="form-container border-white/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <School className="h-5 w-5" />
            Assign Teacher to Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-foreground">Teacher</Label>
              <Select 
                value={newAssignment.teacher_id} 
                onValueChange={(value) => setNewAssignment({...newAssignment, teacher_id: value})}
              >
                <SelectTrigger className="glass-effect">
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.profiles?.first_name} {teacher.profiles?.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Class</Label>
              <Select 
                value={newAssignment.class_id} 
                onValueChange={(value) => setNewAssignment({...newAssignment, class_id: value})}
              >
                <SelectTrigger className="glass-effect">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Subject (Optional)</Label>
              <Select 
                value={newAssignment.subject_id} 
                onValueChange={(value) => setNewAssignment({...newAssignment, subject_id: value})}
              >
                <SelectTrigger className="glass-effect">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent className="glass-dropdown">
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Academic Year</Label>
              <Input
                value={newAssignment.academic_year}
                onChange={(e) => setNewAssignment({...newAssignment, academic_year: e.target.value})}
                placeholder="2024"
                className="glass-effect"
              />
            </div>

            <div className="lg:col-span-4">
              <Button 
                type="submit" 
                disabled={createAssignmentMutation.isPending}
                className="glass-effect"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createAssignmentMutation.isPending ? 'Assigning...' : 'Assign Teacher to Class'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Assignments */}
      <Card className="form-container border-white/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5" />
            Current Teacher-Class Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <School className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No teacher-class assignments found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                // Fetch additional data for display - simplified version
                const teacherId = assignment.teacher_id;
                const teacher = teachers.find(t => t.id === teacherId);
                const classData = classes.find(c => c.id === assignment.class_id);
                const subject = subjects.find(s => s.id === assignment.subject_id);
                
                return (
                  <div key={assignment.id} className="flex items-center justify-between p-4 glass-effect rounded-lg border border-white/20">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {teacher?.profiles?.first_name} {teacher?.profiles?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Class: {classData?.class_name || 'Unknown'}
                          {subject?.name && ` • Subject: ${subject.name}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary" className="glass-effect">
                          {assignment.academic_year}
                        </Badge>
                        {assignment.is_class_teacher && (
                          <Badge variant="default" className="glass-effect">
                            Class Teacher
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                      disabled={deleteAssignmentMutation.isPending}
                      className="glass-effect"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherClassAssignment;
