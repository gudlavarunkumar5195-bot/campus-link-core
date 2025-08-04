
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CustomField {
  id: string;
  module: 'student' | 'teacher' | 'fee' | 'document';
  label: string;
  field_type: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
  options: string[];
  is_required: boolean;
}

interface CustomFieldFormProps {
  field?: CustomField | null;
  onClose: () => void;
  schoolId: string;
}

const CustomFieldForm: React.FC<CustomFieldFormProps> = ({ field, onClose, schoolId }) => {
  const [formData, setFormData] = useState({
    module: field?.module || 'student' as 'student' | 'teacher' | 'fee' | 'document',
    label: field?.label || '',
    field_type: field?.field_type || 'text' as 'text' | 'number' | 'dropdown' | 'checkbox' | 'date',
    options: field?.options || [],
    is_required: field?.is_required || false,
  });
  const [newOption, setNewOption] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('custom_fields')
        .insert([{
          ...data,
          school_id: schoolId,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      toast({
        title: 'Success',
        description: 'Custom field created successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create custom field',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('custom_fields')
        .update(data)
        .eq('id', field?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      toast({
        title: 'Success',
        description: 'Custom field updated successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update custom field',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (field) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const addOption = () => {
    if (newOption.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="module">Module</Label>
        <Select
          value={formData.module}
          onValueChange={(value: 'student' | 'teacher' | 'fee' | 'document') =>
            setFormData(prev => ({ ...prev, module: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="fee">Fee</SelectItem>
            <SelectItem value="document">Document</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="label">Field Label</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="field_type">Field Type</Label>
        <Select
          value={formData.field_type}
          onValueChange={(value: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date') =>
            setFormData(prev => ({ ...prev, field_type: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="dropdown">Dropdown</SelectItem>
            <SelectItem value="checkbox">Checkbox</SelectItem>
            <SelectItem value="date">Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.field_type === 'dropdown' && (
        <div>
          <Label>Options</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Add option"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
            />
            <Button type="button" onClick={addOption}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {formData.options.map((option, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {option}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeOption(index)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="is_required"
          checked={formData.is_required}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
        />
        <Label htmlFor="is_required">Required Field</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {field ? 'Update' : 'Create'} Field
        </Button>
      </div>
    </form>
  );
};

export default CustomFieldForm;
