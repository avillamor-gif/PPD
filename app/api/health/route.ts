import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return Response.json({
        status: 'error',
        message: 'Missing Supabase credentials',
        url: supabaseUrl ? 'present' : 'missing',
        key: supabaseKey ? 'present' : 'missing',
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    const { data, error } = await supabase.auth.getSession();
    
    return Response.json({
      status: 'success',
      message: 'Connected to Supabase',
      session: data?.session ? 'has session' : 'no session',
      error: error ? error.message : null,
    });
  } catch (err) {
    return Response.json({
      status: 'error',
      message: (err as Error).message,
    }, { status: 500 });
  }
}
