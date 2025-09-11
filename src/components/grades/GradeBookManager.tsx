import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface GradeBookManagerProps {
  classId: string;
}

const GradeBookManager: React.FC<GradeBookManagerProps> = ({ classId }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);

  // Fetch students and their grades
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['gradebook-students', classId],
    queryFn: async () => {
      let studentsQuery = supabase
        .from('students')
        .select(`
          id,
          student_id,
          profiles (first_name, last_name),
          grades (
            id,
            score,
            max_score,
            assessment_type,
            assessment_name,
            date,
            comments,
            subjects (name)
          )
        `);

      if (classId) {
        studentsQuery = studentsQuery.eq('class_id', classId);
      } else {
        // Get all students from teacher's school
        studentsQuery = studentsQuery.eq('profiles.school_id', profile?.school_id);
      }

      const { data: students, error } = await studentsQuery;
      if (error) throw error;

      return students;
    },
    enabled: !!profile?.school_id
  });

  // Fetch subjects for the school
  const { data: subjects } = useQuery({
    queryKey: ['subjects', profile?.school_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, code')
        .eq('school_id', profile?.school_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id
  });

  // Add/Update grade mutation
  const addGradeMutation = useMutation({
    mutationFn: async (gradeData: {
      student_id: string;
      subject_id: string;
      score: number;
      max_score: number;
      assessment_type: string;
      assessment_name: string;
      date: string;
      comments?: string;
    }) => {
      const { data, error } = await supabase
        .from('grades')
        .insert([{
          ...gradeData,
          teacher_id: profile?.id,
          tenant_id: null // Set based on your tenant logic
        }])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ description: 'Grade added successfully' });
      queryClient.invalidateQueries({ queryKey: ['gradebook-students'] });
      setGradeDialogOpen(false);
    },
    onError: (error) => {
      toast({ variant: 'destructive', description: error.message });
    }
  });

  const handleAddGrade = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    addGradeMutation.mutate({
      student_id: formData.get('student_id') as string,
      subject_id: formData.get('subject_id') as string,
      score: Number(formData.get('score')),
      max_score: Number(formData.get('max_score')) || 100,
      assessment_type: formData.get('assessment_type') as string,
      assessment_name: formData.get('assessment_name') as string,
      date: formData.get('date') as string,
      comments: formData.get('comments') as string || undefined
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading gradebook...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Grade Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Grade Book</h3>
        <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Grade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddGrade} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Student</label>
                <Select name="student_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentsData?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.profiles?.first_name} {student.profiles?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <Select name="subject_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Score</label>
                  <Input 
                    name="score" 
                    type="number" 
                    min="0" 
                    step="0.1"
                    required 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Score</label>
                  <Input 
                    name="max_score" 
                    type="number" 
                    min="1" 
                    defaultValue="100"
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Assessment Type</label>
                <Select name="assessment_type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Assessment Name</label>
                <Input name="assessment_name" placeholder="e.g., Chapter 1 Quiz" required />
              </div>

              <div>
                <label className="text-sm font-medium">Date</label>
                <Input 
                  name="date" 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>

              <div>
                <label className="text-sm font-medium">Comments (Optional)</label>
                <Textarea 
                  name="comments" 
                  placeholder="Additional feedback..."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={addGradeMutation.isPending}>
                {addGradeMutation.isPending ? 'Adding Grade...' : 'Add Grade'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Students and Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Grades Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentsData?.map((student) => {
              const avgGrade = student.grades?.length > 0 
                ? Math.round(
                    student.grades.reduce((sum, g) => sum + (g.score || 0) / (g.max_score || 100) * 100, 0) / student.grades.length
                  )
                : 0;

              return (
                <Card key={student.id} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">
                        {student.profiles?.first_name} {student.profiles?.last_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{avgGrade}%</div>
                      <Badge variant={
                        avgGrade >= 90 ? 'default' :
                        avgGrade >= 80 ? 'secondary' :
                        avgGrade >= 70 ? 'outline' : 'destructive'
                      }>
                        {avgGrade >= 90 ? 'Excellent' :
                         avgGrade >= 80 ? 'Good' :
                         avgGrade >= 70 ? 'Satisfactory' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>

                  {student.grades && student.grades.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.grades.slice(0, 5).map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{grade.assessment_name}</div>
                                <div className="text-sm text-muted-foreground">{grade.assessment_type}</div>
                              </div>
                            </TableCell>
                            <TableCell>{grade.subjects?.name}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {grade.score}/{grade.max_score}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {Math.round((grade.score || 0) / (grade.max_score || 100) * 100)}%
                              </div>
                            </TableCell>
                            <TableCell>{new Date(grade.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No grades recorded for this student
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeBookManager;