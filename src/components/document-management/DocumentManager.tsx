import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Plus, Edit, Trash2, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface DocumentType {
  id: string;
  name: string;
  description?: string;
  is_required: boolean;
  school_id: string;
  created_at: string;
}

const DocumentManager = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_required: false
  });

  // Fetch document types
  const { data: documentTypes, isLoading } = useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DocumentType[];
    },
  });

  // Create document type mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (newDoc: typeof formData) => {
      const { error } = await supabase
        .from('document_types')
        .insert({
          ...newDoc,
          school_id: profile?.school_id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Document Type Created',
        description: 'New document type has been added successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create document type: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update document type mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (updatedDoc: typeof formData & { id: string }) => {
      const { id, ...data } = updatedDoc;
      const { error } = await supabase
        .from('document_types')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Document Type Updated',
        description: 'Document type has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update document type: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete document type mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('document_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Document Type Deleted',
        description: 'Document type has been removed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['document-types'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete document type: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', is_required: false });
    setEditingDoc(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDoc) {
      updateDocumentMutation.mutate({ ...formData, id: editingDoc.id });
    } else {
      createDocumentMutation.mutate(formData);
    }
  };

  const handleEdit = (doc: DocumentType) => {
    setEditingDoc(doc);
    setFormData({
      name: doc.name,
      description: doc.description || '',
      is_required: doc.is_required
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this document type?')) {
      deleteDocumentMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen page-container animated-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading document types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-container animated-bg">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Document Management</h1>
            <p className="text-muted-foreground">Manage required documents for students, teachers, and staff</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Document Type
              </Button>
            </DialogTrigger>
            <DialogContent className="form-container border-white/50">
              <DialogHeader>
                <DialogTitle>
                  {editingDoc ? 'Edit Document Type' : 'Add New Document Type'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Document Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Birth Certificate, ID Card"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional description for the document type"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData({...formData, is_required: !!checked})}
                  />
                  <Label htmlFor="required">This document is required</Label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createDocumentMutation.isPending || updateDocumentMutation.isPending}>
                    {editingDoc ? 'Update' : 'Create'} Document Type
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Document Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documentTypes?.map((docType) => (
            <Card key={docType.id} className="form-container border-white/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>{docType.name}</span>
                  </CardTitle>
                  <Badge variant={docType.is_required ? 'destructive' : 'secondary'}>
                    {docType.is_required ? 'Required' : 'Optional'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {docType.description && (
                  <p className="text-sm text-muted-foreground mb-4">{docType.description}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(docType)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(docType.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {documentTypes?.length === 0 && (
          <Card className="form-container border-white/50 shadow-lg">
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No Document Types</h3>
              <p className="text-muted-foreground mb-4">
                No document types have been configured yet. Add your first document type to get started.
              </p>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Document Type
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructions Section */}
        <Card className="form-container border-white/50 shadow-lg mt-6">
          <CardHeader>
            <CardTitle>How Document Management Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 mt-0.5 text-blue-500" />
                <div>
                  <h4 className="font-medium">Document Types</h4>
                  <p className="text-sm text-muted-foreground">
                    Define what types of documents are required from students, teachers, and staff.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Upload className="h-5 w-5 mt-0.5 text-green-500" />
                <div>
                  <h4 className="font-medium">Document Submission</h4>
                  <p className="text-sm text-muted-foreground">
                    Users can upload their documents through their profiles, and you can track submission status.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Download className="h-5 w-5 mt-0.5 text-purple-500" />
                <div>
                  <h4 className="font-medium">Document Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    Review and verify submitted documents to ensure compliance with school requirements.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentManager;