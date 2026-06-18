import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url);

  // Check if this is an admin route that needs protection
  if (requestUrl.pathname.startsWith('/admin')) {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // Parse cookies from request headers
            const cookieHeader = request.headers.get('cookie') || '';
            const cookies = cookieHeader.split(';').map(c => {
              const [name, ...rest] = c.trim().split('=');
              return {
                name: name.trim(),
                value: decodeURIComponent(rest.join('=').trim()),
              };
            });
            return cookies;
          },
          setAll(cookiesToSet) {
            const response = NextResponse.next();
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
            return response;
          },
        },
      }
    );

    // Check session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
