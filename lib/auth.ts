/**
 * Authorization Utilities
 * Helper functions for role-based access control
 */

import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/roles';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}

/**
 * Get current user with role from session
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return null;
    }

    // Fetch user profile with role
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(
        `
        id,
        display_name,
        roles (name)
      `
      )
      .eq('id', session.user.id)
      .single();

    if (error || !profile) {
      return null;
    }

    const roles = Array.isArray(profile.roles)
      ? profile.roles
      : profile.roles
        ? [profile.roles]
        : [];
    const roleName = (roles?.[0]?.name as UserRole) || UserRole.USER;

    return {
      id: session.user.id,
      email: session.user.email || '',
      role: roleName,
      displayName: profile.display_name,
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Check if user has a specific role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 5,
    [UserRole.MODERATOR]: 4,
    [UserRole.EXPERT]: 3,
    [UserRole.USER]: 2,
    [UserRole.GUEST]: 1,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: UserRole[]): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Require authentication - throws 401 if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require specific role - throws 403 if insufficient permission
 */
export async function requireRole(requiredRole: UserRole): Promise<AuthUser> {
  const user = await requireAuth();

  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.ADMIN]: 5,
    [UserRole.MODERATOR]: 4,
    [UserRole.EXPERT]: 3,
    [UserRole.USER]: 2,
    [UserRole.GUEST]: 1,
  };

  if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
    throw new Error(
      `Insufficient permissions. Required role: ${requiredRole}`
    );
  }

  return user;
}

/**
 * Require any of specified roles
 */
export async function requireAnyRole(
  roles: UserRole[]
): Promise<AuthUser> {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    throw new Error(
      `Insufficient permissions. Required role: ${roles.join(' or ')}`
    );
  }

  return user;
}

/**
 * Check ownership of resource (user can only edit their own content)
 */
export async function checkOwnership(
  resourceUserId: string
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // Admins can always edit
  if (user.role === UserRole.ADMIN) return true;

  // User can only edit their own resources
  return user.id === resourceUserId;
}

/**
 * Require ownership of resource
 */
export async function requireOwnership(
  resourceUserId: string
): Promise<AuthUser> {
  const user = await requireAuth();

  // Admins can always edit
  if (user.role === UserRole.ADMIN) return user;

  // User can only edit their own resources
  if (user.id !== resourceUserId) {
    throw new Error('You can only edit your own content');
  }

  return user;
}

/**
 * API response helper for authorization errors
 */
export function authErrorResponse(
  status: number,
  message: string
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      status,
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Parse error and return appropriate response
 */
export function handleAuthError(error: unknown): Response {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes('Authentication required')) {
    return authErrorResponse(401, 'Authentication required');
  }

  if (errorMessage.includes('Insufficient permissions')) {
    return authErrorResponse(403, errorMessage);
  }

  if (errorMessage.includes('only edit your own')) {
    return authErrorResponse(403, errorMessage);
  }

  return authErrorResponse(500, 'Internal server error');
}
