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
          username: string | null;
          avatar_url: string | null;
          email: string | null;
          phone: string | null;
          total_study_minutes: number;
          streak_days: number;
          follower_count: number;
          following_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          phone?: string | null;
          total_study_minutes?: number;
          streak_days?: number;
          follower_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          email?: string | null;
          phone?: string | null;
          total_study_minutes?: number;
          streak_days?: number;
          follower_count?: number;
          following_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      creator_settings: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          username: string | null;
          bio: string | null;
          profile_image_url: string | null;
          banner_image_url: string | null;
          subject: string | null;
          categories: string[];
          is_accepting_questions: boolean;
          default_content_access: 'public' | 'subscribers' | 'tier' | 'paid';
          is_verified: boolean;
          total_subscribers: number;
          total_content_count: number;
          // P2P Payment fields
          payment_method: 'toss_id' | 'kakaopay' | 'bank_account' | null;
          toss_id: string | null;
          kakaopay_link: string | null;
          bank_name: string | null;
          bank_account: string | null;
          account_holder: string | null;
          // Alias columns (generated, read-only)
          avatar_url: string | null;
          subscriber_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name?: string | null;
          username?: string | null;
          bio?: string | null;
          profile_image_url?: string | null;
          banner_image_url?: string | null;
          subject?: string | null;
          categories?: string[];
          is_accepting_questions?: boolean;
          default_content_access?: 'public' | 'subscribers' | 'tier' | 'paid';
          is_verified?: boolean;
          total_subscribers?: number;
          total_content_count?: number;
          // P2P Payment fields
          payment_method?: 'toss_id' | 'kakaopay' | 'bank_account' | null;
          toss_id?: string | null;
          kakaopay_link?: string | null;
          bank_name?: string | null;
          bank_account?: string | null;
          account_holder?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string | null;
          username?: string | null;
          bio?: string | null;
          profile_image_url?: string | null;
          banner_image_url?: string | null;
          subject?: string | null;
          categories?: string[];
          is_accepting_questions?: boolean;
          default_content_access?: 'public' | 'subscribers' | 'tier' | 'paid';
          is_verified?: boolean;
          total_subscribers?: number;
          total_content_count?: number;
          // P2P Payment fields
          payment_method?: 'toss_id' | 'kakaopay' | 'bank_account' | null;
          toss_id?: string | null;
          kakaopay_link?: string | null;
          bank_name?: string | null;
          bank_account?: string | null;
          account_holder?: string | null;
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
          status: 'pending_payment' | 'pending_confirm' | 'completed' | 'rejected' | 'refunded' | 'pending' | 'failed';
          payment_id: string | null;
          purchased_at: string | null;
          // P2P Payment fields
          payment_confirmed_at: string | null;
          seller_confirmed_at: string | null;
          creator_revenue: number | null;
          platform_fee: number | null;
          rejection_reason: string | null;
          buyer_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          buyer_id: string;
          seller_id: string;
          amount: number;
          status?: 'pending_payment' | 'pending_confirm' | 'completed' | 'rejected' | 'refunded' | 'pending' | 'failed';
          payment_id?: string | null;
          purchased_at?: string | null;
          // P2P Payment fields
          payment_confirmed_at?: string | null;
          seller_confirmed_at?: string | null;
          creator_revenue?: number | null;
          platform_fee?: number | null;
          rejection_reason?: string | null;
          buyer_note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          buyer_id?: string;
          seller_id?: string;
          amount?: number;
          status?: 'pending_payment' | 'pending_confirm' | 'completed' | 'rejected' | 'refunded' | 'pending' | 'failed';
          payment_id?: string | null;
          purchased_at?: string | null;
          // P2P Payment fields
          payment_confirmed_at?: string | null;
          seller_confirmed_at?: string | null;
          creator_revenue?: number | null;
          platform_fee?: number | null;
          rejection_reason?: string | null;
          buyer_note?: string | null;
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
          content_type: 'video' | 'pdf' | 'image' | 'routine' | null;
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
          // Additional fields
          subject: string | null;
          grade: string | null;
          download_count: number | null;
          routine_type: string | null;
          routine_days: number | null;
          routine_items: Record<string, unknown>[] | null;
          rating_sum: number | null;
          rating_count: number | null;
          allow_preview: boolean | null;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          creator_id?: string | null;
          title: string;
          type: 'video' | 'pdf' | 'image';
          content_type?: 'video' | 'pdf' | 'image' | 'routine' | null;
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
          // Additional fields
          subject?: string | null;
          grade?: string | null;
          download_count?: number | null;
          routine_type?: string | null;
          routine_days?: number | null;
          routine_items?: Record<string, unknown>[] | null;
          rating_sum?: number | null;
          rating_count?: number | null;
          allow_preview?: boolean | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          creator_id?: string | null;
          title?: string;
          type?: 'video' | 'pdf' | 'image';
          content_type?: 'video' | 'pdf' | 'image' | 'routine' | null;
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
          // Additional fields
          subject?: string | null;
          grade?: string | null;
          download_count?: number | null;
          routine_type?: string | null;
          routine_days?: number | null;
          routine_items?: Record<string, unknown>[] | null;
          rating_sum?: number | null;
          rating_count?: number | null;
          allow_preview?: boolean | null;
        };
      };
      // DM/Messages
      dm_conversations: {
        Row: {
          id: string;
          participant1_id: string;
          participant2_id: string;
          last_message_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant1_id: string;
          participant2_id: string;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          participant1_id?: string;
          participant2_id?: string;
          last_message_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      dm_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      // Content interactions
      content_likes: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          created_at?: string;
        };
      };
      content_saves: {
        Row: {
          id: string;
          user_id: string;
          content_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content_id?: string;
          created_at?: string;
        };
      };
      // User preferences (JSONB based for flexible settings)
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          notification_settings: Json;
          privacy_settings: Json;
          account_settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          notification_settings?: Json;
          privacy_settings?: Json;
          account_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          notification_settings?: Json;
          privacy_settings?: Json;
          account_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      // Creator analytics
      content_views: {
        Row: {
          id: string;
          content_id: string;
          user_id: string | null;
          viewer_ip: string | null;
          viewer_user_agent: string | null;
          view_duration_seconds: number | null;
          is_unique: boolean;
          referrer_url: string | null;
          device_type: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          user_id?: string | null;
          viewer_ip?: string | null;
          viewer_user_agent?: string | null;
          view_duration_seconds?: number | null;
          is_unique?: boolean;
          referrer_url?: string | null;
          device_type?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          user_id?: string | null;
          viewer_ip?: string | null;
          viewer_user_agent?: string | null;
          view_duration_seconds?: number | null;
          is_unique?: boolean;
          referrer_url?: string | null;
          device_type?: string | null;
          viewed_at?: string;
        };
      };
      // Content comments
      content_comments: {
        Row: {
          id: string;
          content_id: string;
          user_id: string;
          comment_text: string;
          comment_type: 'comment' | 'question' | 'review';
          like_count: number;
          reply_count: number;
          is_pinned: boolean;
          is_reported: boolean;
          is_replied: boolean;
          is_hidden: boolean;
          parent_comment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          user_id: string;
          comment_text: string;
          comment_type?: 'comment' | 'question' | 'review';
          like_count?: number;
          reply_count?: number;
          is_pinned?: boolean;
          is_reported?: boolean;
          is_replied?: boolean;
          is_hidden?: boolean;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          user_id?: string;
          comment_text?: string;
          comment_type?: 'comment' | 'question' | 'review';
          like_count?: number;
          reply_count?: number;
          is_pinned?: boolean;
          is_reported?: boolean;
          is_replied?: boolean;
          is_hidden?: boolean;
          parent_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      comment_replies: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          reply_text: string;
          like_count: number;
          is_creator_reply: boolean;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          user_id: string;
          reply_text: string;
          like_count?: number;
          is_creator_reply?: boolean;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          user_id?: string;
          reply_text?: string;
          like_count?: number;
          is_creator_reply?: boolean;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      // QnA feature
      qna_rooms: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          subject: string | null;
          participant_count: number;
          question_count: number;
          answered_count: number;
          is_active: boolean;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          subject?: string | null;
          participant_count?: number;
          question_count?: number;
          answered_count?: number;
          is_active?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          subject?: string | null;
          participant_count?: number;
          question_count?: number;
          answered_count?: number;
          is_active?: boolean;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      qna_questions: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          question_text: string;
          question_type: string;
          image_urls: string[];
          is_answered: boolean;
          is_pinned: boolean;
          is_anonymous: boolean;
          upvote_count: number;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          question_text: string;
          question_type?: string;
          image_urls?: string[];
          is_answered?: boolean;
          is_pinned?: boolean;
          is_anonymous?: boolean;
          upvote_count?: number;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          question_text?: string;
          question_type?: string;
          image_urls?: string[];
          is_answered?: boolean;
          is_pinned?: boolean;
          is_anonymous?: boolean;
          upvote_count?: number;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      qna_answers: {
        Row: {
          id: string;
          question_id: string;
          user_id: string;
          answer_text: string;
          image_urls: string[];
          is_accepted: boolean;
          is_creator_answer: boolean;
          upvote_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          user_id: string;
          answer_text: string;
          image_urls?: string[];
          is_accepted?: boolean;
          is_creator_answer?: boolean;
          upvote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          user_id?: string;
          answer_text?: string;
          image_urls?: string[];
          is_accepted?: boolean;
          is_creator_answer?: boolean;
          upvote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      // User subscriptions (following)
      user_subscriptions: {
        Row: {
          id: string;
          subscriber_id: string;
          creator_id: string;
          is_notified: boolean;
          subscribed_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscriber_id: string;
          creator_id: string;
          is_notified?: boolean;
          subscribed_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subscriber_id?: string;
          creator_id?: string;
          is_notified?: boolean;
          subscribed_at?: string;
          updated_at?: string;
        };
      };
      // User streaks
      user_streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          total_study_days: number;
          weekly_activity: boolean[];
          monthly_activity: Json;
          last_study_date: string | null;
          streak_frozen_until: string | null;
          freeze_count_used: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          total_study_days?: number;
          weekly_activity?: boolean[];
          monthly_activity?: Json;
          last_study_date?: string | null;
          streak_frozen_until?: string | null;
          freeze_count_used?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_streak?: number;
          longest_streak?: number;
          total_study_days?: number;
          weekly_activity?: boolean[];
          monthly_activity?: Json;
          last_study_date?: string | null;
          streak_frozen_until?: string | null;
          freeze_count_used?: number;
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

// Content interaction types
export type ContentComment = Tables<'content_comments'>;
export type CommentReply = Tables<'comment_replies'>;
export type ContentView = Tables<'content_views'>;
export type ContentSave = Tables<'content_saves'>;

// QnA types
export type QnaRoom = Tables<'qna_rooms'>;
export type QnaQuestion = Tables<'qna_questions'>;
export type QnaAnswer = Tables<'qna_answers'>;

// User types
export type UserSubscription = Tables<'user_subscriptions'>;
export type UserStreak = Tables<'user_streaks'>;
export type UserPreference = Tables<'user_preferences'>;

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
