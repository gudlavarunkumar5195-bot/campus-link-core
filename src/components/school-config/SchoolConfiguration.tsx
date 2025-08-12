import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CustomFieldForm from './CustomFieldForm';
import DocumentTypeForm from './DocumentTypeForm';
import FeeHeadForm from './FeeHeadForm';
import BulkUploadForm from '../bulk-upload/BulkUploadForm';
import SchoolSettingsForm from './SchoolSettingsForm';
import UserCredentialsManager from '../user-management/UserCredentialsManager';

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

interface Profile {
  id: string;
  school_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

const SchoolConfiguration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'custom-field' | 'document-type' | 'fee-head'>('custom-field');
  const [editingItem, setEditingItem] = useState<any>(null);

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
      return data as CustomField[];
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
      return data as DocumentType[];
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
      return data as FeeHead[];
    },
    enabled: !!profile?.school_id,
  });

  const openDialog = (type: 'custom-field' | 'document-type' | 'fee-head', item?: any) => {
    setDialogType(type);
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const getDialogTitle = () => {
    const action = editingItem ? 'Edit' : 'Create';
    switch (dialogType) {
      case 'custom-field':
        return `${action} Custom Field`;
      case 'document-type':
        return `${action} Document Type`;
      case 'fee-head':
        return `${action} Fee Head`;
      default:
        return 'Form';
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">School Configuration</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 bg-white border">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
          <TabsTrigger value="user-credentials">User Credentials</TabsTrigger>
          <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
          <TabsTrigger value="document-types">Document Types</TabsTrigger>
          <TabsTrigger value="fee-heads">Fee Heads</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          {profile?.school_id && (
            <SchoolSettingsForm schoolId={profile.school_id} />
          )}
        </TabsContent>

        <TabsContent value="bulk-upload" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Bulk Upload</h2>
          </div>
          {profile?.school_id && (
            <BulkUploadForm schoolId={profile.school_id} />
          )}
        </TabsContent>

        <TabsContent value="user-credentials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">User Credentials</h2>
          </div>
          {profile?.school_id && (
            <UserCredentialsManager schoolId={profile.school_id} />
          )}
        </TabsContent>

        <TabsContent value="custom-fields" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Custom Fields</h2>
            <Button onClick={() => openDialog('custom-field')} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Field
            </Button>
          </div>
          
          <div className="grid gap-4">
            {customFields?.map((field) => (
              <Card key={field.id} className="bg-white border border-gray-200">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-gray-900">{field.label}</CardTitle>
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
                  {field.options.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Options: {field.options.join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="document-types" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Document Types</h2>
            <Button onClick={() => openDialog('document-type')} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Document Type
            </Button>
          </div>
          
          <div className="grid gap-4">
            {documentTypes?.map((docType) => (
              <Card key={docType.id} className="bg-white border border-gray-200">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-gray-900">{docType.name}</CardTitle>
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
            <h2 className="text-xl font-semibold text-gray-900">Fee Heads</h2>
            <Button onClick={() => openDialog('fee-head')} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Fee Head
            </Button>
          </div>
          
          <div className="grid gap-4">
            {feeHeads?.map((feeHead) => (
              <Card key={feeHead.id} className="bg-white border border-gray-200">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg text-gray-900">{feeHead.name}</CardTitle>
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
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          
          {profile?.school_id && (
            <>
              {dialogType === 'custom-field' && (
                <CustomFieldForm
                  field={editingItem}
                  onClose={closeDialog}
                  schoolId={profile.school_id}
                />
              )}
              {dialogType === 'document-type' && (
                <DocumentTypeForm
                  documentType={editingItem}
                  onClose={closeDialog}
                  schoolId={profile.school_id}
                />
              )}
              {dialogType === 'fee-head' && (
                <FeeHeadForm
                  feeHead={editingItem}
                  onClose={closeDialog}
                  schoolId={profile.school_id}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolConfiguration;
