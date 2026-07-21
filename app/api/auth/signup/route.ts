import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: 'Signup is currently disabled. Please try again later.' },
    { status: 503 }
  );
}
