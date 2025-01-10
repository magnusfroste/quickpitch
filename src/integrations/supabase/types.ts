export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      air_accounts: {
        Row: {
          account: string
          account_name: string
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          account: string
          account_name: string
          created_at?: string | null
          id?: number
          user_id: string
        }
        Update: {
          account?: string
          account_name?: string
          created_at?: string | null
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      air_companies: {
        Row: {
          company_name: string | null
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      air_transactions: {
        Row: {
          account: string
          created_at: string | null
          credit: number
          date: string | null
          debit: number
          description: string | null
          id: number
          user_id: string
          ver: number | null
        }
        Insert: {
          account: string
          created_at?: string | null
          credit: number
          date?: string | null
          debit: number
          description?: string | null
          id?: number
          user_id: string
          ver?: number | null
        }
        Update: {
          account?: string
          created_at?: string | null
          credit?: number
          date?: string | null
          debit?: number
          description?: string | null
          id?: number
          user_id?: string
          ver?: number | null
        }
        Relationships: []
      }
      anavid_testdata: {
        Row: {
          age: string | null
          gender: string | null
          Id: number
          id_camera: number | null
          id_person: number | null
          leave_date: string | null
          visit_date: string | null
        }
        Insert: {
          age?: string | null
          gender?: string | null
          Id: number
          id_camera?: number | null
          id_person?: number | null
          leave_date?: string | null
          visit_date?: string | null
        }
        Update: {
          age?: string | null
          gender?: string | null
          Id?: number
          id_camera?: number | null
          id_person?: number | null
          leave_date?: string | null
          visit_date?: string | null
        }
        Relationships: []
      }
      app_visits: {
        Row: {
          app_url: string
          created_at: string | null
          id: number
          updated_at: string | null
          visit_count: number | null
        }
        Insert: {
          app_url: string
          created_at?: string | null
          id?: number
          updated_at?: string | null
          visit_count?: number | null
        }
        Update: {
          app_url?: string
          created_at?: string | null
          id?: number
          updated_at?: string | null
          visit_count?: number | null
        }
        Relationships: []
      }
      classifieds: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: number
          image_analysis_result: string | null
          image_description: string | null
          image_url: string | null
          price: number
          seller_id: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: number
          image_analysis_result?: string | null
          image_description?: string | null
          image_url?: string | null
          price: number
          seller_id: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: number
          image_analysis_result?: string | null
          image_description?: string | null
          image_url?: string | null
          price?: number
          seller_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_seller"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      favourites: {
        Row: {
          classified_id: number
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          classified_id: number
          created_at?: string | null
          id?: number
          user_id: string
        }
        Update: {
          classified_id?: number
          created_at?: string | null
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_classified"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_urls: {
        Row: {
          created_at: string | null
          endpoint: string
          id: number
          is_active: boolean | null
          nick: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: number
          is_active?: boolean | null
          nick?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: number
          is_active?: boolean | null
          nick?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          classified_id: number
          content: string
          created_at: string | null
          id: number
          receiver_id: string
          sender_id: string
        }
        Insert: {
          classified_id: number
          content: string
          created_at?: string | null
          id?: number
          receiver_id: string
          sender_id: string
        }
        Update: {
          classified_id?: number
          content?: string
          created_at?: string | null
          id?: number
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_classified"
            columns: ["classified_id"]
            isOneToOne: false
            referencedRelation: "classifieds"
            referencedColumns: ["id"]
          },
        ]
      }
      migraine_entries: {
        Row: {
          created_at: string | null
          duration_hours: number | null
          id: number
          notes: string | null
          pain_intensity: number
          pain_location: string
          triggers: string[]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_hours?: number | null
          id?: number
          notes?: string | null
          pain_intensity: number
          pain_location: string
          triggers: string[]
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_hours?: number | null
          id?: number
          notes?: string | null
          pain_intensity?: number
          pain_location?: string
          triggers?: string[]
          user_id?: string
        }
        Relationships: []
      }
      opening_balances: {
        Row: {
          account: string
          balance: number
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          account: string
          balance: number
          created_at?: string | null
          id?: number
          user_id: string
        }
        Update: {
          account?: string
          balance?: number
          created_at?: string | null
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      portfolio_cards: {
        Row: {
          created_at: string | null
          description: string
          header: string
          id: number
          image_url: string | null
          link: string
          sort_order: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          header: string
          id?: number
          image_url?: string | null
          link: string
          sort_order?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          header?: string
          id?: number
          image_url?: string | null
          link?: string
          sort_order?: number
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio_carousel: {
        Row: {
          caption: string | null
          created_at: string | null
          id: number
          image_url: string
          sort_order: number | null
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: number
          image_url: string
          sort_order?: number | null
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: number
          image_url?: string
          sort_order?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio_clicks: {
        Row: {
          clicked_at: string | null
          id: number
          project_title: string
          user_id: string | null
          visitor_ip: string | null
        }
        Insert: {
          clicked_at?: string | null
          id?: number
          project_title: string
          user_id?: string | null
          visitor_ip?: string | null
        }
        Update: {
          clicked_at?: string | null
          id?: number
          project_title?: string
          user_id?: string | null
          visitor_ip?: string | null
        }
        Relationships: []
      }
      portfolio_content: {
        Row: {
          content: Json
          content_type: string
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: Json
          content_type: string
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio_messages: {
        Row: {
          created_at: string | null
          email: string
          id: number
          message: string
          name: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          message: string
          name: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          message?: string
          name?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sellers: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          account_number: string
          created_at: string | null
          credit: number
          debit: number
          description: string | null
          id: number
          name: string
          sort_order: number | null
        }
        Insert: {
          account_number: string
          created_at?: string | null
          credit: number
          debit: number
          description?: string | null
          id?: number
          name: string
          sort_order?: number | null
        }
        Update: {
          account_number?: string
          created_at?: string | null
          credit?: number
          debit?: number
          description?: string | null
          id?: number
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_secret: {
        Args: {
          secret_name: string
        }
        Returns: Json
      }
      insert_record: {
        Args: {
          p_user_id: string
          p_record: Json
        }
        Returns: Json
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
