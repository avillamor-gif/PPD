import { supabaseAdmin } from "./lib/supabase-admin.ts";

async function checkInstrument() {
  const { data: policies, error } = await supabaseAdmin
    .from('policies')
    .select('id, title, instrument, category, status');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total policies: ${policies.length}\n`);

  const missing = policies.filter((p) => !p.instrument || p.instrument.trim() === '');
  console.log(`Policies missing "instrument": ${missing.length}`);
  
  if (missing.length > 0) {
    console.log('\nPolicies missing instrument data:');
    missing.forEach((p) => {
      console.log(`- ${p.id}: "${p.title}"`);
      console.log(`  Category: ${p.category}`);
      console.log(`  Status: ${p.status}\n`);
    });
  }

  const withInstrument = policies.filter((p) => p.instrument && p.instrument.trim() !== '');
  console.log(`\nPolicies with "instrument": ${withInstrument.length}`);
}

checkInstrument();
