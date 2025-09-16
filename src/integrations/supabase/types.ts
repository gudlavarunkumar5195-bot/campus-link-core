export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_active: boolean
          name: string
          school_id: string | null
          start_date: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          school_id?: string | null
          start_date: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string | null
          start_date?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academic_years_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          class_id: string | null
          content: string
          created_at: string | null
          created_by: string
          expire_date: string | null
          id: string
          is_published: boolean | null
          priority: string | null
          publish_date: string | null
          tenant_id: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          content: string
          created_at?: string | null
          created_by: string
          expire_date?: string | null
          id?: string
          is_published?: boolean | null
          priority?: string | null
          publish_date?: string | null
          tenant_id?: string | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string
          expire_date?: string | null
          id?: string
          is_published?: boolean | null
          priority?: string | null
          publish_date?: string | null
          tenant_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          feedback: string | null
          file_url: string | null
          grade: number | null
          graded_at: string | null
          graded_by: string | null
          id: string
          student_id: string | null
          submission_text: string | null
          submitted_at: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          student_id?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          grade?: number | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          student_id?: string | null
          submission_text?: string | null
          submitted_at?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_graded_by_fkey"
            columns: ["graded_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          class_id: string | null
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          max_points: number | null
          subject_id: string | null
          teacher_id: string | null
          tenant_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          max_points?: number | null
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          max_points?: number | null
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_id: string | null
          created_at: string | null
          date: string
          id: string
          marked_by: string | null
          notes: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          marked_by?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_uploads: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_log: Json | null
          failed_records: number | null
          file_name: string
          id: string
          school_id: string | null
          status: string | null
          successful_records: number | null
          tenant_id: string | null
          total_records: number
          upload_type: string
          uploaded_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_records?: number | null
          file_name: string
          id?: string
          school_id?: string | null
          status?: string | null
          successful_records?: number | null
          tenant_id?: string | null
          total_records: number
          upload_type: string
          uploaded_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_log?: Json | null
          failed_records?: number | null
          file_name?: string
          id?: string
          school_id?: string | null
          status?: string | null
          successful_records?: number | null
          tenant_id?: string | null
          total_records?: number
          upload_type?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_uploads_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_uploads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_structure: {
        Row: {
          academic_year_id: string | null
          class_name: string
          created_at: string | null
          id: string
          school_id: string | null
          sections: string[]
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year_id?: string | null
          class_name: string
          created_at?: string | null
          id?: string
          school_id?: string | null
          sections?: string[]
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string | null
          class_name?: string
          created_at?: string | null
          id?: string
          school_id?: string | null
          sections?: string[]
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_structure_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_structure_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_structure_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string
          class_teacher_id: string | null
          created_at: string | null
          grade_level: number
          id: string
          max_students: number | null
          name: string
          school_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          class_teacher_id?: string | null
          created_at?: string | null
          grade_level: number
          id?: string
          max_students?: number | null
          name: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          class_teacher_id?: string | null
          created_at?: string | null
          grade_level?: number
          id?: string
          max_students?: number | null
          name?: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string | null
          field_type: string
          id: string
          is_required: boolean
          label: string
          module: string
          options: string[]
          school_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          field_type: string
          id?: string
          is_required?: boolean
          label: string
          module: string
          options?: string[]
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          field_type?: string
          id?: string
          is_required?: boolean
          label?: string
          module?: string
          options?: string[]
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          head_id: string | null
          id: string
          name: string
          school_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          head_id?: string | null
          id?: string
          name: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          head_id?: string | null
          id?: string
          name?: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_id_fkey"
            columns: ["head_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean
          name: string
          school_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          name: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          name?: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_types_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_heads: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_heads_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_heads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string | null
          discount_amount: number | null
          discount_percentage: number | null
          fee_heads: Json
          final_amount: number
          id: string
          is_active: boolean | null
          school_id: string
          tenant_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          class_id: string
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          fee_heads?: Json
          final_amount?: number
          id?: string
          is_active?: boolean | null
          school_id: string
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          fee_heads?: Json
          final_amount?: number
          id?: string
          is_active?: boolean | null
          school_id?: string
          tenant_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      grades: {
        Row: {
          assessment_name: string
          assessment_type: string
          comments: string | null
          created_at: string | null
          date: string
          grade: Database["public"]["Enums"]["grade_type"] | null
          id: string
          max_score: number | null
          score: number | null
          student_id: string | null
          subject_id: string | null
          teacher_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_name: string
          assessment_type: string
          comments?: string | null
          created_at?: string | null
          date: string
          grade?: Database["public"]["Enums"]["grade_type"] | null
          id?: string
          max_score?: number | null
          score?: number | null
          student_id?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_name?: string
          assessment_type?: string
          comments?: string | null
          created_at?: string | null
          date?: string
          grade?: Database["public"]["Enums"]["grade_type"] | null
          id?: string
          max_score?: number | null
          score?: number | null
          student_id?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          class_id: string
          created_at: string | null
          description: string | null
          due_date: string
          id: string
          subject_id: string
          teacher_id: string
          tenant_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          description?: string | null
          due_date: string
          id?: string
          subject_id: string
          teacher_id: string
          tenant_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string
          id?: string
          subject_id?: string
          teacher_id?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string | null
          avatar_url: string | null
          blood_group: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id: string
          is_active: boolean | null
          last_name: string
          medical_conditions: string | null
          nationality: string | null
          phone: string | null
          previous_school: string | null
          religion: string | null
          role: Database["public"]["Enums"]["user_role"]
          roll_number: string | null
          school_id: string | null
          special_needs: string | null
          transport_mode: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id: string
          is_active?: boolean | null
          last_name: string
          medical_conditions?: string | null
          nationality?: string | null
          phone?: string | null
          previous_school?: string | null
          religion?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roll_number?: string | null
          school_id?: string | null
          special_needs?: string | null
          transport_mode?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          avatar_url?: string | null
          blood_group?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          medical_conditions?: string | null
          nationality?: string | null
          phone?: string | null
          previous_school?: string | null
          religion?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roll_number?: string | null
          school_id?: string | null
          special_needs?: string | null
          transport_mode?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          auto_generate_ids: boolean | null
          bulk_upload_enabled: boolean | null
          created_at: string | null
          email_notifications_enabled: boolean | null
          id: string
          school_id: string | null
          staff_registration_enabled: boolean | null
          student_registration_enabled: boolean | null
          teacher_registration_enabled: boolean | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_generate_ids?: boolean | null
          bulk_upload_enabled?: boolean | null
          created_at?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          school_id?: string | null
          staff_registration_enabled?: boolean | null
          student_registration_enabled?: boolean | null
          teacher_registration_enabled?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_generate_ids?: boolean | null
          bulk_upload_enabled?: boolean | null
          created_at?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          school_id?: string | null
          staff_registration_enabled?: boolean | null
          student_registration_enabled?: boolean | null
          teacher_registration_enabled?: boolean | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          slug: string | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          slug?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          certifications: string[] | null
          contract_end_date: string | null
          created_at: string | null
          department: string | null
          employee_id: string
          employment_type: string | null
          hire_date: string
          id: string
          performance_rating: number | null
          position: string
          probation_period: number | null
          profile_id: string | null
          responsibilities: string[] | null
          salary: number | null
          shift_timing: string | null
          supervisor_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          certifications?: string[] | null
          contract_end_date?: string | null
          created_at?: string | null
          department?: string | null
          employee_id: string
          employment_type?: string | null
          hire_date?: string
          id?: string
          performance_rating?: number | null
          position: string
          probation_period?: number | null
          profile_id?: string | null
          responsibilities?: string[] | null
          salary?: number | null
          shift_timing?: string | null
          supervisor_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          certifications?: string[] | null
          contract_end_date?: string | null
          created_at?: string | null
          department?: string | null
          employee_id?: string
          employment_type?: string | null
          hire_date?: string
          id?: string
          performance_rating?: number | null
          position?: string
          probation_period?: number | null
          profile_id?: string | null
          responsibilities?: string[] | null
          salary?: number | null
          shift_timing?: string | null
          supervisor_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year: string | null
          admission_date: string
          class_id: string | null
          created_at: string | null
          documents_submitted: string[] | null
          fee_category: string | null
          hostel_resident: boolean | null
          id: string
          medical_info: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          previous_class: string | null
          profile_id: string | null
          roll_number: string | null
          scholarship_details: string | null
          section: string | null
          student_id: string
          tc_number: string | null
          tenant_id: string | null
          transport_required: boolean | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          admission_date: string
          class_id?: string | null
          created_at?: string | null
          documents_submitted?: string[] | null
          fee_category?: string | null
          hostel_resident?: boolean | null
          id?: string
          medical_info?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          previous_class?: string | null
          profile_id?: string | null
          roll_number?: string | null
          scholarship_details?: string | null
          section?: string | null
          student_id: string
          tc_number?: string | null
          tenant_id?: string | null
          transport_required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          admission_date?: string
          class_id?: string | null
          created_at?: string | null
          documents_submitted?: string[] | null
          fee_category?: string | null
          hostel_resident?: boolean | null
          id?: string
          medical_info?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          previous_class?: string | null
          profile_id?: string | null
          roll_number?: string | null
          scholarship_details?: string | null
          section?: string | null
          student_id?: string
          tc_number?: string | null
          tenant_id?: string | null
          transport_required?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          school_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects_offered: {
        Row: {
          code: string | null
          created_at: string | null
          description: string | null
          grade_levels: number[] | null
          id: string
          name: string
          school_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          grade_levels?: number[] | null
          id?: string
          name: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          description?: string | null
          grade_levels?: number[] | null
          id?: string
          name?: string
          school_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_offered_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_offered_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          school_id: string
          status: string
          stripe_subscription_id: string | null
          tenant_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          school_id: string
          status?: string
          stripe_subscription_id?: string | null
          tenant_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          school_id?: string
          status?: string
          stripe_subscription_id?: string | null
          tenant_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_class_assignments: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string | null
          id: string
          is_class_teacher: boolean | null
          subject_id: string | null
          teacher_id: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year: string
          class_id: string
          created_at?: string | null
          id?: string
          is_class_teacher?: boolean | null
          subject_id?: string | null
          teacher_id: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string | null
          id?: string
          is_class_teacher?: boolean | null
          subject_id?: string | null
          teacher_id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      teacher_subjects: {
        Row: {
          class_id: string | null
          created_at: string | null
          id: string
          subject_id: string | null
          teacher_id: string | null
          tenant_id: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          id?: string
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          class_teacher_for: string | null
          contract_end_date: string | null
          created_at: string | null
          department: string | null
          employee_id: string
          employment_type: string | null
          experience_years: number | null
          hire_date: string
          id: string
          performance_rating: number | null
          previous_experience: string | null
          probation_period: number | null
          profile_id: string | null
          qualification: string | null
          salary: number | null
          specialization: string | null
          subjects_taught: string[] | null
          tenant_id: string | null
          training_certifications: string[] | null
          updated_at: string | null
        }
        Insert: {
          class_teacher_for?: string | null
          contract_end_date?: string | null
          created_at?: string | null
          department?: string | null
          employee_id: string
          employment_type?: string | null
          experience_years?: number | null
          hire_date: string
          id?: string
          performance_rating?: number | null
          previous_experience?: string | null
          probation_period?: number | null
          profile_id?: string | null
          qualification?: string | null
          salary?: number | null
          specialization?: string | null
          subjects_taught?: string[] | null
          tenant_id?: string | null
          training_certifications?: string[] | null
          updated_at?: string | null
        }
        Update: {
          class_teacher_for?: string | null
          contract_end_date?: string | null
          created_at?: string | null
          department?: string | null
          employee_id?: string
          employment_type?: string | null
          experience_years?: number | null
          hire_date?: string
          id?: string
          performance_rating?: number | null
          previous_experience?: string | null
          probation_period?: number | null
          profile_id?: string | null
          qualification?: string | null
          salary?: number | null
          specialization?: string | null
          subjects_taught?: string[] | null
          tenant_id?: string | null
          training_certifications?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          class_id: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          room_number: string | null
          start_time: string
          subject_id: string | null
          teacher_id: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          room_number?: string | null
          start_time: string
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          room_number?: string | null
          start_time?: string
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetables_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credentials: {
        Row: {
          created_at: string | null
          default_password: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          password_changed: boolean | null
          profile_id: string | null
          tenant_id: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          default_password?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_changed?: boolean | null
          profile_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          default_password?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_changed?: boolean | null
          profile_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_credentials_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string | null
          granted_by: string
          id: string
          permission_level: string
          permission_type: string
          profile_id: string
          resource_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          granted_by: string
          id?: string
          permission_level?: string
          permission_type: string
          profile_id: string
          resource_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          granted_by?: string
          id?: string
          permission_level?: string
          permission_type?: string
          profile_id?: string
          resource_id?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_demo_user: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_password: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_school_id: string
          p_username: string
        }
        Returns: string
      }
      generate_default_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_username: {
        Args: {
          first_name: string
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
          school_id: string
        }
        Returns: string
      }
      get_default_school_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_school_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      toggle_school_status: {
        Args: { new_status: string; school_id: string }
        Returns: undefined
      }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late"
      gender: "male" | "female" | "other"
      grade_type: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D+" | "D" | "F"
      user_role: "admin" | "teacher" | "student"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      attendance_status: ["present", "absent", "late"],
      gender: ["male", "female", "other"],
      grade_type: ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"],
      user_role: ["admin", "teacher", "student"],
    },
  },
} as const
