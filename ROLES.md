# Role-Based Access Control (RBAC) System

## Overview

The Plastic Policy Database uses a role-based access control system with 4 main roles plus a guest role. Each role has specific permissions and capabilities.

---

## Role Hierarchy

```
ADMIN (Level 5)
  └─ MODERATOR (Level 4)
      └─ EXPERT (Level 3)
          └─ USER (Level 2)
              └─ GUEST (Level 1)
```

Higher-level roles have access to all lower-level features plus additional capabilities.

---

## Roles & Permissions

### 1. **ADMIN** (Administrator)
**Level:** 5 (Highest)

**Description:** Full system access, user management, moderation, and analytics.

**Capabilities:**
- **User Management**
  - View all users and their profiles
  - Edit user information
  - Delete user accounts
  - Assign/change user roles
  - Suspend or ban users
  - View user activity logs

- **Policy Management**
  - Create, edit, delete policies
  - Publish or archive policies
  - View all policy submissions
  - Approve/reject policy submissions

- **Forum Management**
  - Create, edit, lock, or pin threads
  - Create, edit, delete comments
  - Moderate all discussions
  - Remove inappropriate content

- **System Administration**
  - View analytics and statistics
  - Access admin panel
  - Manage roles and permissions
  - View activity logs
  - Export database

**Access Routes:**
- `/admin`
- `/admin/users`
- `/admin/moderation`
- `/admin/submit`
- `/admin/manage`

---

### 2. **MODERATOR** (Forum Moderator)
**Level:** 4

**Description:** Forum moderation, content review, and discussion management.

**Capabilities:**
- **Forum Moderation**
  - View forum discussions
  - Create and manage own threads
  - Create and edit own comments
  - Delete inappropriate comments
  - Lock threads when needed
  - Moderate user discussions

- **Content Review**
  - Flag inappropriate content
  - Remove offensive posts
  - View and address user reports

- **Profile & Database**
  - View and edit own profile
  - Search and browse database
  - View policy details

**Restrictions:**
- Cannot create/edit/delete policies
- Cannot access user management
- Cannot access admin panel
- Cannot change user roles

**Access Routes:**
- `/profile/[id]` (own profile)
- `/admin/moderation`
- `/search`
- `/countries`

---

### 3. **EXPERT** (Policy Contributor)
**Level:** 3

**Description:** Policy expert or contributor who can submit and manage policy entries.

**Capabilities:**
- **Policy Submission**
  - Create new policy entries
  - Edit own policy submissions
  - View all policies
  - Search database

- **Forum Participation**
  - Create threads
  - Create and edit own comments
  - Delete own comments
  - Manage own discussions

- **Profile & Data**
  - View and edit own profile
  - View user statistics
  - Export search results

**Restrictions:**
- Cannot moderate forum
- Cannot manage other users' content
- Cannot access admin panel
- Cannot delete other users' policies

**Access Routes:**
- `/profile/[id]` (own profile)
- `/admin/submit`
- `/admin/manage`
- `/search`
- `/countries`

---

### 4. **USER** (Regular User)
**Level:** 2

**Description:** Regular user with discussion and database access.

**Capabilities:**
- **Forum Participation**
  - Create threads
  - Create and edit own comments
  - Delete own comments
  - Delete own threads
  - Participate in discussions

- **Database Access**
  - Search and browse policies
  - View policy details
  - View country data
  - Export search results

- **Profile**
  - View and edit own profile
  - View personal statistics
  - Follow users (if implemented)

**Restrictions:**
- Cannot create/edit policies
- Cannot moderate content
- Cannot manage other users
- Cannot access admin panel

**Access Routes:**
- `/profile/[id]` (own profile)
- `/search`
- `/countries`
- `/policies/[id]`
- `/notifications`

---

### 5. **GUEST** (Read-Only Access)
**Level:** 1 (Lowest)

**Description:** Limited read-only access to public content. No login required.

**Capabilities:**
- **Public Access**
  - View policies
  - Search database
  - View country data
  - View public user profiles

