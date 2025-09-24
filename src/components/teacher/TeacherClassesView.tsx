import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Users, Plus, Calendar, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TeacherClassesView = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClass, setSelectedClass] = useState('');
  const [homeworkDialog, setHomeworkDialog] = useState(false);
  const [announcementDialog, setAnnouncementDialog] = useState(false);

  // Fetch teacher's assigned classes
  const { data: assignedClasses, isLoading } = useQuery({
    queryKey: ['teacher-assigned-classes', profile?.id],
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
          id,
          class_id,
          subject_id,
          is_class_teacher,
          classes!inner (
            id,
            name,
            grade_level,
            academic_year,
            students (id)
          ),
          subjects!inner (
            id,
            name,
            code
          )
        `)
        .eq('teacher_id', teacherData.id);

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id
  });

  // Fetch subjects for homework assignment
  const { data: subjects } = useQuery({
    queryKey: ['school-subjects', profile?.school_id],
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

  // Homework mutation
  const homeworkMutation = useMutation({
    mutationFn: async (homeworkData: any) => {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      const { error } = await supabase
        .from('homework')
        .insert([{
          ...homeworkData,
          teacher_id: teacherData.id,
          tenant_id: profile?.school_id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Homework assigned successfully" });
      setHomeworkDialog(false);
      queryClient.invalidateQueries({ queryKey: ['teacher-homework'] });
    },
    onError: (error) => {
      toast({ title: "Exception", description: "Failed to assign homework", variant: "destructive" });
    }
  });

  // Announcement mutation
  const announcementMutation = useMutation({
    mutationFn: async (announcementData: any) => {
      const { error } = await supabase
        .from('announcements')
        .insert([{
          ...announcementData,
          created_by: profile?.id,
          tenant_id: profile?.school_id
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Announcement posted successfully" });
      setAnnouncementDialog(false);
      queryClient.invalidateQueries({ queryKey: ['teacher-announcements'] });
    },
    onError: (error) => {
      toast({ title: "Exception", description: "Failed to post announcement", variant: "destructive" });
    }
  });

  const handleHomeworkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    homeworkMutation.mutate({
      class_id: formData.get('class_id'),
      subject_id: formData.get('subject_id'),
      title: formData.get('title'),
      description: formData.get('description'),
      due_date: formData.get('due_date')
    });
  };

  const handleAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    announcementMutation.mutate({
      title: formData.get('title'),
      content: formData.get('content'),
      type: formData.get('type'),
      class_id: formData.get('class_id') || null,
      priority: formData.get('priority')
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading your classes...</div>;
  }

  // Group classes by class
  const groupedClasses = assignedClasses?.reduce((acc, assignment) => {
    const classId = assignment.classes?.id;
    if (classId && assignment.classes) {
      if (!acc[classId]) {
        acc[classId] = {
          class: assignment.classes,
          subjects: [],
          isClassTeacher: false
        };
      }
      if (assignment.subjects) {
        acc[classId].subjects.push(assignment.subjects);
      }
      if (assignment.is_class_teacher) {
        acc[classId].isClassTeacher = true;
      }
    }
    return acc;
  }, {} as Record<string, any>) || {};

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">My Classes</h2>
          <p className="text-muted-foreground">Manage your assigned classes and subjects</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={homeworkDialog} onOpenChange={setHomeworkDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Assign Homework
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Assign Homework</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleHomeworkSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="class_id">Class</Label>
                  <Select name="class_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(groupedClasses).map((classData: any) => (
                        <SelectItem key={classData.class.id} value={classData.class.id}>
                          {classData.class.name} - Grade {classData.class.grade_level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject_id">Subject</Label>
                  <Select name="subject_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input name="title" placeholder="Homework title" required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea name="description" placeholder="Homework instructions" />
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input name="due_date" type="date" required />
                </div>
                <Button type="submit" className="w-full" disabled={homeworkMutation.isPending}>
                  {homeworkMutation.isPending ? 'Assigning...' : 'Assign Homework'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={announcementDialog} onOpenChange={setAnnouncementDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Megaphone className="h-4 w-4 mr-2" />
                Make Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAnnouncementSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input name="title" placeholder="Announcement title" required />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea name="content" placeholder="Announcement content" required />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue="class">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class">Class Announcement</SelectItem>
                      <SelectItem value="general">General Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="class_id">Class (Optional for class announcements)</Label>
                  <Select name="class_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(groupedClasses).map((classData: any) => (
                        <SelectItem key={classData.class.id} value={classData.class.id}>
                          {classData.class.name} - Grade {classData.class.grade_level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="normal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={announcementMutation.isPending}>
                  {announcementMutation.isPending ? 'Posting...' : 'Post Announcement'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(groupedClasses).map((classData: any) => (
          <Card key={classData.class.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>{classData.class.name}</span>
                </div>
                {classData.isClassTeacher && (
                  <Badge variant="secondary">Class Teacher</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Grade Level</p>
                  <p className="font-semibold">{classData.class.grade_level}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Academic Year</p>
                  <p className="font-semibold">{classData.class.academic_year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Students</p>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="font-semibold">{classData.class.students?.length || 0}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subjects Teaching</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {classData.subjects.map((subject: any) => (
                      <Badge key={subject.id} variant="outline" className="text-xs">
                        {subject.code}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {Object.keys(groupedClasses).length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Classes Assigned</h3>
            <p className="text-muted-foreground">
              You haven't been assigned to any classes yet. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeacherClassesView;