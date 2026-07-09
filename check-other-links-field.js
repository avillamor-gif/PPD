import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkOtherLinksField() {
  try {
    console.log('1️⃣ Checking policies table schema...\n');

    // Query the information schema to check the column
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying policies:', error);
      return;
    }

    console.log('✅ Policies table accessible');
    console.log('Sample record keys:', Object.keys(data?.[0] || {}));

    // Check specifically for other_links
    if (data && data.length > 0) {
      const hasOtherLinks = 'other_links' in data[0];
      console.log(`\n2️⃣ Has 'other_links' column: ${hasOtherLinks ? '✅ YES' : '❌ NO'}`);
      
      if (hasOtherLinks) {
        console.log('Other links value in first record:', data[0].other_links);
      }
    }

    // List all columns
    console.log('\n3️⃣ All available columns:');
    if (data && data.length > 0) {
      Object.keys(data[0]).forEach(key => {
        console.log(`  - ${key}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkOtherLinksField();
