// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

let supabaseClient: any = null;
let supabaseAdminClient: any = null;

// Lazy initialization pattern: Defers client creation from module import time
// to runtime (first method call), ensuring environment variables are available.
// This fixes the "supabaseKey is required" error in production deployments.
// Client for browser/client components (lazy initialization)
export const supabase = new Proxy({}, {
  get(target: any, prop: string) {
    if (!supabaseClient) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Missing Supabase URL or Anon Key');
        throw new Error('Missing Supabase configuration');
      }
      supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return (supabaseClient as any)[prop];
  }
});

// Admin client for server components (lazy initialization)
export const supabaseAdmin = new Proxy({}, {
  get(target: any, prop: string) {
    if (!supabaseAdminClient) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase URL or Service Key');
        throw new Error('Missing Supabase configuration');
      }
      supabaseAdminClient = createClient<Database>(supabaseUrl, supabaseServiceKey);
    }
    return (supabaseAdminClient as any)[prop];
  }
});

// Get current user
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Get user profile with role
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      *,
      role:roles(id, name, description)
    `)
    .eq('id', userId)
    .single();
  
  return { data, error };
}

// Update user profile
export async function updateUserProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
}

// Get user preferences
export async function getUserPreferences(userId: string) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return { data, error };
}

// Update user preferences
export async function updateUserPreferences(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('user_preferences')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  
  return { data, error };
}
