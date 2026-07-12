import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pnsaqfzkwvlyaqftnsai.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuc2FxZnprd3ZseWFxZnRuc2FpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4MTUwNTcsImV4cCI6MjAzNTM5MTA1N30.R_eWjgKuUvhYsmMlRh-CtNGpOGSsVCc8sT-Z7dITDiE'
);

async function checkInstrument() {
  const { data: policies, error } = await supabase
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
      console.log(`  - "${p.title}"`);
      console.log(`    Category: ${p.category}`);
      console.log(`    Status: ${p.status}\n`);
    });
  } else {
    console.log('\n✅ All policies have instrument data!');
  }

  const withInstrument = policies.filter((p) => p.instrument && p.instrument.trim() !== '');
  console.log(`Policies with "instrument": ${withInstrument.length}`);
}

checkInstrument();
