#!/usr/bin/env node

/**
 * Test script to debug form data persistence issue
 * Tests the PUT endpoint by making a direct API call
 */

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testFormPersistence() {
  try {
    console.log('🧪 Testing form data persistence...\n');

    const testData = {
      title: 'Law on Environmental Protection and Natural Resource Management (1996)',
      summary: 'Key environmental regulation',
      commencementDate: '1996-01-01',
      country: 'KH',
      level: 'National',
      category: 'Waste Management',
      keywords: 'test keywords for persistence check',
      status: 'In Force',
      authority: 'Ministry of Environment',
      link: 'https://example.com/policy.pdf',
      otherLinks: 'https://example.com/ref1, https://example.com/ref2',
      language: 'Khmer/English',
      lifecycle_stage: 'Upstream, Downstream',
    };

    console.log('📤 Sending test data:', {
      otherLinks: testData.otherLinks,
      keywords: testData.keywords,
      lifecycle_stage: testData.lifecycle_stage,
      category: testData.category,
    });

    const response = await fetch('http://localhost:3000/api/policies/kh-1996-01', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ API Error:', error);
      return;
    }

    const result = await response.json();
    console.log('\n✅ API Response:', {
      success: result.success,
      message: result.message,
      returnedOtherLinks: result.data?.other_links,
      returnedKeywords: result.data?.keywords,
      returnedLifecycleStage: result.data?.lifecycle_stage,
      returnedCategory: result.data?.category,
    });

    // Wait a moment and then query the database
    console.log('\n⏳ Waiting 2 seconds before checking database...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('id', 'kh-1996-01')
      .single();

    if (error) {
      console.error('❌ Database query error:', error);
      return;
    }

    console.log('\n📊 Database query result:');
    console.log('  Keywords:', data.keywords);
    console.log('  Other Links:', data.other_links);
    console.log('  Lifecycle Stage:', data.lifecycle_stage);
    console.log('  Category:', data.category);

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testFormPersistence();
