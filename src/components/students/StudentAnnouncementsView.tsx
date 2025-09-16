import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Megaphone, BookOpen, Home, Calendar, Bell, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const StudentAnnouncementsView = () => {
  // Mock data - replace with real data fetching
  const announcements = [
    {
      id: 1,
      type: 'general',
      title: 'Parent-Teacher Conference',
      message: 'Parent-teacher conferences will be held next week. Please check with your class teacher for your scheduled time.',
      date: '2024-01-15',
      priority: 'high',
      author: 'Principal Office'
    },
    {
      id: 2,
      type: 'academic',
      title: 'Mid-term Examination Schedule',
      message: 'Mid-term examinations will commence from February 1st, 2024. Please prepare accordingly.',
      date: '2024-01-14',
      priority: 'medium',
      author: 'Academic Department'
    }
  ];

  const classWork = [
    {
      id: 1,
      subject: 'Mathematics',
      topic: 'Quadratic Equations',
      description: 'Today we learned about solving quadratic equations using the quadratic formula and factoring methods.',
      date: '2024-01-15',
      materials: ['Textbook Chapter 5', 'Practice worksheet']
    },
    {
      id: 2,
      subject: 'Science',
      topic: 'Photosynthesis',
      description: 'We studied the process of photosynthesis and conducted a lab experiment to observe oxygen production in aquatic plants.',
      date: '2024-01-15',
      materials: ['Lab manual pages 45-48', 'Video: Plant Life Processes']
    }
  ];

  const homeWork = [
    {
      id: 1,
      subject: 'Mathematics',
      task: 'Complete exercises 1-10 from Chapter 5',
      dueDate: '2024-01-17',
      instructions: 'Show all working steps and verify your answers.',
      priority: 'medium'
    },
    {
      id: 2,
      subject: 'English',
      task: 'Write a short essay on "Environmental Conservation"',
      dueDate: '2024-01-18',
      instructions: 'Minimum 300 words. Include at least 3 references.',
      priority: 'high'
    },
    {
      id: 3,
      subject: 'Science',
      task: 'Draw and label the parts of a leaf',
      dueDate: '2024-01-16',
      instructions: 'Use colored pencils and refer to page 52 of the textbook.',
      priority: 'low'
    }
  ];

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: { variant: 'destructive' as const, color: 'text-red-600' },
      medium: { variant: 'secondary' as const, color: 'text-yellow-600' },
      low: { variant: 'outline' as const, color: 'text-green-600' }
    };
    const config = variants[priority as keyof typeof variants];
    return (
      <Badge variant={config?.variant || 'outline'}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      general: Bell,
      academic: BookOpen,
      urgent: AlertCircle
    };
    const Icon = icons[type as keyof typeof icons] || Bell;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Announcements & Daily Updates
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              School Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(announcement.type)}
                      <h4 className="font-semibold">{announcement.title}</h4>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getPriorityBadge(announcement.priority)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(announcement.date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{announcement.message}</p>
                  <div className="text-xs text-muted-foreground">
                    From: {announcement.author}
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No announcements at the moment.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Homework */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Homework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {homeWork.map((hw) => (
                <div key={hw.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{hw.subject}</Badge>
                        {getPriorityBadge(hw.priority)}
                      </div>
                      <h4 className="font-semibold">{hw.task}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary">
                        Due: {format(new Date(hw.dueDate), 'MMM dd')}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{hw.instructions}</p>
                </div>
              ))}
              {homeWork.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No homework assigned.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Class Work */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Today's Class Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {classWork.map((work, index) => (
              <div key={work.id}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default">{work.subject}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(work.date), 'EEEE, MMM dd')}
                      </span>
                    </div>
                    <h4 className="font-semibold text-lg mb-2">{work.topic}</h4>
                    <p className="text-muted-foreground mb-3">{work.description}</p>
                    
                    <div>
                      <h5 className="font-medium mb-2">Materials Covered:</h5>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {work.materials.map((material, idx) => (
                          <li key={idx}>{material}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                {index < classWork.length - 1 && <Separator className="my-6" />}
              </div>
            ))}
            {classWork.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No class work recorded for today.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-semibold">Sports Day Rehearsal</h4>
                <p className="text-sm text-muted-foreground">Practice for annual sports day events</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Jan 20</div>
                <div className="text-xs text-muted-foreground">9:00 AM</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-semibold">Science Exhibition</h4>
                <p className="text-sm text-muted-foreground">Annual science project exhibition</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Jan 25</div>
                <div className="text-xs text-muted-foreground">10:00 AM</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-semibold">Republic Day Celebration</h4>
                <p className="text-sm text-muted-foreground">National festival celebration</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">Jan 26</div>
                <div className="text-xs text-muted-foreground">8:00 AM</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentAnnouncementsView;