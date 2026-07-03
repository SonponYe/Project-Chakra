// Hand-written to match supabase/migrations/0001_core_schema.sql.
// Regenerate with `supabase gen types typescript` once the CLI/project is linked,
// and this file becomes redundant.

export type AdminRole = "super_admin" | "service_manager";
export type ServiceTypeStatus = "draft" | "standardized";
export type ServiceTypeArchetype =
  | "creative_portfolio"
  | "appointment_personal_care"
  | "food_craft_goods"
  | "retail_product"
  | "financial_advisory"
  | "trade_production_service";
export type WorkerStatus = "active" | "paused";
export type BookingStatus = "pending" | "accepted" | "declined" | "completed";

export type ModuleKey =
  | "gallery"
  | "offering_list"
  | "stats_track_record"
  | "case_studies"
  | "booking_availability"
  | "reviews"
  | "contact"
  | "custom_fields";

export interface ModuleConfigEntry {
  module_key: ModuleKey;
  settings?: Record<string, unknown>;
}

export interface Database {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          user_id: string;
          role: AdminRole;
          assigned_service_type_ids: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: AdminRole;
          assigned_service_type_ids?: string[] | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admins"]["Insert"]>;
        Relationships: [];
      };
      service_types: {
        Row: {
          id: string;
          name: string;
          slug: string;
          archetype: ServiceTypeArchetype;
          status: ServiceTypeStatus;
          current_version_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          archetype: ServiceTypeArchetype;
          status?: ServiceTypeStatus;
          current_version_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_types"]["Insert"]>;
        Relationships: [];
      };
      service_type_versions: {
        Row: {
          id: string;
          service_type_id: string;
          version_number: number;
          module_config: ModuleConfigEntry[];
          created_at: string;
        };
        Insert: {
          id?: string;
          service_type_id: string;
          version_number: number;
          module_config: ModuleConfigEntry[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_type_versions"]["Insert"]>;
        Relationships: [];
      };
      workers: {
        Row: {
          id: string;
          user_id: string;
          service_type_id: string;
          display_name: string;
          bio: string | null;
          status: WorkerStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          service_type_id: string;
          display_name: string;
          bio?: string | null;
          status?: WorkerStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workers"]["Insert"]>;
        Relationships: [];
      };
      worker_module_data: {
        Row: {
          id: string;
          worker_id: string;
          module_key: ModuleKey;
          data: Record<string, unknown>;
          version_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          module_key: ModuleKey;
          data: Record<string, unknown>;
          version_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["worker_module_data"]["Insert"]>;
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          worker_id: string;
          requester_user_id: string | null;
          requester_name: string;
          requester_contact: string;
          note: string | null;
          requested_slot: string;
          status: BookingStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          requester_user_id?: string | null;
          requester_name: string;
          requester_contact: string;
          note?: string | null;
          requested_slot: string;
          status?: BookingStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          worker_id: string;
          booking_id: string | null;
          reviewer_user_id: string | null;
          rating: number;
          text: string | null;
          worker_response: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          worker_id: string;
          booking_id?: string | null;
          reviewer_user_id?: string | null;
          rating: number;
          text?: string | null;
          worker_response?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
