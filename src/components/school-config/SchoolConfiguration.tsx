
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import SchoolSettingsForm from './SchoolSettingsForm';
import BulkUploadForm from '@/components/bulk-upload/BulkUploadForm';
import UserCredentialsManager from '@/components/user-management/UserCredentialsManager';
import AcademicYearManagement from '@/components/academic-year/AcademicYearManagement';
import ClassStructureManagement from '@/components/class-structure/ClassStructureManagement';
import CustomFieldForm from './CustomFieldForm';
import DocumentTypeForm from './DocumentTypeForm';
import FeeHeadForm from './FeeHeadForm';
import SchoolAssociation from '@/components/school-management/SchoolAssociation';

const SchoolConfiguration = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('settings');

  // If admin doesn't have a school association, show the association component
  if (!profile?.school_id) {
    return <SchoolAssociation />;
  }

  const schoolId = profile.school_id;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
          <TabsTrigger value="credentials">Credentials</TabsTrigger>
          <TabsTrigger value="academic-years">Academic Years</TabsTrigger>
          <TabsTrigger value="class-structure">Class Structure</TabsTrigger>
          <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
          <TabsTrigger value="document-types">Document Types</TabsTrigger>
          <TabsTrigger value="fee-heads">Fee Heads</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <SchoolSettingsForm schoolId={schoolId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-upload" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <BulkUploadForm schoolId={schoolId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <UserCredentialsManager schoolId={schoolId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic-years" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <AcademicYearManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class-structure" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <ClassStructureManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-fields" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <CustomFieldForm 
                schoolId={schoolId}
                onClose={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="document-types" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <DocumentTypeForm 
                schoolId={schoolId}
                onClose={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fee-heads" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <FeeHeadForm 
                schoolId={schoolId}
                onClose={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchoolConfiguration;
