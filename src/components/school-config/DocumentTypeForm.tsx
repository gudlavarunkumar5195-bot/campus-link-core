
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DocumentType {
  id: string;
  name: string;
  description: string;
  is_required: boolean;
}

interface DocumentTypeFormProps {
  documentType?: DocumentType | null;
  onClose: () => void;
  schoolId: string;
}

const DocumentTypeForm: React.FC<DocumentTypeFormProps> = ({ documentType, onClose, schoolId }) => {
  const [formData, setFormData] = useState({
    name: documentType?.name || '',
    description: documentType?.description || '',
    is_required: documentType?.is_required || false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('document_types')
        .insert([{
          ...data,
          school_id: schoolId,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      toast({
        title: 'Success',
        description: 'Document type created successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Exception',
        description: error.message || 'Failed to create document type',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('document_types')
        .update(data)
        .eq('id', documentType?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      toast({
        title: 'Success',
        description: 'Document type updated successfully',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Exception',
        description: error.message || 'Failed to update document type',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (documentType) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Document Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_required"
          checked={formData.is_required}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
        />
        <Label htmlFor="is_required">Required Document</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {documentType ? 'Update' : 'Create'} Document Type
        </Button>
      </div>
    </form>
  );
};

export default DocumentTypeForm;
