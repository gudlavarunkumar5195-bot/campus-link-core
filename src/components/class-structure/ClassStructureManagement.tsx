
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ClassStructure {
  id: string;
  class_name: string;
  sections: string[];
  academic_year_id: string;
  school_id: string;
}

interface AcademicYear {
  id: string;
  name: string;
  is_active: boolean;
}

interface Profile {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

const ClassStructureManagement: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassStructure | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [formData, setFormData] = useState({
    class_name: '',
    sections: [''],
    academic_year_id: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as AcademicYear[];
    },
    enabled: !!profile?.school_id,
  });

  const { data: classStructures } = useQuery({
    queryKey: ['class-structures', profile?.school_id, selectedAcademicYear],
    queryFn: async () => {
      if (!profile?.school_id || !selectedAcademicYear) return [];
      
      const { data, error } = await supabase
        .from('class_structure')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('academic_year_id', selectedAcademicYear)
        .order('class_name');
      
      if (error) throw error;
      return data as ClassStructure[];
    },
    enabled: !!profile?.school_id && !!selectedAcademicYear,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!profile?.school_id) throw new Error('School ID not found');
      
      const { error } = await supabase
        .from('class_structure')
        .insert([{
          ...data,
          school_id: profile.school_id,
          sections: data.sections.filter(s => s.trim() !== ''),
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-structures'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Class structure created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      class_name: '',
      sections: [''],
      academic_year_id: '',
    });
    setEditingClass(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [...formData.sections, ''],
    });
  };

  const updateSection = (index: number, value: string) => {
    const newSections = [...formData.sections];
    newSections[index] = value;
    setFormData({
      ...formData,
      sections: newSections,
    });
  };

  const removeSection = (index: number) => {
    const newSections = formData.sections.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      sections: newSections,
    });
  };

  // Set the first academic year as selected by default
  React.useEffect(() => {
    if (academicYears && academicYears.length > 0 && !selectedAcademicYear) {
      const activeYear = academicYears.find(year => year.is_active) || academicYears[0];
      setSelectedAcademicYear(activeYear.id);
    }
  }, [academicYears, selectedAcademicYear]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Class Structure</h1>
        <div className="flex gap-4">
          <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Academic Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears?.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name} {year.is_active && '(Active)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Class Structure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Class Structure</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="class_name">Class Name</Label>
                  <Input
                    id="class_name"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    placeholder="e.g., Grade 1, Class 10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="academic_year_id">Academic Year</Label>
                  <Select
                    value={formData.academic_year_id}
                    onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Academic Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears?.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sections</Label>
                  {formData.sections.map((section, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <Input
                        value={section}
                        onChange={(e) => updateSection(index, e.target.value)}
                        placeholder="e.g., A, B, C"
                      />
                      {formData.sections.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSection(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addSection}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Section
                  </Button>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    Create
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {selectedAcademicYear && (
        <div className="grid gap-4">
          {classStructures?.map((classStructure) => (
            <Card key={classStructure.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {classStructure.class_name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {classStructure.sections.map((section, index) => (
                    <Badge key={index} variant="secondary">
                      Section {section}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassStructureManagement;
