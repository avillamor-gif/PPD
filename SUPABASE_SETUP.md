# Supabase Setup Guide

## Overview
This schema provides a complete user management and community forum system for the Plastic Policy Database, integrated with Resend for email notifications.

## Quick Setup

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com)
- Create new project
- Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env.local`

### 2. Run Schema
1. Copy all SQL from `/supabase/schema.sql`
2. In Supabase Dashboard → SQL Editor → New Query
3. Paste and execute

### 3. Set Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=your-resend-key
```

## Schema Overview

### Core Tables

#### 1. **user_profiles**
Extends Supabase `auth.users` with additional metadata
```sql
- id (UUID, references auth.users)
- full_name (TEXT)
- display_name (TEXT, required)
- avatar_url (TEXT)
- bio (TEXT)
- country_code (VARCHAR)
- organization (TEXT)
- role_id (BIGINT, foreign key to roles)
- email_verified (BOOLEAN)
```

#### 2. **roles**
Pre-configured roles:
- `admin` - Full access
- `moderator` - Forum moderation
- `expert` - Policy expert
- `user` - Regular user (default)
- `guest` - Unregistered

#### 3. **user_preferences**
User settings for notifications and preferences
```sql
- email_on_reply (BOOLEAN, default: true)
- email_on_mention (BOOLEAN, default: true)
- email_weekly_digest (BOOLEAN, default: false)
- theme_preference (light/dark/auto)
- language_preference (default: 'en')
- marketing_emails (BOOLEAN, default: false)
```

#### 4. **discussion_threads**
Forum threads per policy
```sql
- policy_id (TEXT) - references app/data/policies.ts
- title (TEXT, required)
- description (TEXT)
- author_id (UUID)
- status (open/closed/pinned/archived)
- is_pinned (BOOLEAN)
- comment_count (INT, auto-updated)
- last_comment_at (TIMESTAMP)
```

#### 5. **comments**
Nested comments with parent tracking
```sql
- thread_id (UUID)
- author_id (UUID)
- parent_comment_id (UUID) - NULL for root comments
- content (TEXT, required)
- is_edited (BOOLEAN)
- is_deleted (BOOLEAN)
- vote_count (INT, auto-updated)
- reply_count (INT, auto-updated)
```

#### 6. **comment_reactions**
Voting system (upvote/downvote/helpful)
```sql
- comment_id (UUID)
- user_id (UUID)
- reaction_type (upvote/downvote/helpful/flag)
- UNIQUE constraint on (comment_id, user_id, reaction_type)
```

#### 7. **notifications**
User notification system
```sql
- user_id (UUID)
- type (reply/mention/thread_comment/policy_update)
- title (TEXT)
- message (TEXT)
- related_comment_id (UUID)
- related_thread_id (UUID)
- related_policy_id (TEXT)
- is_read (BOOLEAN)
```

#### 8. **email_queue**
Queue for Resend email integration
```sql
- recipient_email (TEXT)
- recipient_user_id (UUID)
- email_type (verification/password_reset/comment_reply/mention/digest)
- subject (TEXT)
- template_name (TEXT)
- template_data (JSONB)
- status (pending/sent/failed/bounced)
- retry_count (INT, auto-incremented)
```

#### 9. **audit_logs**
Track admin/moderator actions
```sql
- actor_id (UUID)
- action (TEXT)
- resource_type (comment/thread/user/policy)
- resource_id (TEXT)
- changes (JSONB)
- created_at (TIMESTAMP)
```

### Security Features

#### Row Level Security (RLS)
- Users can only view/edit their own data (profiles, preferences, notifications)
- Public can read threads and comments
- Authenticated users can create content
- Authors and admins can delete content
- Admins can access audit logs and email queue

#### Authentication
- Built-in Supabase Auth integration
- Email verification tokens
- Password reset tokens
- Auth triggers auto-create profiles

### Automatic Features

#### Triggers
1. **handle_new_user** - Auto-create profile when user signs up
2. **handle_email_verified** - Update email_verified when confirmed
3. **update_thread_stats** - Auto-update comment count and last_comment_at
4. **update_comment_reply_count** - Auto-update reply counts for parent comments

#### Views
- **user_stats** - Get user activity metrics

