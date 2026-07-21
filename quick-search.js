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

async function find() {
  const { data } = await supabaseAdmin
    .from('policies')
    .select('title, slug')
    .ilike('title', '%plastic scrap%')
    .single();
  
  if (data) {
    console.log('Title:', data.title);
    console.log('New slug:', data.slug);
    console.log('New URL: https://ppd-pink.vercel.app/policies/' + data.slug);
  } else {
    console.log('Not found');
  }
}

find();
