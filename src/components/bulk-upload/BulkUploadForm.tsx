
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BulkUploadProcessor } from '@/utils/bulkUploadProcessor';

interface BulkUploadFormProps {
  schoolId: string;
}

const BulkUploadForm: React.FC<BulkUploadFormProps> = ({ schoolId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const processor = new BulkUploadProcessor(schoolId);
      
      // Create bulk upload record
      const { data: uploadRecord, error: uploadError } = await supabase
        .from('bulk_uploads')
        .insert({
          school_id: schoolId,
          upload_type: type,
          file_name: file.name,
          total_records: 0,
          status: 'processing'
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      try {
        // Parse Excel/CSV data
        const data = await processor.parseExcelData(file);
        
        // Update total records
        await supabase
          .from('bulk_uploads')
          .update({ total_records: data.length })
          .eq('id', uploadRecord.id);

        // Process based on type
        let result;
        switch (type) {
          case 'students':
            result = await processor.processStudents(data);
            break;
          case 'teachers':
            result = await processor.processTeachers(data);
            break;
          case 'staff':
            result = await processor.processStaff(data);
            break;
          default:
            throw new Error('Invalid upload type');
        }

        // Update final status
        await supabase
          .from('bulk_uploads')
          .update({
            status: result.success ? 'completed' : 'failed',
            successful_records: result.successCount,
            failed_records: result.failureCount,
            completed_at: new Date().toISOString(),
            error_log: result.errors.length > 0 ? result.errors : null
          })
          .eq('id', uploadRecord.id);

        return { uploadRecord, result };
      } catch (error: any) {
        // Update status to failed
        await supabase
          .from('bulk_uploads')
          .update({
            status: 'failed',
            error_log: [error.message],
            completed_at: new Date().toISOString()
          })
          .eq('id', uploadRecord.id);
        
        throw error;
      }
    },
    onSuccess: (data) => {
      const { result } = data;
      setUploadResult(result);
      toast({
        title: "Upload Completed",
        description: `Successfully processed ${result.successCount} records with ${result.failureCount} failures.`,
        variant: result.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['bulk-uploads'] });
      queryClient.invalidateQueries({ queryKey: ['user-credentials'] });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Upload processing failed",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type.includes('spreadsheet') || 
          selectedFile.name.endsWith('.xlsx') || 
          selectedFile.name.endsWith('.xls') ||
          selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx, .xls) or CSV file (.csv)",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !uploadType) {
      toast({
        title: "Missing Information",
        description: "Please select a file and upload type",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await uploadMutation.mutateAsync({ file, type: uploadType });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = (type: string) => {
    let csvContent = '';
    
    switch (type) {
      case 'students':
        csvContent = 'first_name,last_name,email,phone,date_of_birth,gender,address,student_id,admission_date,parent_name,parent_phone,parent_email,medical_info\n';
        csvContent += 'John,Doe,john.doe@email.com,1234567890,2005-01-15,male,123 Main St,STD001,2023-09-01,Jane Doe,0987654321,jane.doe@email.com,No allergies';
        break;
      case 'teachers':
        csvContent = 'first_name,last_name,email,phone,date_of_birth,gender,address,employee_id,hire_date,salary,qualification,specialization\n';
        csvContent += 'Jane,Smith,jane.smith@email.com,1234567890,1985-05-20,female,456 Oak St,TCH001,2023-08-01,50000,M.Ed,Mathematics';
        break;
      case 'staff':
        csvContent = 'first_name,last_name,email,phone,date_of_birth,gender,address,employee_id,hire_date,salary,position\n';
        csvContent += 'Bob,Johnson,bob.johnson@email.com,1234567890,1980-03-10,male,789 Pine St,STF001,2023-07-01,40000,Administrator';
        break;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: `${type} template downloaded successfully!`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Bulk Upload from Excel/CSV</span>
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
            <Label htmlFor="file-upload">Excel/CSV File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
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
            disabled={!file || !uploadType || isProcessing}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Upload and Process File'}
          </Button>
        </CardContent>
      </Card>

      {uploadResult && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Upload Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Successful Records:</span>
                <span className="font-semibold text-green-600">{uploadResult.successCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Failed Records:</span>
                <span className="font-semibold text-red-600">{uploadResult.failureCount}</span>
              </div>
              
              {uploadResult.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                  <div className="bg-red-50 p-3 rounded max-h-32 overflow-y-auto">
                    {uploadResult.errors.map((error: string, index: number) => (
                      <p key={index} className="text-sm text-red-700">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkUploadForm;
