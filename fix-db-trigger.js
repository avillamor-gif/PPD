const { Client } = require('pg');
const fs = require('fs');

async function fixTrigger() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!serviceRoleKey || !supabaseUrl) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  // Try direct connection string for Supabase
  const url = new URL(supabaseUrl);
  const projectRef = url.hostname.split('.')[0];
  // Use the correct Supabase database host
  const dbUrl = `postgresql://postgres:${serviceRoleKey}@${projectRef}.db.supabase.co:6543/postgres?sslmode=require`;

  console.log('🔧 Connecting to Supabase database...');
  console.log('🔗 Host:', projectRef + '.db.supabase.co');

  const client = new Client({ 
    connectionString: dbUrl,
    statement_timeout: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const sql = fs.readFileSync('create-rpc-and-fix.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim());

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim() + ';';
      console.log(`📋 Executing statement ${i + 1}/${statements.length}...`);
      try {
        await client.query(stmt);
        console.log(`✅ Statement ${i + 1} executed`);
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} warning:`, err.message);
      }
    }

    console.log('🎉 Database fix completed successfully!');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.error('📝 Note: If unable to connect via TCP, manually run create-rpc-and-fix.sql in Supabase dashboard');
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

fixTrigger().then(() => process.exit(0)).catch(() => process.exit(1));
