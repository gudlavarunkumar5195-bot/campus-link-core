import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Award, BookOpen, Calendar } from 'lucide-react';

const StudentGradesView = () => {
  const { profile } = useAuth();

  // Fetch student record and grades
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student-grades', profile?.id],
    queryFn: async () => {
      // First get student record
      const { data: studentRecord, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          student_id,
          class_id,
          classes (
            name,
            grade_level,
            academic_year
          )
        `)
        .eq('profile_id', profile?.id)
        .single();

      if (studentError) throw studentError;

      // Then get grades
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select(`
          id,
          score,
          max_score,
          grade,
          assessment_type,
          assessment_name,
          date,
          comments,
          subjects (name, code),
          teachers (
            profile_id,
            profiles (first_name, last_name)
          )
        `)
        .eq('student_id', studentRecord.id)
        .order('date', { ascending: false });

      if (gradesError) throw gradesError;

      // Get attendance data
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('student_id', studentRecord.id)
        .gte('date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;

      return {
        student: studentRecord,
        grades: grades || [],
        attendance: attendance || []
      };
    },
    enabled: !!profile?.id
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!studentData) return null;

    const { grades, attendance } = studentData;
    
    const totalGrades = grades.length;
    const avgScore = grades.length > 0 
      ? grades.reduce((sum, g) => sum + (g.score || 0) / (g.max_score || 100) * 100, 0) / grades.length 
      : 0;
    
    const attendanceRate = attendance.length > 0 
      ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 
      : 0;

    // Subject performance
    const subjectPerformance = grades.reduce((acc, grade) => {
      const subject = grade.subjects?.name || 'Unknown';
      if (!acc[subject]) {
        acc[subject] = { total: 0, count: 0, scores: [] };
      }
      const percentage = (grade.score || 0) / (grade.max_score || 100) * 100;
      acc[subject].total += percentage;
      acc[subject].count += 1;
      acc[subject].scores.push(percentage);
      return acc;
    }, {} as Record<string, { total: number; count: number; scores: number[] }>);

    const subjectData = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      average: Math.round(data.total / data.count),
      trend: data.scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, data.scores.length)
    }));

    // Grade distribution
    const gradeDistribution = grades.reduce((acc, grade) => {
      const percentage = (grade.score || 0) / (grade.max_score || 100) * 100;
      let range;
      if (percentage >= 90) range = 'A (90-100%)';
      else if (percentage >= 80) range = 'B (80-89%)';
      else if (percentage >= 70) range = 'C (70-79%)';
      else if (percentage >= 60) range = 'D (60-69%)';
      else range = 'F (Below 60%)';
      
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const distributionData = Object.entries(gradeDistribution).map(([grade, count]) => ({
      grade,
      count,
      percentage: Math.round((count / totalGrades) * 100)
    }));

    return {
      totalGrades,
      averageScore: Math.round(avgScore),
      attendanceRate: Math.round(attendanceRate),
      subjectData,
      distributionData,
      recentGrades: grades.slice(0, 5)
    };
  }, [studentData]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading your grades...</div>;
  }

  if (!studentData) {
    return <div className="text-center py-12">No grade data available.</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Academic Performance - {studentData.student.classes?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats?.averageScore || 0}%</div>
              <p className="text-sm text-muted-foreground">Overall Average</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.attendanceRate || 0}%</div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.totalGrades || 0}</div>
              <p className="text-sm text-muted-foreground">Total Assessments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
          <TabsTrigger value="trends">Performance Trends</TabsTrigger>
          <TabsTrigger value="recent">Recent Grades</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.distributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({grade, percentage}) => `${grade}: ${percentage}%`}
                    >
                      {stats?.distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Overall Performance</span>
                    <span className="text-sm">{stats?.averageScore}%</span>
                  </div>
                  <Progress value={stats?.averageScore} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Attendance</span>
                    <span className="text-sm">{stats?.attendanceRate}%</span>
                  </div>
                  <Progress value={stats?.attendanceRate} className="h-2" />
                </div>

                <div className="pt-4">
                  <h4 className="font-semibold mb-2">Performance Level</h4>
                  <Badge variant={
                    (stats?.averageScore || 0) >= 90 ? 'default' :
                    (stats?.averageScore || 0) >= 80 ? 'secondary' :
                    (stats?.averageScore || 0) >= 70 ? 'outline' : 'destructive'
                  }>
                    {(stats?.averageScore || 0) >= 90 ? 'Excellent' :
                     (stats?.averageScore || 0) >= 80 ? 'Good' :
                     (stats?.averageScore || 0) >= 70 ? 'Satisfactory' : 'Needs Improvement'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stats?.subjectData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="average" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stats?.recentGrades?.reverse().map((grade, index) => ({
                  assessment: `${grade.assessment_type} ${index + 1}`,
                  score: (grade.score || 0) / (grade.max_score || 100) * 100,
                  date: new Date(grade.date).toLocaleDateString()
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="assessment" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentGrades?.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{grade.assessment_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {grade.subjects?.name} • {grade.assessment_type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(grade.date).toLocaleDateString()}
                      </p>
                      {grade.comments && (
                        <p className="text-sm mt-2 italic">{grade.comments}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {grade.score}/{grade.max_score}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((grade.score || 0) / (grade.max_score || 100) * 100)}%
                      </div>
                      <Badge variant={
                        ((grade.score || 0) / (grade.max_score || 100)) >= 0.9 ? 'default' :
                        ((grade.score || 0) / (grade.max_score || 100)) >= 0.8 ? 'secondary' :
                        ((grade.score || 0) / (grade.max_score || 100)) >= 0.7 ? 'outline' : 'destructive'
                      }>
                        {grade.grade || 
                         (((grade.score || 0) / (grade.max_score || 100)) >= 0.9 ? 'A' :
                          ((grade.score || 0) / (grade.max_score || 100)) >= 0.8 ? 'B' :
                          ((grade.score || 0) / (grade.max_score || 100)) >= 0.7 ? 'C' :
                          ((grade.score || 0) / (grade.max_score || 100)) >= 0.6 ? 'D' : 'F')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentGradesView;