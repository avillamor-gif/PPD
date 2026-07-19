const { supabaseAdmin } = require('./lib/supabase-admin');
const { createClient } = require('@supabase/supabase-js');

async function testCommentsQuery() {
  try {
    console.log('Testing comments query with supabaseAdmin...');
    
    const { data: comments, error, count } = await supabaseAdmin
      .from('comments')
      .select(`
        id,
        content,
        author_id,
        author:user_profiles(display_name),
        thread_id,
        created_at,
        is_deleted,
        vote_count,
        reply_count
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 99)
      .limit(100);

    console.log('Query error:', error);
    console.log('Count:', count);
    console.log('Comments:', comments?.length, 'results');
    if (comments?.length > 0) {
      console.log('First comment:', comments[0]);
    }
  } catch (err) {
    console.error('Caught error:', err);
  }
}

testCommentsQuery();
