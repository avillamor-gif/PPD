require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  // Query the information schema to check column types
  const { data: result, error } = await supabase
    .rpc('execute_sql', {
      sql: `
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'policies'
        AND column_name IN ('id', 'slug')
      `
    })
    .catch(err => {
      console.log('RPC not available, trying direct query...');
      return null;
    });

  if (result) {
    console.log('Policy table columns:');
    result.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}${col.character_maximum_length ? ` (max ${col.character_maximum_length})` : ''}`);
    });
  } else {
    // Alternative: just show what we know
    console.log('Column types (from what we can observe):');
    
    const { data: samples } = await supabase
      .from('policies')
      .select('id, slug')
      .limit(10);
    
    console.log('\nSample data:');
    samples?.forEach(p => {
      const idLength = p.id?.length || 0;
      const slugLength = p.slug?.length || 0;
      console.log(`ID length: ${idLength}, Slug length: ${slugLength}`);
    });
  }
}

checkSchema().catch(console.error);
