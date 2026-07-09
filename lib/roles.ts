/**
 * Role-Based Access Control (RBAC) System
 * 
 * Roles hierarchy:
 * 1. ADMIN - Full system access, user management, moderation
 * 2. MODERATOR - Forum moderation, content review
 * 3. EXPERT - Contributor, can submit policies
 * 4. USER - Regular user, basic access
 * 5. GUEST - No authentication required
 */

export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  EXPERT = 'expert',
  USER = 'user',
  GUEST = 'guest',
}

/**
 * Role Permissions Matrix
 * Defines what each role can do
 */
export const rolePermissions: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    // User Management
    'view_users',
    'edit_users',
    'delete_users',
    'assign_roles',
    'suspend_users',
    'ban_users',
    
    // Policy Management
    'create_policy',
    'edit_policy',
    'delete_policy',
    'publish_policy',
    'archive_policy',
    
    // Forum Management
    'view_forum',
    'create_thread',
    'edit_thread',
    'delete_thread',
    'lock_thread',
    'pin_thread',
    'create_comment',
    'edit_comment',
    'delete_comment',
    'moderate_comments',
    
    // Moderation
    'moderate_content',
    'flag_content',
    'remove_content',
    'view_reports',
    
    // System
    'view_analytics',
    'access_admin_panel',
    'manage_roles',
    'view_activity_logs',
    'export_data',
  ],

  [UserRole.MODERATOR]: [
    // Forum Management
    'view_forum',
    'create_thread',
    'edit_thread',
    'edit_own_thread',
    'create_comment',
    'edit_comment',
    'edit_own_comment',
    'delete_own_comment',
    'moderate_comments',
    
    // Moderation
    'moderate_content',
    'flag_content',
    'remove_content',
    'view_reports',
    'lock_thread',
    
    // Policy Viewing
    'view_policy',
    
    // Profile
    'view_profile',
    'edit_own_profile',
  ],

  [UserRole.EXPERT]: [
    // Policy Submission
    'create_policy',
    'edit_policy',
    'edit_own_policy',
    'view_policy',
    
    // Forum Participation
    'view_forum',
    'create_thread',
    'create_comment',
    'edit_own_comment',
    'delete_own_comment',
    'edit_own_thread',
    
    // Profile
    'view_profile',
    'edit_own_profile',
    
    // Database
    'view_database',
    'search_policies',
    'export_results',
  ],

  [UserRole.USER]: [
    // Basic Forum Access
    'view_forum',
    'create_thread',
    'create_comment',
    'edit_own_comment',
    'delete_own_comment',
    'edit_own_thread',
    'delete_own_thread',
    
    // Database Access
    'view_database',
    'search_policies',
    'view_policy',
    
    // Profile
    'view_profile',
    'edit_own_profile',
    'view_statistics',
  ],

  [UserRole.GUEST]: [
    // Read-only access
    'view_database',
    'view_policy',
    'search_policies',
    'view_public_profiles',
  ],
};

/**
 * Role Hierarchy (for checking superior roles)
 */
export const roleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMIN]: 5,
  [UserRole.MODERATOR]: 4,
  [UserRole.EXPERT]: 3,
  [UserRole.USER]: 2,
  [UserRole.GUEST]: 1,
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(userRole: UserRole, permission: string): boolean {
  return rolePermissions[userRole]?.includes(permission) || false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: UserRole,
  permissions: string[]
): boolean {
  return permissions.some((p) => hasPermission(userRole, p));
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(
  userRole: UserRole,
  permissions: string[]
): boolean {
  return permissions.every((p) => hasPermission(userRole, p));
}

/**
 * Check if a role is superior to another
 */
export function isRoleSuperior(
  userRole: UserRole,
  comparisonRole: UserRole
): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[comparisonRole];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.MODERATOR]: 'Moderator',
    [UserRole.EXPERT]: 'Expert / Contributor',
    [UserRole.USER]: 'Regular User',
    [UserRole.GUEST]: 'Guest',
  };
  return displayNames[role];
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    [UserRole.ADMIN]:
      'Full system access, user management, moderation, and analytics',
    [UserRole.MODERATOR]:
      'Forum moderation, content review, and discussion management',
    [UserRole.EXPERT]:
      'Policy expert, can submit and manage policy entries',
    [UserRole.USER]: 'Regular user with discussion and database access',
    [UserRole.GUEST]: 'Limited read-only access to public content',
  };
  return descriptions[role];
}

/**
 * Format role list for display
 */
export function formatRoles(roles: UserRole[]): string {
  return roles.map(getRoleDisplayName).join(', ');
}