## Next.js Integration

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js resend
```

### 2. Create Supabase Client

**lib/supabase.ts**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### 3. Example: Get Comments for Policy
```typescript
import { supabase } from '@/lib/supabase';

export async function getPolicyComments(policyId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:user_profiles(display_name, avatar_url),
      replies:comments(*)
    `)
    .eq('policy_id', policyId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false });
  
  return data;
}
```

### 4. Example: Create Comment
```typescript
export async function createComment(
  threadId: string,
  policyId: string,
  content: string,
  parentCommentId?: string
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('comments')
    .insert({
      thread_id: threadId,
      policy_id: policyId,
      author_id: user.id,
      content,
      parent_comment_id: parentCommentId,
    })
    .select();

  // Queue email notifications via Resend
  if (!error) {
    await queueNotificationEmails(threadId, user.id);
  }

  return data;
}
```

### 5. Email Integration with Resend

**lib/email.ts**
```typescript
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(userId: string, email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

  await resend.emails.send({
    from: 'noreply@plasticpolicydatabase.com',
    to: email,
    subject: 'Verify your email',
    html: `<a href="${verificationUrl}">Click here to verify your email</a>`,
  });
}

export async function sendCommentReplyNotification(commentId: string, recipientUserId: string) {
  const { data: recipient } = await supabaseAdmin
    .from('user_profiles')
    .select('*, user:auth.users(email)')
    .eq('id', recipientUserId)
    .single();

  if (!recipient?.user?.email) return;

  await resend.emails.send({
    from: 'noreply@plasticpolicydatabase.com',
    to: recipient.user.email,
    subject: 'New reply to your comment',
    html: 'Someone replied to your comment. Check it out!',
  });
}
```

## Database Queries

### Popular Comments on a Policy
```sql
SELECT c.*, up.display_name, up.avatar_url
FROM comments c
JOIN user_profiles up ON c.author_id = up.id
WHERE c.policy_id = 'viet-2023-01' AND c.is_deleted = false
ORDER BY c.vote_count DESC
LIMIT 10;
```

### Active Users (Last 30 days)
```sql
SELECT u.id, u.email, COUNT(DISTINCT c.id) as comments
FROM user_profiles u
LEFT JOIN comments c ON u.id = c.author_id AND c.created_at > now() - interval '30 days'
GROUP BY u.id
ORDER BY comments DESC;
```

### Thread with Stats
```sql
SELECT 
  t.*,
  up.display_name,
  COUNT(DISTINCT c.id) as comment_count
FROM discussion_threads t
JOIN user_profiles up ON t.author_id = up.id
LEFT JOIN comments c ON t.id = c.thread_id
WHERE t.policy_id = 'viet-2023-01'
GROUP BY t.id, up.display_name;
```

## Admin Operations

### Ban User from Commenting
```sql
UPDATE user_profiles
SET role_id = (SELECT id FROM roles WHERE name = 'guest')
WHERE id = 'user-uuid';

INSERT INTO audit_logs (actor_id, action, resource_type, resource_id)
VALUES (admin_user_id, 'ban_user', 'user', 'user-uuid');
```

### Delete Inappropriate Comment
```sql
UPDATE comments
SET is_deleted = true, deleted_at = now()
WHERE id = 'comment-uuid';

INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, changes)
VALUES (admin_user_id, 'delete_comment', 'comment', 'comment-uuid', jsonb_build_object('reason', 'inappropriate content'));
```

## Performance Optimization

### Indexes Created
- `policy_id` on discussion_threads and comments
- `author_id` on threads and comments
- `thread_id` on comments
- `created_at` descending on multiple tables
- `user_id` + `is_read` composite on notifications

### Query Tips
- Use `SELECT LIMIT` with pagination (20-50 items)
- Cache user preferences in Redis
- Use materialized views for stats
- Archive old threads after 1 year

## Testing

### Test Sign Up Flow
1. Create account via Supabase Auth
2. Check user_profiles auto-created
3. Verify email_verification_tokens entry
4. Test email verification endpoint

### Test Comment Creation
1. Create discussion thread
2. Add comment (triggers comment_count update)
3. Add reply (triggers reply_count update)
4. Verify email notification queued

## Future Enhancements
- Moderation workflows (flag content, review queue)
- Comment threading UI with nested replies
- User reputation/karma system
- Policy update subscriptions
- Weekly digest email compilation
- Search with Postgres full-text search
