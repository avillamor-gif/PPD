import { NextRequest, NextResponse } from 'next/server';

/**
 * Simplified Middleware - primarily for allowing profile routes and public routes
 * Auth checks are handled on the client side for protected routes
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

  // Allow admin routes - handle auth on client side
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow notifications - handle auth on client side
  if (pathname.startsWith('/notifications')) {
    return NextResponse.next();
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
