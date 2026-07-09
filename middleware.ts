import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Role-Based Access Control Middleware
 * Protects routes based on user roles:
 * - ADMIN: /admin, /admin/users, /admin/moderation, etc
 * - MODERATOR: /admin/moderation
 * - EXPERT: /admin/submit (policy submission)
 * - USER: /profile, /notifications
 * - GUEST: public routes only
 */

const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/verify',
  '/auth/verify-pending',
  '/auth/set-password',
  '/auth/callback',
  '/search',
  '/countries',
  '/about',
  '/policies',
  '/health',
];

const protectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/admin/users': ['admin'],
  '/admin/moderation': ['admin', 'moderator'],
  '/admin/submit': ['admin', 'expert'],
  '/admin/manage': ['admin', 'expert'],
  '/notifications': ['user', 'expert', 'moderator', 'admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Allow profile routes - handle auth on client side
  if (pathname.startsWith('/profile/')) {
    return NextResponse.next();
  }

  // Get session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if no session
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Get user role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('roles(name)')
    .eq('id', session.user.id)
    .single();

  const roles = Array.isArray(profile?.roles)
    ? profile.roles
    : profile?.roles
      ? [profile.roles]
      : [];
  const userRole = roles?.[0]?.name || 'user';

  // Check if route is protected
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      if (!allowedRoles.includes(userRole)) {
        // Redirect to home if insufficient permissions
        return NextResponse.redirect(new URL('/', request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
