import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client for browser/client components
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Admin client for server components (use carefully!)
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

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
