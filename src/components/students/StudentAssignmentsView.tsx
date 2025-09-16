import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Calendar, CheckCircle, Clock, AlertCircle, Upload } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';

const StudentAssignmentsView = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: ['student-assignments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      // Get student record
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, class_id, classes(id, name)')
        .eq('profile_id', profile.id)
        .single();

      if (studentError) throw studentError;

      // Get assignments for student's class
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          due_date,
          max_points,
          created_at,
          subjects (name, code),
          teachers (
            id,
            profiles (first_name, last_name)
          )
        `)
        .eq('class_id', student.class_id)
        .order('due_date', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Get submissions for these assignments
      const { data: submissions, error: submissionsError } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          assignment_id,
          submission_text,
          file_url,
          submitted_at,
          grade,
          feedback,
          graded_at
        `)
        .eq('student_id', student.id);

      if (submissionsError) throw submissionsError;

      // Combine assignments with submission status
      const assignmentsWithSubmissions = assignments?.map(assignment => {
        const submission = submissions?.find(s => s.assignment_id === assignment.id);
        const now = new Date();
        const dueDate = new Date(assignment.due_date);
        
        let status = 'pending';
        if (submission) {
          if (submission.grade !== null) {
            status = 'graded';
          } else {
            status = 'submitted';
          }
        } else if (isAfter(now, dueDate)) {
          status = 'overdue';
        }

        return {
          ...assignment,
          submission,
          status
        };
      }) || [];

      return {
        student,
        assignments: assignmentsWithSubmissions
      };
    },
    enabled: !!profile?.id
  });

  // Submit assignment mutation
  const submitAssignmentMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; submissionText: string }) => {
      if (!assignmentsData?.student?.id) throw new Error('Student not found');

      const { error } = await supabase
        .from('assignment_submissions')
        .insert({
          assignment_id: data.assignmentId,
          student_id: assignmentsData.student.id,
          submission_text: data.submissionText,
          submitted_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ description: 'Assignment submitted successfully!' });
      queryClient.invalidateQueries({ queryKey: ['student-assignments'] });
      setSubmitDialogOpen(false);
      setSubmissionText('');
    },
    onError: (error: any) => {
      toast({ 
        variant: 'destructive', 
        description: error.message || 'Failed to submit assignment' 
      });
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading assignments...</div>;
  }

  if (!assignmentsData) {
    return <div className="text-center py-12">No assignments available.</div>;
  }

  const { student, assignments } = assignmentsData;

  // Filter assignments by status
  const pendingAssignments = assignments.filter(a => a.status === 'pending');
  const submittedAssignments = assignments.filter(a => a.status === 'submitted');
  const gradedAssignments = assignments.filter(a => a.status === 'graded');
  const overdueAssignments = assignments.filter(a => a.status === 'overdue');

  const getStatusBadge = (status: string, dueDate: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      submitted: { variant: 'default' as const, icon: CheckCircle, color: 'text-blue-600' },
      graded: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      overdue: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' }
    };
    
    const config = variants[status as keyof typeof variants];
    const Icon = config?.icon || Clock;
    
    return (
      <Badge variant={config?.variant || 'outline'}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'overdue' ? 'Overdue' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleSubmitAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setSubmitDialogOpen(true);
  };

  const confirmSubmission = () => {
    if (!selectedAssignment || !submissionText.trim()) return;

    submitAssignmentMutation.mutate({
      assignmentId: selectedAssignment.id,
      submissionText: submissionText.trim()
    });
  };

  const AssignmentCard = ({ assignment }: { assignment: any }) => {
    const dueDate = new Date(assignment.due_date);
    const isOverdue = isAfter(new Date(), dueDate);
    
    return (
      <Card className={`${isOverdue && assignment.status === 'pending' ? 'border-destructive' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{assignment.title}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{assignment.subjects?.name}</Badge>
                {getStatusBadge(assignment.status, assignment.due_date)}
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-right">
              <div>Due: {format(dueDate, 'MMM dd, yyyy')}</div>
              <div>{format(dueDate, 'hh:mm a')}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{assignment.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Max Points:</span> {assignment.max_points}
              <span className="mx-2">•</span>
              <span className="font-medium">Teacher:</span> {assignment.teachers?.profiles?.first_name} {assignment.teachers?.profiles?.last_name}
            </div>
            
            {assignment.status === 'pending' && (
              <Button 
                onClick={() => handleSubmitAssignment(assignment)}
                className="ml-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                Submit
              </Button>
            )}
          </div>

          {assignment.submission && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">Your Submission</span>
                <span className="text-xs text-muted-foreground">
                  Submitted: {format(new Date(assignment.submission.submitted_at), 'MMM dd, yyyy hh:mm a')}
                </span>
              </div>
              <p className="text-sm mb-2">{assignment.submission.submission_text}</p>
              
              {assignment.submission.grade !== null && (
                <div className="border-t pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Grade: {assignment.submission.grade}/{assignment.max_points}</span>
                    <span className="text-xs text-muted-foreground">
                      Graded: {format(new Date(assignment.submission.graded_at), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {assignment.submission.feedback && (
                    <div className="mt-2">
                      <span className="font-medium text-sm">Feedback:</span>
                      <p className="text-sm text-muted-foreground mt-1">{assignment.submission.feedback}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            My Assignments - {student.classes?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingAssignments.length}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{submittedAssignments.length}</div>
              <p className="text-sm text-muted-foreground">Submitted</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{gradedAssignments.length}</div>
              <p className="text-sm text-muted-foreground">Graded</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overdueAssignments.length}</div>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submittedAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="graded">
            Graded ({gradedAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({overdueAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingAssignments.length > 0 ? (
            pendingAssignments.map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending assignments.
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {submittedAssignments.length > 0 ? (
            submittedAssignments.map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No submitted assignments waiting for grading.
            </div>
          )}
        </TabsContent>

        <TabsContent value="graded" className="space-y-4">
          {gradedAssignments.length > 0 ? (
            gradedAssignments.map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No graded assignments yet.
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdueAssignments.length > 0 ? (
            overdueAssignments.map(assignment => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No overdue assignments.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Assignment Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Assignment: {selectedAssignment?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">Assignment Details</h4>
              <p className="text-sm text-muted-foreground mb-2">{selectedAssignment?.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span>Due: {selectedAssignment && format(new Date(selectedAssignment.due_date), 'MMM dd, yyyy hh:mm a')}</span>
                <span>Max Points: {selectedAssignment?.max_points}</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Your Submission</label>
              <Textarea
                placeholder="Enter your assignment submission here..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setSubmitDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmSubmission}
                disabled={!submissionText.trim() || submitAssignmentMutation.isPending}
              >
                {submitAssignmentMutation.isPending ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentAssignmentsView;