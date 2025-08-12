
import { supabase } from '@/integrations/supabase/client';

export interface BulkUploadRow {
  [key: string]: string | number | boolean;
}

export interface ProcessResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  errors: string[];
}

export class BulkUploadProcessor {
  private schoolId: string;

  constructor(schoolId: string) {
    this.schoolId = schoolId;
  }

  async processStudents(data: BulkUploadRow[]): Promise<ProcessResult> {
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        // Validate and type the gender field
        const gender = this.validateGender(row.gender as string);
        
        // Create profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            first_name: row.first_name as string,
            last_name: row.last_name as string,
            email: row.email as string,
            phone: row.phone as string,
            role: 'student' as const,
            school_id: this.schoolId,
            date_of_birth: row.date_of_birth as string,
            gender: gender,
            address: row.address as string,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Create student record
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            profile_id: profile.id,
            student_id: row.student_id as string,
            admission_date: row.admission_date as string,
            parent_name: row.parent_name as string,
            parent_phone: row.parent_phone as string,
            parent_email: row.parent_email as string,
            medical_info: row.medical_info as string,
          });

        if (studentError) throw studentError;

        // Generate credentials
        await this.generateCredentials(profile.id, profile.first_name, profile.last_name, 'student');
        
        successCount++;
      } catch (error: any) {
        failureCount++;
        errors.push(`Row ${successCount + failureCount}: ${error.message}`);
      }
    }

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors,
    };
  }

  async processTeachers(data: BulkUploadRow[]): Promise<ProcessResult> {
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        // Validate and type the gender field
        const gender = this.validateGender(row.gender as string);
        
        // Create profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            first_name: row.first_name as string,
            last_name: row.last_name as string,
            email: row.email as string,
            phone: row.phone as string,
            role: 'teacher' as const,
            school_id: this.schoolId,
            date_of_birth: row.date_of_birth as string,
            gender: gender,
            address: row.address as string,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Create teacher record
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert({
            profile_id: profile.id,
            employee_id: row.employee_id as string,
            hire_date: row.hire_date as string,
            salary: row.salary as number,
            qualification: row.qualification as string,
            specialization: row.specialization as string,
          });

        if (teacherError) throw teacherError;

        // Generate credentials
        await this.generateCredentials(profile.id, profile.first_name, profile.last_name, 'teacher');
        
        successCount++;
      } catch (error: any) {
        failureCount++;
        errors.push(`Row ${successCount + failureCount}: ${error.message}`);
      }
    }

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors,
    };
  }

  async processStaff(data: BulkUploadRow[]): Promise<ProcessResult> {
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        // Validate and type the gender field
        const gender = this.validateGender(row.gender as string);
        
        // Create profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            first_name: row.first_name as string,
            last_name: row.last_name as string,
            email: row.email as string,
            phone: row.phone as string,
            role: 'admin' as const, // Staff gets admin role
            school_id: this.schoolId,
            date_of_birth: row.date_of_birth as string,
            gender: gender,
            address: row.address as string,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Create staff record
        const { error: staffError } = await supabase
          .from('staff')
          .insert({
            profile_id: profile.id,
            employee_id: row.employee_id as string,
            hire_date: row.hire_date as string,
            salary: row.salary as number,
            position: row.position as string,
          });

        if (staffError) throw staffError;

        // Generate credentials
        await this.generateCredentials(profile.id, profile.first_name, profile.last_name, 'admin');
        
        successCount++;
      } catch (error: any) {
        failureCount++;
        errors.push(`Row ${successCount + failureCount}: ${error.message}`);
      }
    }

    return {
      success: failureCount === 0,
      successCount,
      failureCount,
      errors,
    };
  }

  private validateGender(gender: string): 'male' | 'female' | 'other' {
    const normalizedGender = gender?.toLowerCase().trim();
    if (normalizedGender === 'male' || normalizedGender === 'm') {
      return 'male';
    } else if (normalizedGender === 'female' || normalizedGender === 'f') {
      return 'female';
    } else {
      return 'other';
    }
  }

  private async generateCredentials(profileId: string, firstName: string, lastName: string, role: 'student' | 'teacher' | 'admin') {
    const { data: username } = await supabase.rpc('generate_username', {
      first_name: firstName,
      last_name: lastName,
      role: role,
      school_id: this.schoolId
    });

    const defaultPassword = 'School' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    await supabase
      .from('user_credentials')
      .insert({
        profile_id: profileId,
        username: username,
        default_password: defaultPassword,
      });
  }

  parseExcelData(file: File): Promise<BulkUploadRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (typeof data === 'string') {
            // Simple CSV parsing - in production, use a proper library like xlsx
            const lines = data.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());
            const rows: BulkUploadRow[] = [];

            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(',');
                const row: BulkUploadRow = {};
                headers.forEach((header, index) => {
                  row[header] = values[index]?.trim() || '';
                });
                rows.push(row);
              }
            }
            
            resolve(rows);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
