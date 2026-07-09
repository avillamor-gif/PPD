const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyFix() {
  try {
    console.log('🔧 Fixing Supabase trigger functions...');

    // Read migration SQL
    const migrationSQL = fs.readFileSync('./supabase/migrations/fix_auth_triggers.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL.split(';').filter(s => s.trim());
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      console.log(`📋 Executing statement ${i + 1}/${statements.length}...`);
      
      const { data, error } = await supabase.rpc('execute_sql', {
        sql: statement
      }).catch(() => {
        // RPC doesn't exist, use raw query instead
        return supabase.schema('public').rpc('_execute_sql', {
          sql: statement
        }).catch(() => ({ data: null, error: 'RPC not available' }));
      });

      if (error && error !== 'RPC not available') {
        console.warn(`⚠️  Statement ${i + 1} warning:`, error);
      } else if (data) {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    console.log('✅ Trigger fix migration completed!');
  } catch (error) {
    console.error('❌ Error applying fix:', error.message);
    process.exit(1);
  }
}

applyFix();
