require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

async function test() {
  const { data } = await supabaseAdmin
    .from('policies')
    .select('title, slug')
    .ilike('title', '%plastic scrap%')
    .single();
  
  if (!data) {
    console.log('Policy not found in DB');
    process.exit(1);
  }

  const slug = data.slug;
  console.log('Title:', data.title);
  console.log('Slug from DB (length ' + slug.length + '):', slug);
  
  const testUrl = 'https://ppd-pink.vercel.app/policies/' + slug;
  console.log('\nTesting URL...');
  console.log(testUrl);
  
  https.get(testUrl, (res) => {
    console.log('Status code:', res.statusCode);
    if (res.statusCode === 200) {
      console.log('✅ SUCCESS - Page loads!');
    } else {
      console.log('❌ FAILED - Got ' + res.statusCode);
    }
    process.exit(0);
  }).on('error', (e) => {
    console.error('Error:', e.message);
    process.exit(1);
  });
}

test();
