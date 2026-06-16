// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/types/database';

let supabaseAdminClient: any = null;

// Admin client for server components (lazy initialization)
// This module is only imported in server-side contexts (API routes and lib/email.ts)
// so it will never be bundled for the client
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
