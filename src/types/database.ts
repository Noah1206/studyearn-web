/**
 * Database Types for Stuple Web Payment Platform
 * Auto-generated from Supabase schema
 */

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
      profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          is_creator: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_creator?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          is_creator?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      creator_settings: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          bio: string | null;
          profile_image_url: string | null;
          banner_image_url: string | null;
          is_accepting_questions: boolean;
          default_content_access: 'public' | 'subscribers' | 'tier' | 'paid';
          is_verified: boolean;
          total_subscribers: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          bio?: string | null;
          profile_image_url?: string | null;
          banner_image_url?: string | null;
          is_accepting_questions?: boolean;
          default_content_access?: 'public' | 'subscribers' | 'tier' | 'paid';
          is_verified?: boolean;
          total_subscribers?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          bio?: string | null;
          profile_image_url?: string | null;
          banner_image_url?: string | null;
          is_accepting_questions?: boolean;
          default_content_access?: 'public' | 'subscribers' | 'tier' | 'paid';
          is_verified?: boolean;
          total_subscribers?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscription_tiers: {
        Row: {
          id: string;
          creator_id: string;
          name: string;
          price: number;
          benefits: string[];
          color: string;
          sort_order: number;
          is_active: boolean;
          subscriber_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          name: string;
          price: number;
          benefits?: string[];
          color?: string;
          sort_order?: number;
          is_active?: boolean;
          subscriber_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          name?: string;
          price?: number;
          benefits?: string[];
          color?: string;
          sort_order?: number;
          is_active?: boolean;
          subscriber_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      creator_subscriptions: {
        Row: {
          id: string;
          subscriber_id: string;
          creator_id: string;
          tier_id: string;
          status: 'active' | 'cancelled' | 'expired' | 'pending' | 'paused';
          started_at: string;
          expires_at: string | null;
          cancelled_at: string | null;
          auto_renew: boolean;
          payment_method_id: string | null;
          last_payment_at: string | null;
          next_payment_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscriber_id: string;
          creator_id: string;
          tier_id: string;
          status?: 'active' | 'cancelled' | 'expired' | 'pending' | 'paused';
          started_at?: string;
          expires_at?: string | null;
          cancelled_at?: string | null;
          auto_renew?: boolean;
          payment_method_id?: string | null;
          last_payment_at?: string | null;
          next_payment_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subscriber_id?: string;
          creator_id?: string;
          tier_id?: string;
          status?: 'active' | 'cancelled' | 'expired' | 'pending' | 'paused';
          started_at?: string;
          expires_at?: string | null;
          cancelled_at?: string | null;
          auto_renew?: boolean;
          payment_method_id?: string | null;
          last_payment_at?: string | null;
          next_payment_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contents: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          content_type: 'post' | 'video' | 'audio' | 'document' | 'image' | 'live';
          content_url: string | null;
          thumbnail_url: string | null;
          content_data: Json;
          access_level: 'public' | 'subscribers' | 'tier' | 'paid';
          required_tier_id: string | null;
          price: number | null;
          view_count: number;
          like_count: number;
          comment_count: number;
          is_published: boolean;
          published_at: string | null;
          is_pinned: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          content_type: 'post' | 'video' | 'audio' | 'document' | 'image' | 'live';
          content_url?: string | null;
          thumbnail_url?: string | null;
          content_data?: Json;
          access_level?: 'public' | 'subscribers' | 'tier' | 'paid';
          required_tier_id?: string | null;
          price?: number | null;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          is_published?: boolean;
          published_at?: string | null;
          is_pinned?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          content_type?: 'post' | 'video' | 'audio' | 'document' | 'image' | 'live';
          content_url?: string | null;
          thumbnail_url?: string | null;
          content_data?: Json;
          access_level?: 'public' | 'subscribers' | 'tier' | 'paid';
          required_tier_id?: string | null;
          price?: number | null;
          view_count?: number;
          like_count?: number;
          comment_count?: number;
          is_published?: boolean;
          published_at?: string | null;
          is_pinned?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      content_purchases: {
        Row: {
          id: string;
          content_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          status: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_id: string | null;
          purchased_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          status?: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_id?: string | null;
          purchased_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          buyer_id?: string;
          seller_id?: string;
          amount?: number;
          status?: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_id?: string | null;
          purchased_at?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          merchant_uid: string;
          imp_uid: string | null;
          amount: number;
          paid_amount: number | null;
          currency: string;
          status: string;
          payment_method: string | null;
          payment_type: string;
          subscription_id: string | null;
          content_id: string | null;
          creator_id: string | null;
          tier_id: string | null;
          buyer_name: string | null;
          buyer_email: string | null;
          buyer_tel: string | null;
          card_name: string | null;
          card_number: string | null;
          card_quota: number | null;
          paid_at: string | null;
          cancelled_at: string | null;
          failed_at: string | null;
          created_at: string;
          updated_at: string;
          receipt_url: string | null;
          pg_provider: string | null;
          pg_tid: string | null;
          fail_reason: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          merchant_uid: string;
          imp_uid?: string | null;
          amount: number;
          paid_amount?: number | null;
          currency?: string;
          status?: string;
          payment_method?: string | null;
          payment_type: string;
          subscription_id?: string | null;
          content_id?: string | null;
          creator_id?: string | null;
          tier_id?: string | null;
          buyer_name?: string | null;
          buyer_email?: string | null;
          buyer_tel?: string | null;
          card_name?: string | null;
          card_number?: string | null;
          card_quota?: number | null;
          paid_at?: string | null;
          cancelled_at?: string | null;
          failed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          receipt_url?: string | null;
          pg_provider?: string | null;
          pg_tid?: string | null;
          fail_reason?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          merchant_uid?: string;
          imp_uid?: string | null;
          amount?: number;
          paid_amount?: number | null;
          currency?: string;
          status?: string;
          payment_method?: string | null;
          payment_type?: string;
          subscription_id?: string | null;
          content_id?: string | null;
          creator_id?: string | null;
          tier_id?: string | null;
          buyer_name?: string | null;
          buyer_email?: string | null;
          buyer_tel?: string | null;
          card_name?: string | null;
          card_number?: string | null;
          card_quota?: number | null;
          paid_at?: string | null;
          cancelled_at?: string | null;
          failed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          receipt_url?: string | null;
          pg_provider?: string | null;
          pg_tid?: string | null;
          fail_reason?: string | null;
        };
      };
      creator_revenue_stats: {
        Row: {
          id: string;
          creator_id: string;
          total_revenue: number;
          total_subscribers: number;
          total_content_sales: number;
          total_tips: number;
          current_month_revenue: number;
          current_month_subscribers: number;
          available_balance: number;
          last_calculated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          total_revenue?: number;
          total_subscribers?: number;
          total_content_sales?: number;
          total_tips?: number;
          current_month_revenue?: number;
          current_month_subscribers?: number;
          available_balance?: number;
          last_calculated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          total_revenue?: number;
          total_subscribers?: number;
          total_content_sales?: number;
          total_tips?: number;
          current_month_revenue?: number;
          current_month_subscribers?: number;
          available_balance?: number;
          last_calculated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      creator_payouts: {
        Row: {
          id: string;
          creator_id: string;
          amount: number;
          fee: number;
          net_amount: number;
          status: string;
          bank_code: string;
          account_number: string;
          account_holder: string;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          amount: number;
          fee?: number;
          net_amount: number;
          status?: string;
          bank_code: string;
          account_number: string;
          account_holder: string;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          amount?: number;
          fee?: number;
          net_amount?: number;
          status?: string;
          bank_code?: string;
          account_number?: string;
          account_holder?: string;
          processed_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      update_creator_revenue: {
        Args: {
          p_creator_id: string;
          p_payment_type: string;
          p_gross_amount: number;
          p_net_amount: number;
          p_payment_id: string;
        };
        Returns: void;
      };
      increment_content_sales: {
        Args: {
          p_content_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updateable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Specific table types
export type CreatorSettings = Tables<'creator_settings'>;
export type SubscriptionTier = Tables<'subscription_tiers'>;
export type CreatorSubscription = Tables<'creator_subscriptions'>;
export type Content = Tables<'contents'>;
export type ContentPurchase = Tables<'content_purchases'>;
export type Payment = Tables<'payments'>;
export type CreatorRevenueStats = Tables<'creator_revenue_stats'>;
export type CreatorPayout = Tables<'creator_payouts'>;

// Extended types with relations
export interface CreatorWithTiers extends CreatorSettings {
  tiers: SubscriptionTier[];
  contents: Content[];
}

export interface ContentWithCreator extends Content {
  creator: CreatorSettings;
}

export interface SubscriptionWithDetails extends CreatorSubscription {
  tier: SubscriptionTier;
  creator: CreatorSettings;
}

export interface PurchaseWithContent extends ContentPurchase {
  content: Content;
  payment: Payment | null;
}
