/**
 * Database Types for STUPLE
 * Full schema with creator marketplace features
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
          nickname: string | null;
          avatar_url: string | null;
          email: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          phone?: string | null;
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
          created_at?: string;
          updated_at?: string;
        };
      };
      creator_revenue_stats: {
        Row: {
          id: string;
          creator_id: string;
          month: string;
          total_revenue: number;
          subscription_revenue: number;
          content_revenue: number;
          tip_revenue: number;
          subscriber_count: number;
          new_subscribers: number;
          churned_subscribers: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          month: string;
          total_revenue?: number;
          subscription_revenue?: number;
          content_revenue?: number;
          tip_revenue?: number;
          subscriber_count?: number;
          new_subscribers?: number;
          churned_subscribers?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          month?: string;
          total_revenue?: number;
          subscription_revenue?: number;
          content_revenue?: number;
          tip_revenue?: number;
          subscriber_count?: number;
          new_subscribers?: number;
          churned_subscribers?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      creator_payouts: {
        Row: {
          id: string;
          creator_id: string;
          amount: number;
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          bank_name: string | null;
          account_number: string | null;
          account_holder: string | null;
          requested_at: string;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          amount: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          bank_name?: string | null;
          account_number?: string | null;
          account_holder?: string | null;
          requested_at?: string;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          amount?: number;
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
          bank_name?: string | null;
          account_number?: string | null;
          account_holder?: string | null;
          requested_at?: string;
          processed_at?: string | null;
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
      products: {
        Row: {
          id: string;
          creator_id: string | null;
          title: string;
          description: string | null;
          price: number;
          thumbnail_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id?: string | null;
          title: string;
          description?: string | null;
          price: number;
          thumbnail_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          title?: string;
          description?: string | null;
          price?: number;
          thumbnail_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      purchases: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          source: 'toss' | 'web';
          amount: number;
          status: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_key: string | null;
          order_id: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          source: 'toss' | 'web';
          amount: number;
          status?: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_key?: string | null;
          order_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          source?: 'toss' | 'web';
          amount?: number;
          status?: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_key?: string | null;
          order_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contents: {
        Row: {
          id: string;
          product_id: string | null;
          creator_id: string | null;
          title: string;
          type: 'video' | 'pdf' | 'image';
          content_type: 'video' | 'pdf' | 'image';
          url: string;
          thumbnail_url: string | null;
          duration: number | null;
          sort_order: number;
          is_active: boolean;
          access_level: string | null;
          price: number | null;
          view_count: number | null;
          like_count: number | null;
          is_published: boolean | null;
          published_at: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          creator_id?: string | null;
          title: string;
          type: 'video' | 'pdf' | 'image';
          content_type?: 'video' | 'pdf' | 'image';
          url: string;
          thumbnail_url?: string | null;
          duration?: number | null;
          sort_order?: number;
          is_active?: boolean;
          access_level?: string | null;
          price?: number | null;
          view_count?: number | null;
          like_count?: number | null;
          is_published?: boolean | null;
          published_at?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          creator_id?: string | null;
          title?: string;
          type?: 'video' | 'pdf' | 'image';
          content_type?: 'video' | 'pdf' | 'image';
          url?: string;
          thumbnail_url?: string | null;
          duration?: number | null;
          sort_order?: number;
          is_active?: boolean;
          access_level?: string | null;
          price?: number | null;
          view_count?: number | null;
          like_count?: number | null;
          is_published?: boolean | null;
          published_at?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_purchased: {
        Args: {
          p_product_id: string;
        };
        Returns: boolean;
      };
      get_my_purchases: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          product_id: string;
          product_title: string;
          amount: number;
          source: string;
          status: string;
          paid_at: string | null;
          created_at: string;
        }[];
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
export type Profile = Tables<'profiles'>;
export type Product = Tables<'products'>;
export type Purchase = Tables<'purchases'>;
export type Content = Tables<'contents'>;

// Creator marketplace types
export type CreatorSettings = Tables<'creator_settings'>;
export type SubscriptionTier = Tables<'subscription_tiers'>;
export type CreatorSubscription = Tables<'creator_subscriptions'>;
export type CreatorRevenueStats = Tables<'creator_revenue_stats'>;
export type CreatorPayout = Tables<'creator_payouts'>;
export type ContentPurchase = Tables<'content_purchases'>;

// Extended types with relations
export interface ProductWithContents extends Product {
  contents: Content[];
}

export interface PurchaseWithProduct extends Purchase {
  product: Product;
}

export interface ContentWithProduct extends Content {
  product: Product;
}
