export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          artist: string;
          key: string;
          capo: number;
          chordpro_content: string;
          source_url: string | null;
          youtube_url: string | null;
          tags: string[] | null;
          auto_scroll_speed: number | null;
          deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          artist?: string;
          key?: string;
          capo?: number;
          chordpro_content: string;
          source_url?: string | null;
          youtube_url?: string | null;
          tags?: string[] | null;
          auto_scroll_speed?: number | null;
          deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          artist?: string;
          key?: string;
          capo?: number;
          chordpro_content?: string;
          source_url?: string | null;
          youtube_url?: string | null;
          tags?: string[] | null;
          auto_scroll_speed?: number | null;
          deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      setlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          event_date: string | null;
          notes: string | null;
          deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          event_date?: string | null;
          notes?: string | null;
          deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          event_date?: string | null;
          notes?: string | null;
          deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      setlist_items: {
        Row: {
          id: string;
          user_id: string;
          setlist_id: string;
          kind: string;
          song_id: string | null;
          label: string | null;
          position: number;
          notes: string | null;
          transpose: number | null;
          deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          setlist_id: string;
          kind?: string;
          song_id?: string | null;
          label?: string | null;
          position?: number;
          notes?: string | null;
          transpose?: number | null;
          deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          setlist_id?: string;
          kind?: string;
          song_id?: string | null;
          label?: string | null;
          position?: number;
          notes?: string | null;
          transpose?: number | null;
          deleted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
