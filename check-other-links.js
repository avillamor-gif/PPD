const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://oxonsvbvvhucxgvhghvq.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const { data, error } = await supabase
      .from('policies')
      .select('id, title, other_links, lifecycle_stage, category')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    console.log('Recent policies:');
    data.forEach(p => {
      console.log(`\n${p.id} - ${p.title}`);
      console.log(`  other_links: ${p.other_links || '(empty)'}`);
      console.log(`  lifecycle_stage: ${p.lifecycle_stage || '(empty)'}`);
      console.log(`  category: ${p.category || '(empty)'}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
