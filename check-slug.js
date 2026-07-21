require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data } = await supabaseAdmin
    .from('policies')
    .select('slug')
    .ilike('title', '%plastic scrap%')
    .single();
  
  const slug = data.slug;
  console.log('Raw slug bytes:');
  for (let i = 0; i < slug.length; i++) {
    const char = slug[i];
    const code = slug.charCodeAt(i);
    if (code > 127 || code < 32) {
      console.log(`[${i}] "${char}" (code: ${code}) - NON-ASCII!`);
    }
  }
  console.log(`\nSlug (${slug.length} chars):`);
  console.log(slug);
  console.log('\nURL encoded:');
  console.log(encodeURIComponent(slug));
}

check();
