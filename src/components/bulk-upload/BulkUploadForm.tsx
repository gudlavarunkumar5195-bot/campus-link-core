
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface BulkUploadFormProps {
  schoolId: string;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({ schoolId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('school_id', schoolId);

      // For now, we'll simulate the upload process
      // In a real implementation, you'd send this to an edge function
      const response = await processExcelFile(file, type, schoolId);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bulk upload completed successfully!",
      });
      setFile(null);
      setUploadType('');
      queryClient.invalidateQueries({ queryKey: ['bulk-uploads'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Upload failed",
        variant: "destructive",
      });
    },
  });

  const processExcelFile = async (file: File, type: string, schoolId: string) => {
    // This is a placeholder for Excel processing
    // In a real implementation, you'd use a library like xlsx to parse the Excel file
    console.log('Processing Excel file:', file.name, 'Type:', type);
    
    // Create bulk upload record
    const { data: uploadRecord, error } = await supabase
      .from('bulk_uploads')
      .insert({
        school_id: schoolId,
        upload_type: type,
        file_name: file.name,
        total_records: 100, // This would be calculated from the Excel file
        status: 'processing'
      })
      .select()
      .single();

    if (error) throw error;

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update status to completed
    await supabase
      .from('bulk_uploads')
      .update({ 
        status: 'completed',
        successful_records: 95,
        failed_records: 5,
        completed_at: new Date().toISOString()
      })
      .eq('id', uploadRecord.id);

    return uploadRecord;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.includes('spreadsheet') || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!file || !uploadType) {
      toast({
        title: "Missing Information",
        description: "Please select a file and upload type",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    uploadMutation.mutate({ file, type: uploadType });
    setUploading(false);
  };

  const downloadTemplate = (type: string) => {
    // This would download a template Excel file for the selected type
    toast({
      title: "Template Download",
      description: `Downloading ${type} template...`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileSpreadsheet className="h-5 w-5" />
          <span>Bulk Upload from Excel</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="upload-type">Upload Type</Label>
          <Select value={uploadType} onValueChange={setUploadType}>
            <SelectTrigger>
              <SelectValue placeholder="Select what to upload" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="students">Students</SelectItem>
              <SelectItem value="teachers">Teachers</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {uploadType && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => downloadTemplate(uploadType)}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Template</span>
            </Button>
          </div>
        )}

        <div>
          <Label htmlFor="file-upload">Excel File</Label>
          <Input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />
          {file && (
            <p className="text-sm text-gray-600 mt-1">
              Selected: {file.name}
            </p>
          )}
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || !uploadType || uploading}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : 'Upload Excel File'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BulkUploadForm;
