import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { COUNTRIES } from '@/lib/constants';
import type { Policy } from '@/lib/types/policy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all policies
    const { data: policies = [], error } = await supabaseAdmin
      .from('policies')
      .select('*')
      .order('year', { ascending: false }) as { data: Policy[], error: any };

    if (error) {
      console.error('Error fetching policies:', error);
      return NextResponse.json(
        { error: 'Failed to fetch policies' },
        { status: 500 }
      );
    }

    const total = policies.length;
    const inForce = policies.filter((p: Policy) => p.status === "In Force").length;
    const proposedDraft = policies.filter((p: Policy) => p.status === "Proposed" || p.status === "Draft").length;
    const countriesCovered = new Set(policies.map((p: Policy) => p.country)).size;

    return NextResponse.json({
      total,
      inForce,
      proposedDraft,
      countriesCovered,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Snapshot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
