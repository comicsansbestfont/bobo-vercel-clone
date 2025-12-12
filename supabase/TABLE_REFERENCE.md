# Supabase table guide

This document explains what each Supabase table/view in the project is for and notes where the application code currently uses it.

## Core chat tables

- **users** – single-user MVP account with timestamps; referenced whenever the default user ID is loaded. The Next.js data layer fetches the default user and relies on the `DEFAULT_USER_ID` constant. 【F:supabase/migrations/20250122000000_initial_schema.sql†L16-L124】【F:lib/db/queries.ts†L40-L120】
- **projects** – workspaces that group chats; nullable `project_id` on chats allows standalone conversations. Project queries populate the sidebar lists and stats views. 【F:supabase/migrations/20250122000000_initial_schema.sql†L34-L91】【F:lib/db/queries.ts†L101-L130】
- **chats** – individual conversations tied to a user (and optionally a project) with model metadata and `last_message_at` for sorting. Chat CRUD helpers read/write this table before streaming messages. 【F:supabase/migrations/20250122000000_initial_schema.sql†L58-L91】【F:lib/db/queries.ts†L267-L375】
- **messages** – ordered chat messages with JSONB content and token counts. Message persistence, partial saves, and finalization all operate here. 【F:supabase/migrations/20250122000000_initial_schema.sql†L92-L127】【F:lib/db/queries.ts†L1387-L1444】
- **message_continuations** – stores resumable response state (continuation token, accumulated text/parts, iteration metadata, expiry). Used by progressive response saving to recover timed-out generations. 【F:lib/db/types.ts†L213-L239】【F:lib/db/queries.ts†L1294-L1444】

## Memory system tables

- **memory_entries** – normalized long-term memory facts with categories, confidence, temporal markers, embeddings, and dedup hashes. Memory extraction/dedup flows read and write here, and cron consolidation updates or archives rows. 【F:supabase/migrations/20251201000000_m3_phase2_memory_entries.sql†L2-L118】【F:lib/memory/deduplicator.ts†L36-L179】【F:app/api/cron/consolidate-memories/route.ts†L141-L220】
- **memory_consolidation_log** – audit trail for consolidation runs (counts of merged/archived/updated items). The cron job records a log entry after each maintenance pass. 【F:supabase/migrations/20251201000000_m3_phase2_memory_entries.sql†L69-L77】【F:app/api/cron/consolidate-memories/route.ts†L164-L175】
- **memory_suggestions** – pending suggestions before promotion to long-term memory; includes category, confidence, source chat, and status. The API surfaces pending suggestions and accept/dismiss flows mutate this table. 【F:supabase/migrations/20251208000000_memory_suggestions.sql†L4-L47】【F:app/api/memory/suggestions/route.ts†L5-L20】【F:app/api/memory/suggestions/[id]/accept/route.ts†L9-L47】
- **memory_settings** – per-user toggles and budgets for auto-extraction and token use. The memory settings API reads and updates these controls. 【F:supabase/migrations/20251201000000_m3_phase2_memory_entries.sql†L79-L118】【F:app/api/memory/settings/route.ts†L5-L43】
- **thought_threads** – groups related memories for the “thinking partner” features; `memory_entries.thread_id` references this table with `ON DELETE SET NULL`. Currently defined and indexed but not yet consumed by app logic. 【F:supabase/migrations/20251210000002_m313_thought_threads.sql†L4-L46】【F:supabase/migrations/20251210000001_add_memory_type_tag_filters.sql†L17-L42】

## Profile tables

- **user_profiles** – manual profile layer (bio/background/preferences/technical context) keyed one-to-one with users. The data layer can fetch and upsert the default user’s profile. 【F:supabase/migrations/20251124000000_m3_phase1_user_profiles.sql†L13-L57】【F:lib/db/queries.ts†L57-L99】

## Views and derived relations

- **chats_with_projects** (view) – joins chats with optional project metadata for listing conversations alongside their project names. Used by list queries to avoid extra client-side joins. 【F:supabase/migrations/20250122000002_update_schema_milestone1.sql†L175-L210】【F:lib/db/queries.ts†L213-L250】
- **projects_with_stats** (view) – aggregates chat counts and last activity per project to power the project list UI. 【F:supabase/migrations/20250122000002_update_schema_milestone1.sql†L119-L174】【F:lib/db/queries.ts†L123-L176】

## Usage audit summary

- Tables actively exercised by the app today: users, projects, chats, messages, message_continuations, memory_entries, memory_consolidation_log, memory_suggestions, memory_settings, user_profiles, chats_with_projects, projects_with_stats.
- The `thought_threads` table is provisioned with RLS and a foreign key from `memory_entries.thread_id` but no current read/write paths exist yet; it remains ready for future thinking-partner features.
- No additional Supabase tables are referenced in the codebase beyond the ones listed above, so there are no orphaned tables being unintentionally queried.
