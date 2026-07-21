const { supabaseAdmin } = require('./lib/supabase-admin');

async function findPolicy() {
  try {
    // Search for policies with "plastic scrap" in the title
    const { data, error } = await supabaseAdmin
      .from('policies')
      .select('id, title, slug')
      .ilike('title', '%plastic scrap%')
      .limit(10);

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    console.log('Found policies:');
    data.forEach((policy) => {
      console.log(`
Title: ${policy.title}
Slug: ${policy.slug}
Slug length: ${policy.slug.length}
URL: https://ppd-pink.vercel.app/policies/${policy.slug}
---`);
    });

    // Also check the exact truncated one
    const truncated = 'plastic-scrap-import-control-policydepartment-of-foreign-trade-ministry-of-comme';
    const { data: bySlug, error: slugError } = await supabaseAdmin
      .from('policies')
      .select('id, title, slug')
      .eq('slug', truncated)
      .single();

    if (!slugError && bySlug) {
      console.log('\nFound by truncated slug:');
      console.log('Title:', bySlug.title);
      console.log('Slug:', bySlug.slug);
    } else {
      console.log('\nNo policy with truncated slug found');
    }
  } catch (err) {
    console.error('Caught error:', err);
  }
}

findPolicy();
