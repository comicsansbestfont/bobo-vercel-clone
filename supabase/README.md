# Supabase Database Setup

This directory contains the database schema and migrations for the Bobo AI Chatbot.

## Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name: `bobo-ai-chatbot`
4. Set a strong database password (save it!)
5. Select region closest to you
6. Wait for project to be created (~2 minutes)

### 2. Get API Keys

1. In your Supabase project, go to **Settings** → **API**
2. Copy the following and add to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Keep secret!
```

### 3. Run Migration

**Option A: Via Supabase Dashboard (Easiest)**

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy the entire contents of `migrations/20250122000000_initial_schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Ctrl+Enter)
6. Verify success message: "Success. No rows returned"

**Option B: Via Supabase CLI**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

### 4. Verify Setup

Run this query in the SQL Editor to verify everything was created:

```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check default user was created
SELECT * FROM users;

-- Expected result: 1 user with email 'user@bobo.ai'
```

### 5. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

## Database Schema Overview

### Tables

#### `users`
- **Purpose:** User accounts (single user for MVP)
- **Key Fields:** id, email, name
- **Note:** Pre-seeded with one default user

#### `projects`
- **Purpose:** Workspaces for organizing chats
- **Key Fields:** id, user_id, name, description
- **Relationships:** One user has many projects

#### `chats`
- **Purpose:** Individual conversations
- **Key Fields:** id, user_id, project_id (nullable), title, model
- **Relationships:**
  - One user has many chats
  - One project has many chats (optional)
  - Standalone chats have `project_id = NULL`

#### `messages`
- **Purpose:** Individual messages within chats
- **Key Fields:** id, chat_id, role, content (JSONB), sequence_number
- **Relationships:** One chat has many messages

### Key Features

**Automatic Timestamps**
- `created_at` and `updated_at` managed automatically
- `last_message_at` on chats updates when messages are added

**Auto-Generated Chat Titles**
- First user message (up to 50 chars) becomes chat title
- Triggers automatically on message insert

**Flexible Message Storage**
- Content stored as JSONB to match Vercel AI SDK format
- Supports: text, reasoning, sources, tool results

**Soft Foreign Keys**
- Deleting a project sets `project_id = NULL` on chats (doesn't delete chats)
- Deleting a chat cascades to messages

**Row Level Security (RLS)**
- Enabled on all tables
- Currently permissive for single-user MVP
- Ready for multi-user with minimal changes

## Default User

The migration creates one default user:

```
ID:    f47ac10b-58cc-4372-a567-0e02b2c3d479
Email: user@bobo.ai
Name:  Bobo User
```

Use this user ID in all API calls for now.

## Common Queries

### Get all projects with chat counts

```sql
SELECT * FROM projects_with_stats
ORDER BY last_activity_at DESC NULLS LAST;
```

### Get all chats (with or without projects)

```sql
SELECT * FROM chats_with_projects
ORDER BY last_message_at DESC;
```

### Get chats in a specific project

```sql
SELECT * FROM chats
WHERE project_id = 'your-project-id'
ORDER BY last_message_at DESC;
```

### Get standalone chats (not in any project)

```sql
SELECT * FROM chats
WHERE project_id IS NULL
ORDER BY last_message_at DESC;
```

### Get messages for a chat

```sql
SELECT id, role, content, created_at
FROM messages
WHERE chat_id = 'your-chat-id'
ORDER BY sequence_number;
```

### Get most recent chats across all projects

```sql
SELECT
  c.id,
  c.title,
  c.last_message_at,
  p.name AS project_name,
  (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) AS message_count
FROM chats c
LEFT JOIN projects p ON c.project_id = p.id
ORDER BY c.last_message_at DESC
LIMIT 10;
```

## Data Migration (From Mock to Real)

If you have existing mock data you want to preserve:

```sql
-- Example: Import a project
INSERT INTO projects (user_id, name, description)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'E-Commerce Redesign',
  'Frontend architecture project'
);

-- Example: Import a chat
INSERT INTO chats (user_id, project_id, title, model)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'project-id-from-above',
  'Product Page Layout',
  'openai/gpt-4o'
);
```

## Troubleshooting

### Migration fails with "extension uuid-ossp does not exist"

This shouldn't happen on Supabase, but if it does:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### RLS blocking queries

For development, you can temporarily disable RLS:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

**⚠️ Don't do this in production!**

### Check if migration ran successfully

```sql
-- Should show 4 tables
SELECT COUNT(*) FROM information_schema.tables
WHERE table_schema = 'public';

-- Should show 1 user
SELECT COUNT(*) FROM users;
```

## Next Steps

After setting up the database:

1. ✅ Create `lib/db/client.ts` - Supabase client wrapper
2. ✅ Create `lib/db/queries.ts` - Database query functions
3. ✅ Create `lib/db/types.ts` - TypeScript types
4. ✅ Build API routes for projects and chats
5. ✅ Replace mock data in components

## Useful Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Client Library](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
