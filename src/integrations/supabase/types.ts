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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      application_categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      application_reports: {
        Row: {
          application_id: string
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_reports_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_screenshots: {
        Row: {
          application_id: string
          created_at: string
          id: string
          sort_order: number
          url: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          sort_order?: number
          url: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_screenshots_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_views: {
        Row: {
          application_id: string
          created_at: string
          id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_views_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          app_url: string
          bridge_enabled: boolean
          category_id: string | null
          created_at: string
          description: string
          developer_id: string | null
          features: string[]
          icon_url: string | null
          id: string
          install_url: string | null
          is_demo: boolean
          is_featured: boolean
          is_free: boolean
          keywords: string[]
          name: string
          platforms: string[]
          privacy_url: string | null
          review_notes: string | null
          short_description: string
          slug: string
          status: Database["public"]["Enums"]["app_status"]
          updated_at: string
          version: string
          website_url: string | null
        }
        Insert: {
          app_url: string
          bridge_enabled?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          developer_id?: string | null
          features?: string[]
          icon_url?: string | null
          id?: string
          install_url?: string | null
          is_demo?: boolean
          is_featured?: boolean
          is_free?: boolean
          keywords?: string[]
          name: string
          platforms?: string[]
          privacy_url?: string | null
          review_notes?: string | null
          short_description: string
          slug: string
          status?: Database["public"]["Enums"]["app_status"]
          updated_at?: string
          version?: string
          website_url?: string | null
        }
        Update: {
          app_url?: string
          bridge_enabled?: boolean
          category_id?: string | null
          created_at?: string
          description?: string
          developer_id?: string | null
          features?: string[]
          icon_url?: string | null
          id?: string
          install_url?: string | null
          is_demo?: boolean
          is_featured?: boolean
          is_free?: boolean
          keywords?: string[]
          name?: string
          platforms?: string[]
          privacy_url?: string | null
          review_notes?: string | null
          short_description?: string
          slug?: string
          status?: Database["public"]["Enums"]["app_status"]
          updated_at?: string
          version?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "application_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          company: string | null
          created_at: string
          id: string
          is_suspended: boolean
          is_verified: boolean
          name: string
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          name: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          is_suspended?: boolean
          is_verified?: boolean
          name?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      installation_events: {
        Row: {
          application_id: string
          browser: string | null
          created_at: string
          event_type: string
          id: string
          platform: string | null
          user_id: string | null
        }
        Insert: {
          application_id: string
          browser?: string | null
          created_at?: string
          event_type: string
          id?: string
          platform?: string | null
          user_id?: string | null
        }
        Update: {
          application_id?: string
          browser?: string | null
          created_at?: string
          event_type?: string
          id?: string
          platform?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installation_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          is_suspended: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          is_suspended?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          is_suspended?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_app_library: {
        Row: {
          application_id: string
          created_at: string
          id: string
          install_state: string
          is_favourite: boolean
          last_opened_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          install_state?: string
          is_favourite?: boolean
          last_opened_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          install_state?: string
          is_favourite?: boolean
          last_opened_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_app_library_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      developer_has_published_app: {
        Args: { _developer_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_published_app_media: {
        Args: { _object_name: string }
        Returns: boolean
      }
      save_app_submission: {
        Args: { app_id?: string; payload: Json; screenshot_urls: string[] }
        Returns: string
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "developer" | "user"
      app_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "published"
        | "rejected"
        | "suspended"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["super_admin", "admin", "developer", "user"],
      app_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "published",
        "rejected",
        "suspended",
      ],
    },
  },
} as const
