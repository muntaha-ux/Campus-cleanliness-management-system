export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'STUDENT' | 'TEACHER' | 'STAFF' | 'ADMIN';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
export type IssueStatus =
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'REOPENED'
  | 'CANCELLED';

export interface Database {
  public: {
    Tables: {
      system_settings: {
        Row: {
          key: string;
          value: Json;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          id: string;
          building: string;
          floor: string;
          room: string | null;
          specific_area: string;
          department: string | null;
          category: string;
          footfall_weight: number;
          qr_code_hash: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          building: string;
          floor: string;
          room?: string | null;
          specific_area: string;
          department?: string | null;
          category: string;
          footfall_weight?: number;
          qr_code_hash: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          building?: string;
          floor?: string;
          room?: string | null;
          specific_area?: string;
          department?: string | null;
          category?: string;
          footfall_weight?: number;
          qr_code_hash?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          profile_photo_url: string | null;
          department: string | null;
          student_or_employee_id: string | null;
          is_verified: boolean;
          is_active: boolean;
          notification_preferences: {
            email: boolean;
            in_app: boolean;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: UserRole;
          profile_photo_url?: string | null;
          department?: string | null;
          student_or_employee_id?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          notification_preferences?: {
            email: boolean;
            in_app: boolean;
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: UserRole;
          profile_photo_url?: string | null;
          department?: string | null;
          student_or_employee_id?: string | null;
          is_verified?: boolean;
          is_active?: boolean;
          notification_preferences?: {
            email: boolean;
            in_app: boolean;
          };
          updated_at?: string;
        };
        Relationships: [];
      };
      staff_profiles: {
        Row: {
          user_id: string;
          shift_start: string;
          shift_end: string;
          is_available: boolean;
          max_concurrent_tasks: number;
          assigned_department: string | null;
          assigned_building: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          shift_start?: string;
          shift_end?: string;
          is_available?: boolean;
          max_concurrent_tasks?: number;
          assigned_department?: string | null;
          assigned_building?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          shift_start?: string;
          shift_end?: string;
          is_available?: boolean;
          max_concurrent_tasks?: number;
          assigned_department?: string | null;
          assigned_building?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          id: string;
          reference_number: string;
          reporter_id: string | null;
          is_anonymous: boolean;
          anonymous_fingerprint: string | null;
          location_id: string;
          category: string;
          description: string;
          priority: IssuePriority;
          status: IssueStatus;
          photo_urls: string[];
          proof_photo_urls: string[];
          sla_deadline: string;
          is_duplicate_of: string | null;
          reopen_count: number;
          version: number;
          search_vector?: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference_number: string;
          reporter_id?: string | null;
          is_anonymous?: boolean;
          anonymous_fingerprint?: string | null;
          location_id: string;
          category: string;
          description: string;
          priority?: IssuePriority;
          status?: IssueStatus;
          photo_urls?: string[];
          proof_photo_urls?: string[];
          sla_deadline: string;
          is_duplicate_of?: string | null;
          reopen_count?: number;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference_number?: string;
          reporter_id?: string | null;
          is_anonymous?: boolean;
          anonymous_fingerprint?: string | null;
          location_id?: string;
          category?: string;
          description?: string;
          priority?: IssuePriority;
          status?: IssueStatus;
          photo_urls?: string[];
          proof_photo_urls?: string[];
          sla_deadline?: string;
          is_duplicate_of?: string | null;
          reopen_count?: number;
          version?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      issue_history: {
        Row: {
          id: string;
          issue_id: string;
          actor_id: string | null;
          old_status: IssueStatus | null;
          new_status: IssueStatus;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          actor_id?: string | null;
          old_status?: IssueStatus | null;
          new_status: IssueStatus;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          actor_id?: string | null;
          old_status?: IssueStatus | null;
          new_status?: IssueStatus;
          comment?: string | null;
        };
        Relationships: [];
      };
      task_assignments: {
        Row: {
          id: string;
          issue_id: string;
          staff_id: string;
          assigned_by: string | null;
          is_auto_assigned: boolean;
          assigned_at: string;
          started_at: string | null;
          completed_at: string | null;
          status: string;
          version: number;
        };
        Insert: {
          id?: string;
          issue_id: string;
          staff_id: string;
          assigned_by?: string | null;
          is_auto_assigned?: boolean;
          assigned_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          status?: string;
          version?: number;
        };
        Update: {
          id?: string;
          issue_id?: string;
          staff_id?: string;
          assigned_by?: string | null;
          is_auto_assigned?: boolean;
          started_at?: string | null;
          completed_at?: string | null;
          status?: string;
          version?: number;
        };
        Relationships: [];
      };
      issue_verifications: {
        Row: {
          id: string;
          issue_id: string;
          verified_by: string | null;
          student_rating: number | null;
          staff_rating: number | null;
          feedback_notes: string | null;
          is_flagged_for_admin: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          verified_by?: string | null;
          student_rating?: number | null;
          staff_rating?: number | null;
          feedback_notes?: string | null;
          is_flagged_for_admin?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          verified_by?: string | null;
          student_rating?: number | null;
          staff_rating?: number | null;
          feedback_notes?: string | null;
          is_flagged_for_admin?: boolean;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          type: string;
          title: string;
          message: string;
          entity_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          type: string;
          title: string;
          message: string;
          entity_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          type?: string;
          title?: string;
          message?: string;
          entity_id?: string | null;
          is_read?: boolean;
        };
        Relationships: [];
      };
      zone_score_snapshots: {
        Row: {
          id: string;
          location_id: string;
          snapshot_date: string;
          cleanliness_score: number;
          open_issues_count: number;
          resolved_issues_count: number;
          sla_breach_rate: number;
          avg_rating: number | null;
          formula_version: string;
          metrics_breakdown: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          location_id: string;
          snapshot_date: string;
          cleanliness_score: number;
          open_issues_count: number;
          resolved_issues_count: number;
          sla_breach_rate: number;
          avg_rating?: number | null;
          formula_version: string;
          metrics_breakdown: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          location_id?: string;
          snapshot_date?: string;
          cleanliness_score?: number;
          open_issues_count?: number;
          resolved_issues_count?: number;
          sla_breach_rate?: number;
          avg_rating?: number | null;
          formula_version?: string;
          metrics_breakdown?: Json;
        };
        Relationships: [];
      };
      monthly_reports: {
        Row: {
          id: string;
          report_month: string;
          revision: number;
          campus_timezone: string;
          period_start: string;
          period_end: string;
          summary_payload: Json;
          pdf_storage_path: string | null;
          csv_storage_path: string | null;
          generated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_month: string;
          revision?: number;
          campus_timezone: string;
          period_start: string;
          period_end: string;
          summary_payload: Json;
          pdf_storage_path?: string | null;
          csv_storage_path?: string | null;
          generated_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_month?: string;
          revision?: number;
          campus_timezone?: string;
          period_start?: string;
          period_end?: string;
          summary_payload?: Json;
          pdf_storage_path?: string | null;
          csv_storage_path?: string | null;
          generated_by?: string | null;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          actor_id: string | null;
          actor_role: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          state_before: Json | null;
          state_after: Json | null;
          ip_address: string | null;
          request_id: string | null;
          is_security_critical: boolean;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          actor_role?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          state_before?: Json | null;
          state_after?: Json | null;
          ip_address?: string | null;
          request_id?: string | null;
          is_security_critical?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          actor_id?: string | null;
          actor_role?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          state_before?: Json | null;
          state_after?: Json | null;
          ip_address?: string | null;
          request_id?: string | null;
          is_security_critical?: boolean;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      check_duplicate_issue: {
        Args: {
          p_location_id: string;
          p_category: string;
        };
        Returns: {
          id: string;
          reference_number: string;
          category: string;
          description: string;
          priority: IssuePriority;
          status: IssueStatus;
          created_at: string;
        }[];
      };
      assign_issue_to_staff: {
        Args: {
          p_issue_id: string;
          p_staff_id: string;
          p_assigned_by?: string;
        };
        Returns: Json;
      };
      auto_dispatch_issue: {
        Args: {
          p_issue_id: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      issue_priority: IssuePriority;
      issue_status: IssueStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

/**
 * Standard Service Response Envelope
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  meta?: Record<string, unknown>;
}
