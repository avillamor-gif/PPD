/**
 * API Route Protection Utilities
 * Ensures API endpoints enforce role-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { UserRole, hasPermission } from '@/lib/roles';

export interface ProtectedRequest extends NextRequest {
  userId?: string;
  userRole?: UserRole;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    displayName: string;
  };
}

/**
 * Extract user from request
 */
export async function extractUser(
  request: ProtectedRequest
): Promise<{
  userId: string;
  userRole: UserRole;
} | null> {
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

  if (!session?.user?.id) {
    return null;
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role_id, roles(name)')
    .eq('id', session.user.id)
    .single();

  const roles = Array.isArray(profile?.roles) ? profile.roles : [profile?.roles];
  const userRole = (roles?.[0]?.name as UserRole) || UserRole.USER;

  return {
    userId: session.user.id,
    userRole,
  };
}

/**
 * Protect API route - require authentication
 */
export async function protectRoute(request: ProtectedRequest): Promise<null> {
  const user = await extractUser(request);
  if (!user) {
    throw new Error('401:Unauthorized');
  }
  request.userId = user.userId;
  request.userRole = user.userRole;
  return null;
}

/**
 * Protect API route - require specific role
 */
export async function protectRouteByRole(
  request: ProtectedRequest,
  requiredRole: UserRole
): Promise<null> {
  const user = await extractUser(request);
  if (!user) {
    throw new Error('401:Unauthorized');
  }

  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 5,
    [UserRole.MODERATOR]: 4,
    [UserRole.EXPERT]: 3,
    [UserRole.USER]: 2,
    [UserRole.GUEST]: 1,
  };

  if (roleHierarchy[user.userRole] < roleHierarchy[requiredRole]) {
    throw new Error('403:Forbidden');
  }

  request.userId = user.userId;
  request.userRole = user.userRole;
  return null;
}

/**
 * Protect API route - require specific permission
 */
export async function protectRouteByPermission(
  request: ProtectedRequest,
  permission: string
): Promise<null> {
  const user = await extractUser(request);
  if (!user) {
    throw new Error('401:Unauthorized');
  }

  if (!hasPermission(user.userRole, permission)) {
    throw new Error('403:Forbidden');
  }

  request.userId = user.userId;
  request.userRole = user.userRole;
  return null;
}

/**
 * Protect API route - check ownership
 */
export async function protectRouteByOwnership(
  request: ProtectedRequest,
  resourceUserId: string
): Promise<null> {
  const user = await extractUser(request);
  if (!user) {
    throw new Error('401:Unauthorized');
  }

  // Admins can always access
  if (user.userRole === UserRole.ADMIN) {
    request.userId = user.userId;
    request.userRole = user.userRole;
    return null;
  }

  // User can only access their own resources
  if (user.userId !== resourceUserId) {
    throw new Error('403:Forbidden');
  }

  request.userId = user.userId;
  request.userRole = user.userRole;
  return null;
}

/**
 * Error response handler
 */
export function errorResponse(error: unknown): NextResponse {
  const errorStr = error instanceof Error ? error.message : String(error);
  const [status, message] = errorStr.includes(':')
    ? errorStr.split(':')
    : ['500', 'Internal Server Error'];

  const statusCode = parseInt(status) || 500;

  return NextResponse.json(
    {
      error: message || 'An error occurred',
      status: statusCode,
    },
    { status: statusCode }
  );
}

/**
 * Success response handler
 */
export function successResponse(data: unknown, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
