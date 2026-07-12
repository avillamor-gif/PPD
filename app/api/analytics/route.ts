import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
  try {
    // Get all policies for analytics
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('policies')
      .select('*');

    if (policiesError) throw policiesError;

    // Get policy status history for trends
    const { data: statusHistory, error: historyError } = await supabaseAdmin
      .from('policy_status_history')
      .select('*')
      .order('change_date', { ascending: true });

    if (historyError) throw historyError;

    // Get discussions and comments
    const { count: totalDiscussions } = await supabaseAdmin
      .from('discussion_threads')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    const { count: totalComments } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false);

    // Get user count
    const { count: totalUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Build analytics data
    const analytics = {
      summary: {
        totalPolicies: policies?.length || 0,
        totalDiscussions: totalDiscussions || 0,
        totalComments: totalComments || 0,
        totalUsers: totalUsers || 0,
      },
      policyByStatus: getPolicyByStatus(policies || []),
      policyByCountry: getPolicyByCountry(policies || []),
      policyByCategory: getPolicyByCategory(policies || []),
      policyByYear: getPolicyByYear(policies || []),
      policyByLifecycleStage: getPolicyByLifecycleStage(policies || []),
      policyByLevel: getPolicyByLevel(policies || []),
      statusTrends: getStatusTrends(statusHistory || []),
      topCountries: getTopCountries(policies || []),
      topCategories: getTopCategories(policies || []),
    };

    return NextResponse.json(analytics);
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

function getPolicyByStatus(policies: any[]) {
  const grouped = policies.reduce((acc, p) => {
    const status = p.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped)
    .map(([status, count]) => ({ status, count: count as number }))
    .sort((a, b) => b.count - a.count);
}

function getPolicyByCountry(policies: any[]) {
  const grouped = policies.reduce((acc, p) => {
    const country = p.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped)
    .map(([country, count]) => ({ country, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function getPolicyByCategory(policies: any[]) {
  const grouped: Record<string, number> = {};
  
  // Split comma-separated categories and count individual occurrences
  policies.forEach(p => {
    if (p.category) {
      const categories = p.category.split(',').map((cat: string) => cat.trim());
      categories.forEach((cat: string) => {
        grouped[cat] = (grouped[cat] || 0) + 1;
      });
    }
  });

  return Object.entries(grouped)
    .map(([category, count]) => ({ category, count: count as number }))
    .sort((a, b) => b.count - a.count);
}

function getPolicyByYear(policies: any[]) {
  const grouped = policies.reduce((acc, p) => {
    const year = p.year || 0;
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return Object.entries(grouped)
    .map(([year, count]) => ({ year: parseInt(year), count: count as number }))
    .sort((a, b) => a.year - b.year);
}

function getPolicyByLifecycleStage(policies: any[]) {
  const grouped = policies.reduce((acc, p) => {
    const stage = p.lifecycle_stage || 'Unknown';
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped)
    .map(([stage, count]) => ({ stage, count: count as number }))
    .sort((a, b) => b.count - a.count);
}

function getPolicyByLevel(policies: any[]) {
  const grouped = policies.reduce((acc, p) => {
    const level = p.level || 'Unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped)
    .map(([level, count]) => ({ level, count: count as number }))
    .sort((a, b) => b.count - a.count);
}

function getStatusTrends(statusHistory: any[]) {
  const grouped = statusHistory.reduce((acc, entry) => {
    const year = new Date(entry.change_date).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return Object.entries(grouped)
    .map(([year, count]) => ({ year: parseInt(year), count: count as number }))
    .sort((a, b) => a.year - b.year);
}

function getTopCountries(policies: any[]) {
  const grouped = policies.reduce((acc, p) => {
    const country = p.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped)
    .map(([country, count]) => ({ country, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function getTopCategories(policies: any[]) {
  const grouped: Record<string, number> = {};
  
  // Split comma-separated categories and count individual occurrences
  policies.forEach(p => {
    if (p.category) {
      const categories = p.category.split(',').map((cat: string) => cat.trim());
      categories.forEach((cat: string) => {
        grouped[cat] = (grouped[cat] || 0) + 1;
      });
    }
  });

  return Object.entries(grouped)
    .map(([category, count]) => ({ category, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
