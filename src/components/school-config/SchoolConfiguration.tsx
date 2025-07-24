
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Plus, Edit2, Trash2 } from 'lucide-react';
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

interface CustomField {
  id: string;
  module: 'student' | 'teacher' | 'fee' | 'document';
  label: string;
  field_type: 'text' | 'number' | 'dropdown' | 'checkbox' | 'date';
  options: string[];
  is_required: boolean;
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  is_required: boolean;
}

interface FeeHead {
  id: string;
  name: string;
  description: string;
  amount: number;
  is_active: boolean;
}

const SchoolConfiguration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('custom-fields');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'custom-field' | 'document-type' | 'fee-head'>('custom-field');
  const [editingItem, setEditingItem] = useState<any>(null);
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
      return data;
    },
  });

  const { data: customFields } = useQuery({
    queryKey: ['custom-fields', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('label');
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id,
  });

  const { data: documentTypes } = useQuery({
    queryKey: ['document-types', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id,
  });

  const { data: feeHeads } = useQuery({
    queryKey: ['fee-heads', profile?.school_id],
    queryFn: async () => {
      if (!profile?.school_id) return [];
      
      const { data, error } = await supabase
        .from('fee_heads')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.school_id,
  });

  const createCustomFieldMutation = useMutation({
    mutationFn: async (data: Omit<CustomField, 'id'>) => {
      if (!profile?.school_id) throw new Error('School ID not found');
      
      const { error } = await supabase
        .from('custom_fields')
        .insert([{
          ...data,
          school_id: profile.school_id,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Custom field created successfully',
      });
    },
  });

  const openDialog = (type: 'custom-field' | 'document-type' | 'fee-head', item?: any) => {
    setDialogType(type);
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">School Configuration</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
          <TabsTrigger value="document-types">Document Types</TabsTrigger>
          <TabsTrigger value="fee-heads">Fee Heads</TabsTrigger>
        </TabsList>

        <TabsContent value="custom-fields" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Custom Fields</h2>
            <Button onClick={() => openDialog('custom-field')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Field
            </Button>
          </div>
          
          <div className="grid gap-4">
            {customFields?.map((field) => (
              <Card key={field.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{field.label}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog('custom-field', field)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Module: {field.module}</span>
                    <span>Type: {field.field_type}</span>
                    <span>Required: {field.is_required ? 'Yes' : 'No'}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="document-types" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Document Types</h2>
            <Button onClick={() => openDialog('document-type')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Document Type
            </Button>
          </div>
          
          <div className="grid gap-4">
            {documentTypes?.map((docType) => (
              <Card key={docType.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{docType.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog('document-type', docType)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Required: {docType.is_required ? 'Yes' : 'No'}</span>
                  </div>
                  {docType.description && (
                    <p className="text-sm text-gray-600 mt-2">{docType.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fee-heads" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Fee Heads</h2>
            <Button onClick={() => openDialog('fee-head')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Fee Head
            </Button>
          </div>
          
          <div className="grid gap-4">
            {feeHeads?.map((feeHead) => (
              <Card key={feeHead.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{feeHead.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog('fee-head', feeHead)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Amount: ${feeHead.amount}</span>
                    <span>Active: {feeHead.is_active ? 'Yes' : 'No'}</span>
                  </div>
                  {feeHead.description && (
                    <p className="text-sm text-gray-600 mt-2">{feeHead.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit' : 'Create'} {dialogType.replace('-', ' ')}
            </DialogTitle>
          </DialogHeader>
          <div className="text-center text-gray-500">
            Configuration form will be implemented here
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolConfiguration;
