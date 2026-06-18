import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);

  // Admin authentication is handled client-side, so we don't need server middleware checks
  // Client-side authentication in /app/admin/page.tsx will redirect to login if needed
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
