
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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

    console.log('Processing students data:', data);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        console.log(`Processing student row ${i + 1}:`, row);

        // Validate required fields with better error messages
        const missingFields: string[] = [];
        if (!row.first_name || String(row.first_name).trim() === '') missingFields.push('first_name');
        if (!row.last_name || String(row.last_name).trim() === '') missingFields.push('last_name');
        if (!row.email || String(row.email).trim() === '') missingFields.push('email');

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate email format
        const email = String(row.email).trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Invalid email format');
        }

        // Validate and type the gender field
        const gender = this.validateGender(String(row.gender || ''));
        
        // Generate a UUID for the profile
        const profileId = uuidv4();
        
        // Create profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: profileId,
            first_name: String(row.first_name).trim(),
            last_name: String(row.last_name).trim(),
            email: email,
            phone: String(row.phone || '').trim(),
            role: 'student' as const,
            school_id: this.schoolId,
            date_of_birth: this.parseDate(String(row.date_of_birth || '')),
            gender: gender,
            address: String(row.address || '').trim(),
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        // Create student record
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            profile_id: profile.id,
            student_id: String(row.student_id || `STD${Date.now()}${successCount}`).trim(),
            admission_date: this.parseDate(String(row.admission_date || '')) || new Date().toISOString().split('T')[0],
            parent_name: String(row.parent_name || '').trim(),
            parent_phone: String(row.parent_phone || '').trim(),
            parent_email: String(row.parent_email || '').trim(),
            medical_info: String(row.medical_info || '').trim(),
          });

        if (studentError) {
          console.error('Student creation error:', studentError);
          throw new Error(`Failed to create student record: ${studentError.message}`);
        }

        // Generate credentials
        await this.generateCredentials(profile.id, profile.first_name, profile.last_name, 'student');
        
        successCount++;
        console.log(`Successfully processed student ${successCount}`);
      } catch (error: any) {
        failureCount++;
        const errorMessage = `Row ${i + 1}: ${error.message}`;
        errors.push(errorMessage);
        console.error('Student processing error:', errorMessage);
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

    console.log('Processing teachers data:', data);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        console.log(`Processing teacher row ${i + 1}:`, row);

        // Validate required fields
        const missingFields: string[] = [];
        if (!row.first_name || String(row.first_name).trim() === '') missingFields.push('first_name');
        if (!row.last_name || String(row.last_name).trim() === '') missingFields.push('last_name');
        if (!row.email || String(row.email).trim() === '') missingFields.push('email');

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate email format
        const email = String(row.email).trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Invalid email format');
        }

        // Validate and type the gender field
        const gender = this.validateGender(String(row.gender || ''));
        
        // Generate a UUID for the profile
        const profileId = uuidv4();
        
        // Create profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: profileId,
            first_name: String(row.first_name).trim(),
            last_name: String(row.last_name).trim(),
            email: email,
            phone: String(row.phone || '').trim(),
            role: 'teacher' as const,
            school_id: this.schoolId,
            date_of_birth: this.parseDate(String(row.date_of_birth || '')),
            gender: gender,
            address: String(row.address || '').trim(),
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        // Create teacher record
        const { error: teacherError } = await supabase
          .from('teachers')
          .insert({
            profile_id: profile.id,
            employee_id: String(row.employee_id || `TCH${Date.now()}${successCount}`).trim(),
            hire_date: this.parseDate(String(row.hire_date || '')) || new Date().toISOString().split('T')[0],
            salary: this.parseNumber(row.salary) || 0,
            qualification: String(row.qualification || '').trim(),
            specialization: String(row.specialization || '').trim(),
          });

        if (teacherError) {
          console.error('Teacher creation error:', teacherError);
          throw new Error(`Failed to create teacher record: ${teacherError.message}`);
        }

        // Generate credentials
        await this.generateCredentials(profile.id, profile.first_name, profile.last_name, 'teacher');
        
        successCount++;
        console.log(`Successfully processed teacher ${successCount}`);
      } catch (error: any) {
        failureCount++;
        const errorMessage = `Row ${i + 1}: ${error.message}`;
        errors.push(errorMessage);
        console.error('Teacher processing error:', errorMessage);
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

    console.log('Processing staff data:', data);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        console.log(`Processing staff row ${i + 1}:`, row);

        // Validate required fields
        const missingFields: string[] = [];
        if (!row.first_name || String(row.first_name).trim() === '') missingFields.push('first_name');
        if (!row.last_name || String(row.last_name).trim() === '') missingFields.push('last_name');
        if (!row.email || String(row.email).trim() === '') missingFields.push('email');

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate email format
        const email = String(row.email).trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          throw new Error('Invalid email format');
        }

        // Validate and type the gender field
        const gender = this.validateGender(String(row.gender || ''));
        
        // Generate a UUID for the profile
        const profileId = uuidv4();
        
        // Create profile first
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: profileId,
            first_name: String(row.first_name).trim(),
            last_name: String(row.last_name).trim(),
            email: email,
            phone: String(row.phone || '').trim(),
            role: 'admin' as const, // Staff gets admin role
            school_id: this.schoolId,
            date_of_birth: this.parseDate(String(row.date_of_birth || '')),
            gender: gender,
            address: String(row.address || '').trim(),
          })
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }

        // Create staff record
        const { error: staffError } = await supabase
          .from('staff')
          .insert({
            profile_id: profile.id,
            employee_id: String(row.employee_id || `STF${Date.now()}${successCount}`).trim(),
            hire_date: this.parseDate(String(row.hire_date || '')) || new Date().toISOString().split('T')[0],
            salary: this.parseNumber(row.salary) || 0,
            position: String(row.position || 'Staff').trim(),
          });

        if (staffError) {
          console.error('Staff creation error:', staffError);
          throw new Error(`Failed to create staff record: ${staffError.message}`);
        }

        // Generate credentials
        await this.generateCredentials(profile.id, profile.first_name, profile.last_name, 'admin');
        
        successCount++;
        console.log(`Successfully processed staff ${successCount}`);
      } catch (error: any) {
        failureCount++;
        const errorMessage = `Row ${i + 1}: ${error.message}`;
        errors.push(errorMessage);
        console.error('Staff processing error:', errorMessage);
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
    if (!gender) return 'other';
    const normalizedGender = gender.toLowerCase().trim();
    if (normalizedGender === 'male' || normalizedGender === 'm') {
      return 'male';
    } else if (normalizedGender === 'female' || normalizedGender === 'f') {
      return 'female';
    } else {
      return 'other';
    }
  }

  private parseDate(dateStr: string): string | null {
    if (!dateStr || dateStr.trim() === '') return null;
    
    try {
      const date = new Date(dateStr.trim());
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private async generateCredentials(profileId: string, firstName: string, lastName: string, role: 'student' | 'teacher' | 'admin') {
    try {
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
    } catch (error) {
      console.error('Error generating credentials:', error);
      // Don't throw here as the profile creation was successful
    }
  }

  parseExcelData(file: File): Promise<BulkUploadRow[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (typeof data === 'string') {
            console.log('Raw file content:', data.substring(0, 500));
            
            // Improved CSV parsing
            const lines = data.split('\n').filter(line => line.trim() !== '');
            if (lines.length === 0) {
              throw new Error('File is empty or contains no data');
            }

            // Parse headers - handle potential quotes and trim whitespace
            const headerLine = lines[0];
            const headers = this.parseCSVLine(headerLine).map(h => h.trim().toLowerCase());
            console.log('Parsed headers:', headers);

            if (headers.length === 0) {
              throw new Error('No headers found in the file');
            }

            const rows: BulkUploadRow[] = [];

            for (let i = 1; i < lines.length; i++) {
              const line = lines[i].trim();
              if (line) {
                const values = this.parseCSVLine(line);
                const row: BulkUploadRow = {};
                
                headers.forEach((header, index) => {
                  row[header] = values[index]?.trim() || '';
                });
                
                // Only add rows that have at least some data
                const hasData = Object.values(row).some(value => String(value).trim() !== '');
                if (hasData) {
                  rows.push(row);
                }
              }
            }
            
            console.log('Parsed rows:', rows.length, 'Sample:', rows[0]);
            
            if (rows.length === 0) {
              throw new Error('No data rows found in the file');
            }

            resolve(rows);
          } else {
            throw new Error('Failed to read file content');
          }
        } catch (error: any) {
          console.error('File parsing error:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
}
