const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getCategories() {
  const { data, error } = await supabase
    .from('policies')
    .select('category')
    .not('category', 'is', null);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // Get unique categories with counts
  const categories = {};
  data.forEach(policy => {
    const cat = policy.category;
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  console.log('Categories in database:');
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  "${cat}": ${count}`);
    });
}

getCategories();