**Restrictions:**
- Cannot create content
- Cannot modify anything
- Cannot access forum discussions
- Cannot see private user information

**Access Routes:**
- `/` (home)
- `/search`
- `/countries`
- `/policies/[id]`
- `/about`

---

## Permission Matrix

| Permission | Admin | Moderator | Expert | User | Guest |
|-----------|-------|-----------|--------|------|-------|
| View Users | ✓ | ✗ | ✗ | ✗ | ✗ |
| Manage Users | ✓ | ✗ | ✗ | ✗ | ✗ |
| Change Roles | ✓ | ✗ | ✗ | ✗ | ✗ |
| View Analytics | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create Policy | ✓ | ✗ | ✓ | ✗ | ✗ |
| Edit Policy | ✓ | ✗ | ✓* | ✗ | ✗ |
| Delete Policy | ✓ | ✗ | ✗ | ✗ | ✗ |
| Moderate Content | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage Forum | ✓ | ✓ | ✗ | ✗ | ✗ |
| Create Thread | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit Thread | ✓ | ✓ | ✓ | ✓* | ✗ |
| Create Comment | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit Comment | ✓ | ✓ | ✓ | ✓* | ✗ |
| View Profile | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Profile | ✓ | ✓ | ✓ | ✓* | ✗ |
| Search DB | ✓ | ✓ | ✓ | ✓ | ✓ |

*Only own content

---

## Implementation Details

### Type-Safe Role Definitions

All role definitions are defined in `lib/roles.ts`:

```typescript
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  EXPERT = 'expert',
  USER = 'user',
  GUEST = 'guest',
}
```

### Database Storage

User roles are stored in the `user_profiles` table:

```sql
-- user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  role_id BIGINT REFERENCES roles(id),
  -- other columns...
);

-- roles table
CREATE TABLE roles (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
);
```

### Authorization Checking

**Server-Side:** Via middleware (`middleware.ts`) and API route protection (`lib/api-protection.ts`)
**Client-Side:** Via `lib/auth.ts` and `lib/roles.ts` utilities

### Protected Routes

Middleware automatically protects routes based on user role:

```typescript
const protectedRoutes = {
  '/admin': ['admin'],
  '/admin/moderation': ['admin', 'moderator'],
  '/admin/submit': ['admin', 'expert'],
  '/profile': ['user', 'expert', 'moderator', 'admin'],
};
```

---

## Common Tasks

### Check User Role
```typescript
import { getCurrentUser } from '@/lib/auth';

const user = await getCurrentUser();
if (user?.role === 'admin') {
  // Admin logic
}
```

### Protect API Route
```typescript
import { protectRouteByRole } from '@/lib/api-protection';

export async function POST(request: ProtectedRequest) {
  await protectRouteByRole(request, UserRole.ADMIN);
  // Route is now protected
}
```

### Check Ownership
```typescript
import { requireOwnership } from '@/lib/auth';

const user = await requireOwnership(resourceUserId);
// User can now edit their resource
```

### Check Permission
```typescript
import { hasPermission } from '@/lib/roles';

if (hasPermission(userRole, 'moderate_content')) {
  // Show moderation options
}
```

---

## Admin Role Assignment

**To assign a role:**

1. Go to `/admin/users`
2. Find the user
3. Click "Change Role"
4. Select new role from dropdown
5. Confirm

**Available roles:**
- Admin
- Moderator
- Expert / Contributor
- User

---

## Security Considerations

1. **Roles are checked on every request** - Both server-side (middleware) and client-side
2. **Permissions are immutable** - Defined in code, not database
3. **Ownership is enforced** - Users can only edit their own content (except admins)
4. **Role escalation is prevented** - Users cannot change their own role
5. **Session validation** - User session is validated on protected routes

---

## Future Enhancements

- [ ] Granular permission assignment
- [ ] Custom role creation
- [ ] Permission delegation
- [ ] Audit logs for role changes
- [ ] Time-based role expiration
- [ ] Two-factor authentication for admin
