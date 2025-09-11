import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface GradeAnalyticsProps {
  classId: string;
}

const GradeAnalytics: React.FC<GradeAnalyticsProps> = ({ classId }) => {
  const { profile } = useAuth();

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['grade-analytics', classId, profile?.school_id],
    queryFn: async () => {
      let query = supabase
        .from('grades')
        .select(`
          id,
          score,
          max_score,
          assessment_type,
          date,
          subject_id,
          students (
            id,
            profiles (first_name, last_name)
          ),
          subjects (name)
        `)
        .not('score', 'is', null);

      // Filter by class if selected
      if (classId) {
        const { data: classStudents } = await supabase
          .from('students')
          .select('id')
          .eq('class_id', classId);
        
        const studentIds = classStudents?.map(s => s.id) || [];
        if (studentIds.length > 0) {
          query = query.in('student_id', studentIds);
        }
      } else {
        // Filter by school
        const { data: schoolStudents } = await supabase
          .from('students')
          .select(`
            id,
            profiles!inner (school_id)
          `)
          .eq('profiles.school_id', profile?.school_id);
        
        const studentIds = schoolStudents?.map(s => s.id) || [];
        if (studentIds.length > 0) {
          query = query.in('student_id', studentIds);
        }
      }

      const { data: grades, error } = await query;
      if (error) throw error;

      // Process data for analytics
      const subjectPerformance = grades?.reduce((acc, grade) => {
        const subject = grade.subjects?.name || 'Unknown';
        if (!acc[subject]) {
          acc[subject] = { scores: [], total: 0, count: 0 };
        }
        const percentage = (grade.score || 0) / (grade.max_score || 100) * 100;
        acc[subject].scores.push(percentage);
        acc[subject].total += percentage;
        acc[subject].count += 1;
        return acc;
      }, {} as Record<string, { scores: number[]; total: number; count: number }>);

      const subjectData = Object.entries(subjectPerformance || {}).map(([subject, data]) => ({
        subject,
        average: Math.round(data.total / data.count),
        highest: Math.max(...data.scores),
        lowest: Math.min(...data.scores),
        count: data.count
      }));

      // Grade distribution
      const gradeDistribution = grades?.reduce((acc, grade) => {
        const percentage = (grade.score || 0) / (grade.max_score || 100) * 100;
        let range;
        if (percentage >= 90) range = 'A';
        else if (percentage >= 80) range = 'B';
        else if (percentage >= 70) range = 'C';
        else if (percentage >= 60) range = 'D';
        else range = 'F';
        
        acc[range] = (acc[range] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const distributionData = Object.entries(gradeDistribution || {}).map(([grade, count]) => ({
        grade,
        count,
        percentage: Math.round((count / (grades?.length || 1)) * 100)
      }));

      // Assessment type performance
      const assessmentTypes = grades?.reduce((acc, grade) => {
        const type = grade.assessment_type || 'Unknown';
        if (!acc[type]) {
          acc[type] = { total: 0, count: 0 };
        }
        const percentage = (grade.score || 0) / (grade.max_score || 100) * 100;
        acc[type].total += percentage;
        acc[type].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const assessmentData = Object.entries(assessmentTypes || {}).map(([type, data]) => ({
        type,
        average: Math.round(data.total / data.count),
        count: data.count
      }));

      // Monthly trend
      const monthlyData = grades?.reduce((acc, grade) => {
        const month = new Date(grade.date).toLocaleDateString('en', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = { total: 0, count: 0 };
        }
        const percentage = (grade.score || 0) / (grade.max_score || 100) * 100;
        acc[month].total += percentage;
        acc[month].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const trendData = Object.entries(monthlyData || {}).map(([month, data]) => ({
        month,
        average: Math.round(data.total / data.count)
      })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

      return {
        subjectData,
        distributionData,
        assessmentData,
        trendData,
        totalGrades: grades?.length || 0,
        overallAverage: grades?.length ? Math.round(
          grades.reduce((sum, g) => sum + (g.score || 0) / (g.max_score || 100) * 100, 0) / grades.length
        ) : 0
      };
    },
    enabled: !!profile?.school_id
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">Loading analytics...</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.subjectData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="average" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analyticsData?.distributionData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({grade, percentage}) => `${grade}: ${percentage}%`}
              >
                {analyticsData?.distributionData?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Assessment Type Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Type Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.assessmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="average" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData?.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="average" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{analyticsData?.totalGrades}</div>
              <p className="text-sm text-muted-foreground">Total Grades</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{analyticsData?.overallAverage}%</div>
              <p className="text-sm text-muted-foreground">Overall Average</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{analyticsData?.subjectData?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Subjects</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{analyticsData?.assessmentData?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Assessment Types</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeAnalytics;