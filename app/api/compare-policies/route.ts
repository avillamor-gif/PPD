import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { policyIds } = await request.json();

    if (!policyIds || policyIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 policies are required for comparison' },
        { status: 400 }
      );
    }

    // Fetch policies from database
    const { data: policies, error: dbError } = await supabaseAdmin
      .from('policies')
      .select('id, title, summary, category, status, level, year, country')
      .in('id', policyIds);

    if (dbError || !policies || policies.length < 2) {
      return NextResponse.json(
        { error: 'Could not fetch policies for comparison' },
        { status: 400 }
      );
    }

    // Prepare policies for AI comparison
    const policiesText = policies
      .map((p: any) => {
        return `
Policy: ${p.title}
Country: ${p.country}
Year: ${p.year}
Status: ${p.status}
Level: ${p.level}
Category: ${p.category}
Summary: ${p.summary}
`;
      })
      .join('\n---\n');

    // Build the comparison prompt and call OpenAI
    const message = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a policy analysis expert. Compare the following plastic pollution policies and provide a structured analysis:

${policiesText}

Please provide:
1. Key Differences - What are the main differences between these policies?
2. Similarities - What do they have in common?
3. Effectiveness Assessment - Which policy appears more comprehensive or effective based on scope and approach?
4. Implementation Approach - How do their implementation strategies differ?
5. Geographic Context - How do geographic/economic differences affect these policies?

Format your response as clear sections with headers.`,
        },
      ],
    });

    const comparison = message.choices[0].message.content || '';

    return NextResponse.json({
      success: true,
      comparison,
      policies: policies.map((p: any) => ({
        id: p.id,
        title: p.title,
        country: p.country,
      })),
    });
  } catch (error) {
    console.error('Policy comparison error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: `Failed to generate policy comparison: ${errorMessage}` },
      { status: 500 }
    );
  }
}
