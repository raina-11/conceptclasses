export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      begin_import: {
        Args: {
          p_byte_size: number
          p_client_request_id: string
          p_original_filename: string
        }
        Returns: {
          import_id: string
          storage_bucket: string
          storage_path: string
        }[]
      }
      claim_import: {
        Args: { p_import_id: string }
        Returns: {
          byte_size: number
          import_id: string
          import_status: string
          original_filename: string
          revision_id: string
          storage_bucket: string
          storage_path: string
        }[]
      }
      commit_parsed_import: {
        Args: {
          p_assessment: Json
          p_import_id: string
          p_normalized_hash: string
          p_parser_version: string
          p_preview_metadata: Json
          p_raw_sha256: string
          p_rows: Json
          p_validation_summary: Json
        }
        Returns: string
      }
      complete_import_parse: {
        Args: {
          p_error_summary?: Json
          p_import_id: string
          p_normalized_hash: string
          p_outcome: string
          p_parser_version: string
          p_preview_metadata?: Json
          p_raw_sha256: string
          p_validation_summary?: Json
        }
        Returns:
          | "awaiting_upload"
          | "uploaded"
          | "parsing"
          | "parsed"
          | "staged"
          | "published"
          | "duplicate"
          | "quarantined"
          | "failed"
      }
      confirm_import_upload: {
        Args: { p_import_id: string }
        Returns: undefined
      }
      import_review: {
        Args: { p_import_id: string }
        Returns: {
          created_at: string
          duplicate_of_import_id: string
          error_summary: Json
          import_id: string
          original_filename: string
          parser_version: string
          preview_metadata: Json
          requires_corrected_reupload: boolean
          revision_id: string
          revision_status: string
          row_count: number
          status: string
          uploaded_by: string
          validation_summary: Json
        }[]
      }
      my_portal_context: { Args: never; Returns: Json }
      my_students: {
        Args: never
        Returns: {
          academic_year: string
          batch_code: string
          batch_id: string
          batch_name: string
          full_name: string
          relationship: string
          roll_no: string
          student_id: string
        }[]
      }
      pending_revisions: {
        Args: never
        Returns: {
          active_revision_id: string | null
          assessment_code: string
          batch_code: string
          can_publish: boolean
          display_title: string
          import_id: string
          is_latest_revision: boolean
          original_filename: string
          parser_version: string
          revision_id: string
          revision_number: number
          row_count: number
          staged_at: string
          status_counts: Json
          subject_summaries: Json
          test_date: string
          uploader_id: string
          warnings: Json
        }[]
      }
      publication_history: {
        Args: { p_assessment_id: string }
        Returns: {
          can_restore: boolean
          is_active: boolean
          publication_id: string
          published_at: string
          published_by: string
          revision_id: string
          revision_number: number
          superseded_at: string
        }[]
      }
      publish_revision: {
        Args: {
          p_expected_active_revision_id: string | null
          p_revision_id: string
        }
        Returns: string
      }
      restore_revision: {
        Args: {
          p_expected_active_revision_id: string
          p_revision_id: string
        }
        Returns: string
      }
      set_account_status: {
        Args: { p_reason?: string; p_status: string; p_user_id: string }
        Returns: undefined
      }
      stage_qpt_import: {
        Args: { p_assessment: Json; p_import_id: string; p_rows: Json }
        Returns: string
      }
      student_results: {
        Args: { p_student_id: string; p_subject_code?: string }
        Returns: {
          assessment_code: string
          assessment_id: string
          batch_code: string
          display_title: string
          max_marks: number
          percentage: number
          qpt_number: number
          rank: number
          revision_id: string
          roll_no: string
          score: number
          status: string
          subject_code: string
          subject_name: string
          test_date: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  api: {
    Enums: {},
  },
} as const
