export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string;
        };
        Update: {
          name?: string;
          description?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          country_code: string | null;
          organization: string | null;
          role_id: number;
          email_verified: boolean;
          expertise_areas: string[] | null;
          social_links: Record<string, string>;
          follower_count: number;
          following_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          display_name: string;
          avatar_url?: string;
          bio?: string;
          country_code?: string;
          organization?: string;
          role_id?: number;
          email_verified?: boolean;
          expertise_areas?: string[];
          social_links?: Record<string, string>;
          follower_count?: number;
          following_count?: number;
        };
        Update: {
          full_name?: string;
          display_name?: string;
          avatar_url?: string;
          bio?: string;
          country_code?: string;
          organization?: string;
          role_id?: number;
          email_verified?: boolean;
          expertise_areas?: string[];
          social_links?: Record<string, string>;
          follower_count?: number;
          following_count?: number;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_on_reply: boolean;
          email_on_mention: boolean;
          email_weekly_digest: boolean;
          email_policy_updates: boolean;
          theme_preference: string;
          language_preference: string;
          marketing_emails: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_on_reply?: boolean;
          email_on_mention?: boolean;
          email_weekly_digest?: boolean;
          email_policy_updates?: boolean;
          theme_preference?: string;
          language_preference?: string;
          marketing_emails?: boolean;
        };
        Update: {
          email_on_reply?: boolean;
          email_on_mention?: boolean;
          email_weekly_digest?: boolean;
          email_policy_updates?: boolean;
          theme_preference?: string;
          language_preference?: string;
          marketing_emails?: boolean;
        };
      };
      discussion_threads: {
        Row: {
          id: string;
          policy_id: string;
          title: string;
          description: string | null;
          author_id: string | null;
          status: string;
          is_pinned: boolean;
          comment_count: number;
          last_comment_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          policy_id: string;
          title: string;
          description?: string;
          author_id: string;
          status?: string;
          is_pinned?: boolean;
        };
        Update: {
          title?: string;
          description?: string;
          status?: string;
          is_pinned?: boolean;
        };
      };
      comments: {
        Row: {
          id: string;
          thread_id: string;
          policy_id: string;
          author_id: string | null;
          parent_comment_id: string | null;
          content: string;
          is_edited: boolean;
          edited_at: string | null;
          is_deleted: boolean;
          deleted_at: string | null;
          vote_count: number;
          reply_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          thread_id: string;
          policy_id: string;
          author_id: string;
          parent_comment_id?: string;
          content: string;
        };
        Update: {
          content?: string;
          is_edited?: boolean;
          is_deleted?: boolean;
        };
      };
      comment_reactions: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          reaction_type: string;
          created_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
          reaction_type: string;
        };
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          related_comment_id: string | null;
          related_thread_id: string | null;
          related_policy_id: string | null;
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          title: string;
          message?: string;
          related_comment_id?: string;
          related_thread_id?: string;
          related_policy_id?: string;
          action_url?: string;
        };
        Update: {
          is_read?: boolean;
          read_at?: string;
        };
      };
      email_queue: {
        Row: {
          id: string;
          recipient_email: string;
          recipient_user_id: string | null;
          email_type: string;
          subject: string;
          template_name: string;
          template_data: Record<string, any> | null;
          status: string;
          retry_count: number;
          max_retries: number;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          recipient_email: string;
          recipient_user_id?: string;
          email_type: string;
          subject: string;
          template_name: string;
          template_data?: Record<string, any>;
        };
        Update: {
          status?: string;
          retry_count?: number;
          error_message?: string;
          sent_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          changes: Record<string, any> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          actor_id?: string;
          action: string;
          resource_type: string;
          resource_id: string;
          changes?: Record<string, any>;
          ip_address?: string;
          user_agent?: string;
        };
        Update: never;
      };
      email_verification_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          email: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          token: string;
          email: string;
          expires_at: string;
        };
        Update: never;
      };
      password_reset_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          token: string;
          expires_at: string;
        };
        Update: never;
      };
    };
    Views: {
      user_stats: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          role: string;
          thread_count: number;
          comment_count: number;
          last_activity_at: string | null;
          created_at: string;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
  };
};
