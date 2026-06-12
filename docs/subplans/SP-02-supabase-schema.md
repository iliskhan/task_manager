# SP-02 Supabase Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps should use checkbox syntax for tracking during execution.

**Status:** Implemented and verified
**Master references:** `MP-02`, `MP-03`, `MP-06`, `MP-07`, `MP-08`, `MP-09`, `MP-10`, `MP-12`, `MP-13`, `MP-14`, `MP-15`
**Depends on:** `SP-01-foundation.md`
**Goal:** Create the Supabase local backend foundation for the task manager, including schema migrations, Row Level Security, local seed data, database tests, and generated TypeScript database types.
**Architecture:** Supabase Postgres is the primary data-security boundary for browser-accessible data, with RLS policies enforcing workspace membership and owner-only membership management. The React app remains decoupled from Supabase in this subplan except for generated database types under `src/lib/supabase`; SP-03 will add the client and auth flows.
**Tech Stack:** Supabase CLI, Supabase Auth schema, Postgres, SQL migrations, Row Level Security, pgTAP, TypeScript generated database types.

---

## Scope

### In Scope

- Add Supabase CLI project structure for local development.
- Create the initial database migration for `MP-08` core tables:
  - `profiles`
  - `workspaces`
  - `workspace_members`
  - `projects`
  - `tasks`
  - `labels`
  - `task_labels`
  - `project_visits`
  - `activity_events`
- Add required constraints, foreign keys, timestamps, indexes, and update triggers.
- Enable RLS on every browser-accessible table.
- Add RLS helper functions and policies that implement `MP-03` and `MP-09`.
- Add local seed data for one workspace with an owner, a member, projects, tasks, labels, project visits, and activity events.
- Add pgTAP database tests for schema integrity and the highest-risk RLS paths from `MP-12`.
- Generate TypeScript database types into `src/lib/supabase/database.types.ts`.

### Out Of Scope

- Frontend Supabase client setup and environment variables.
- Auth screens, protected routes, session persistence, and workspace bootstrap UI.
- Edge Function implementation for `add-workspace-member`.
- Production Supabase project linking, remote migrations, or deployment.
- Realtime, Storage, comments, notifications, attachments, custom statuses, sprints, billing, and multi-workspace switching.
- Frontend query hooks, mutations, project CRUD screens, Kanban drag-and-drop, and calendar/statistics data wiring.

## Files And Responsibilities

- `supabase/config.toml`: local Supabase CLI configuration created by `npx supabase init`.
- `supabase/migrations/202606070001_init_task_manager_schema.sql`: schema, constraints, indexes, triggers, RLS helper functions, and RLS policies.
- `supabase/seed.sql`: deterministic local development data for one workspace and two users.
- `supabase/tests/database/schema_integrity.test.sql`: pgTAP assertions for required tables, columns, constraints, and RLS enablement.
- `supabase/tests/database/rls_membership.test.sql`: pgTAP assertions for workspace isolation, owner-only membership writes, and member task access.
- `src/lib/supabase/database.types.ts`: generated Supabase TypeScript database types.
- `package.json`: optional npm scripts for local Supabase verification if the implementation chooses to add them.

## Data And Interface Changes

### Tables

- `profiles`
  - `id uuid primary key references auth.users(id) on delete cascade`
  - `email text not null`
  - `display_name text`
  - `avatar_url text`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
  - unique index on `lower(email)` for member lookup by Edge Function in `SP-06`
- `workspaces`
  - `id uuid primary key default gen_random_uuid()`
  - `name text not null`
  - `created_by uuid not null references profiles(id)`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- `workspace_members`
  - `workspace_id uuid not null references workspaces(id) on delete cascade`
  - `user_id uuid not null references profiles(id) on delete cascade`
  - `role text not null check (role in ('owner', 'member'))`
  - `created_at timestamptz not null default now()`
  - primary key `(workspace_id, user_id)`
- `projects`
  - `id uuid primary key default gen_random_uuid()`
  - `workspace_id uuid not null references workspaces(id) on delete cascade`
  - `name text not null`
  - `description text`
  - `icon_name text`
  - `color text`
  - `deadline date`
  - `archived_at timestamptz`
  - `created_by uuid not null references profiles(id)`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- `tasks`
  - `id uuid primary key default gen_random_uuid()`
  - `workspace_id uuid not null references workspaces(id) on delete cascade`
  - `project_id uuid not null references projects(id) on delete cascade`
  - `title text not null`
  - `description text`
  - `status text not null check (status in ('backlog', 'todo', 'in_progress', 'review', 'done'))`
  - `priority text not null check (priority in ('low', 'medium', 'high', 'urgent'))`
  - `assignee_id uuid references profiles(id) on delete set null`
  - `due_date date`
  - `position numeric not null`
  - `created_by uuid not null references profiles(id)`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
  - check that `tasks.workspace_id` matches the parent project's workspace via a trigger
- `labels`
  - `id uuid primary key default gen_random_uuid()`
  - `workspace_id uuid not null references workspaces(id) on delete cascade`
  - `name text not null`
  - `color text`
  - `created_at timestamptz not null default now()`
  - unique `(workspace_id, name)`
- `task_labels`
  - `task_id uuid not null references tasks(id) on delete cascade`
  - `label_id uuid not null references labels(id) on delete cascade`
  - primary key `(task_id, label_id)`
  - trigger check that task and label belong to the same workspace
- `project_visits`
  - `project_id uuid not null references projects(id) on delete cascade`
  - `user_id uuid not null references profiles(id) on delete cascade`
  - `visited_at timestamptz not null default now()`
  - primary key `(project_id, user_id)`
- `activity_events`
  - `id uuid primary key default gen_random_uuid()`
  - `workspace_id uuid not null references workspaces(id) on delete cascade`
  - `project_id uuid references projects(id) on delete cascade`
  - `task_id uuid references tasks(id) on delete set null`
  - `actor_id uuid not null references profiles(id)`
  - `event_type text not null`
  - `payload jsonb not null default '{}'::jsonb`
  - `created_at timestamptz not null default now()`

### RLS Helper Functions

- `public.is_workspace_member(target_workspace_id uuid) returns boolean`
- `public.workspace_member_role(target_workspace_id uuid) returns text`
- `public.profile_shares_workspace(target_user_id uuid) returns boolean`

These functions must be `security definer`, set `search_path = public`, and only read membership/profile rows required for policy decisions.

### RLS Policy Categories

- Profiles:
  - authenticated users can insert and update only their own profile;
  - authenticated users can read their own profile and profiles sharing at least one workspace.
- Workspaces:
  - authenticated users can create a workspace with `created_by = auth.uid()`;
  - workspace members can read their workspace;
  - workspace owners can update workspace basics.
- Workspace members:
  - workspace members can read the membership list;
  - a workspace creator can insert their own initial owner membership;
  - only workspace owners can insert or remove other members.
- Projects:
  - workspace members can read projects in their workspace;
  - workspace members can create projects in their workspace;
  - workspace owners can update or delete/archive project records.
- Tasks:
  - workspace members can read, create, and update tasks in their workspace.
- Labels and task labels:
  - workspace members can read labels and assign/remove labels for tasks in their workspace.
- Project visits:
  - users can read and upsert only their own visits for projects in workspaces where they are members.
- Activity events:
  - workspace members can read workspace events;
  - workspace members can insert events with `actor_id = auth.uid()` in their workspace;
  - no update or delete policies.

## Tasks

### Task 1: Initialize Supabase Local Structure

- [x] Run `npx supabase --version` and record the version in the implementation notes.
- [x] Run `npx supabase init` if `supabase/config.toml` does not already exist.
- [x] Confirm the following files or folders exist:
  - `supabase/config.toml`
  - `supabase/migrations/`
  - `supabase/tests/database/`
- [x] Do not link a remote Supabase project in this subplan.
- [x] Run `git status --short` and confirm only expected Supabase scaffold files changed.

### Task 2: Add Initial Schema Migration

- [x] Create `supabase/migrations/202606070001_init_task_manager_schema.sql`.
- [x] Add extension setup:

```sql
create extension if not exists "pgcrypto";
```

- [x] Add all tables listed in the Data And Interface Changes section.
- [x] Add `public.set_updated_at()` and `before update` triggers for:
  - `profiles`
  - `workspaces`
  - `projects`
  - `tasks`
- [x] Add consistency triggers:
  - `public.ensure_task_project_workspace_match()` for `tasks`;
  - `public.ensure_task_label_workspace_match()` for `task_labels`.
- [x] Add indexes for the query paths expected by `MP-11`:
  - `profiles (lower(email))`
  - `workspace_members (user_id)`
  - `workspace_members (workspace_id, role)`
  - `projects (workspace_id, archived_at, deadline)`
  - `tasks (workspace_id, project_id, status, position)`
  - `tasks (workspace_id, assignee_id)`
  - `tasks (workspace_id, due_date)`
  - `labels (workspace_id, name)`
  - `task_labels (label_id)`
  - `project_visits (user_id, visited_at desc)`
  - `activity_events (workspace_id, created_at desc)`
- [x] Run `npx supabase db reset`.
- [x] If Docker or Supabase local stack is unavailable, record the blocker and run SQL syntax checks with the best available local Postgres-compatible tool before continuing.

### Task 3: Add RLS Helper Functions And Policies

- [x] Enable RLS on every browser-accessible table:

```sql
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.labels enable row level security;
alter table public.task_labels enable row level security;
alter table public.project_visits enable row level security;
alter table public.activity_events enable row level security;
```

- [x] Add `public.is_workspace_member`, `public.workspace_member_role`, and `public.profile_shares_workspace`.
- [x] Add policies for the categories listed in Data And Interface Changes.
- [x] Keep policy names explicit, for example:
  - `profiles_select_same_workspace`
  - `workspace_members_insert_owner_or_initial_self`
  - `tasks_update_workspace_members`
- [x] Run `npx supabase db reset`.
- [x] Manually inspect the generated migration and confirm no service role key, anon key, or project secret appears in committed files.

### Task 4: Add Local Seed Data

- [x] Create `supabase/seed.sql`.
- [x] Seed two local auth users with deterministic UUIDs:
  - owner: `00000000-0000-4000-8000-000000000001`, `owner@example.com`
  - member: `00000000-0000-4000-8000-000000000002`, `member@example.com`
- [x] Seed matching `profiles` rows with Russian display names:
  - `Алексей`
  - `Мария`
- [x] Seed one workspace:
  - `id = 10000000-0000-4000-8000-000000000001`
  - `name = 'Команда Task Manager'`
  - `created_by = owner id`
- [x] Seed owner and member rows in `workspace_members`.
- [x] Seed four projects matching the SP-01 placeholder names:
  - `Бизнес`
  - `Работа`
  - `Учеба`
  - `Личная жизнь`
- [x] Seed labels and tasks that cover all MVP statuses:
  - `backlog`
  - `todo`
  - `in_progress`
  - `review`
  - `done`
- [x] Seed at least one `project_visits` row per seeded user and at least three `activity_events`.
- [x] Run `npx supabase db reset` and confirm seed rows load without violating RLS, constraints, or triggers.

### Task 5: Add Schema Integrity Tests

- [x] Create `supabase/tests/database/schema_integrity.test.sql`.
- [x] Add pgTAP assertions that required tables exist:

```sql
begin;
select plan(39);

select has_table('profiles');
select has_table('workspaces');
select has_table('workspace_members');
select has_table('projects');
select has_table('tasks');
select has_table('labels');
select has_table('task_labels');
select has_table('project_visits');
select has_table('activity_events');

select * from finish();
rollback;
```

- [x] Extend the test with column, primary key, and foreign key assertions for the highest-risk tables:
  - `workspace_members`
  - `projects`
  - `tasks`
  - `task_labels`
- [x] Add assertions that RLS is enabled on all nine browser-accessible tables.
- [x] Run `npx supabase test db supabase/tests/database/schema_integrity.test.sql`.

### Task 6: Add RLS Membership Tests

- [x] Create `supabase/tests/database/rls_membership.test.sql`.
- [x] Use fixed test user IDs from `supabase/seed.sql`.
- [x] Add a helper block in the test to switch authenticated users:

```sql
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);
```

- [x] Test that the owner can read the seeded workspace and projects.
- [x] Test that the member can read workspace projects but cannot insert another member.
- [x] Test that the owner can insert another member row when the target profile exists.
- [x] Test that a non-member cannot read the seeded workspace or projects.
- [x] Test that a workspace member can insert a task in their workspace.
- [x] Test that a non-member cannot insert a task into the seeded workspace.
- [x] Run `npx supabase test db supabase/tests/database/rls_membership.test.sql`.

### Task 7: Generate Database Types

- [x] Create `src/lib/supabase/` if it does not exist.
- [x] Run:

```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

- [x] Confirm `src/lib/supabase/database.types.ts` includes the `public.Tables.tasks` and `public.Tables.workspace_members` definitions.
- [x] Run `npm run build` and confirm TypeScript accepts the generated type file.

### Task 8: Final Verification And Documentation Check

- [x] Run `npx supabase db reset`.
- [x] Run `npx supabase test db`.
- [x] Run `npm run build`.
- [x] Run `npm run test`.
- [x] Run `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src` and confirm no secrets are committed.
- [x] Run `rg "MP-08|MP-09|MP-12|SP-02" docs/subplans/SP-02-supabase-schema.md` and confirm required cross-references remain.
- [x] Run `git status --short` and confirm only SP-02-owned files changed.

## Acceptance Criteria

- Supabase local stack can reset the database from migrations and seed data.
- All `MP-08` core tables exist with required keys, constraints, and indexes.
- RLS is enabled on all browser-accessible tables.
- Workspace isolation policies prevent non-members from reading workspace data.
- Owner-only membership insertion/removal is covered by RLS tests.
- Members can read workspace data and create/update tasks in their workspace.
- Generated TypeScript database types exist under `src/lib/supabase/database.types.ts`.
- `npx supabase test db` passes.
- `npm run build` and `npm run test` still pass after generated types are added.
- No Supabase service role keys or project secrets are committed.

## Verification

- `npx supabase --version`
- `npx supabase db reset`
- `npx supabase test db`
- `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts`
- `npm run build`
- `npm run test`
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src`

## Notes

- Use Supabase RLS as the security boundary; do not rely on frontend filtering for workspace isolation.
- Keep seed data deterministic so future frontend subplans can depend on stable IDs in local development.
- SP-03 owns Supabase client setup, auth UI, profile creation flow, and one-workspace bootstrap behavior.
- SP-06 owns the `add-workspace-member` Edge Function; SP-02 only creates the schema and policies that function will use.
- If a future implementation finds that owner-only project archive/delete needs field-level protection, add a Postgres trigger that blocks non-owner changes to `projects.archived_at` and destructive project deletes.

### Implementation Notes 2026-06-07

- `npx supabase --version` reported `2.105.0`.
- `npx supabase init` could not complete in this Codex sandbox because Volta needs write access to `C:\Users\iliskhan\AppData\Local\Volta`; the escalation request was rejected by the environment usage limit.
- `supabase/config.toml` was added manually from the official Supabase CLI config documentation. Re-run `npx supabase init --force` only if you intentionally want to replace it with CLI defaults.
- Initial type generation produced an empty failed-generation artifact while the local Supabase stack was unavailable; this was resolved later in this implementation run.
- Fresh `npm run build` passed on 2026-06-07.
- Fresh `npm run test` passed on 2026-06-07: 1 test file, 3 tests.
- Fresh `npx supabase db reset` failed on 2026-06-07 because Docker Desktop's Linux engine pipe was unavailable: `//./pipe/dockerDesktopLinuxEngine`.
- Fresh `npx supabase test db` failed on 2026-06-07 because no local Postgres was listening at `127.0.0.1:54322`.
- Fresh `npx supabase gen types typescript --local` failed on 2026-06-07 because `supabase start is not running`.
- `rg --hidden "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src` returned no matches on 2026-06-07.
- After Docker/Supabase was restarted, `npx supabase db reset` passed on 2026-06-07 when the local stack was started with `npx supabase start --exclude vector`; the excluded vector service is an ancillary logging container and is not required for this schema/RLS subplan.
- `npx supabase test db` passed on 2026-06-07: 2 files, 48 tests.
- `npx supabase gen types typescript --local > src/lib/supabase/database.types.ts` passed on 2026-06-07, and the generated file includes `tasks` and `workspace_members`.
- `npm run build`, `npm run test`, and `npm run test:e2e` passed after generated types were added.
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src` returned no matches on 2026-06-07.

### Follow-up Verification 2026-06-12

- `npx supabase db reset` passed after local Docker/Supabase was available.
- `npx supabase test db` passed after explicit `authenticated` grants were added to the schema migration.
- The local seed users were updated with GoTrue-compatible non-null token fields so `owner@example.com` / `password123` can sign in through Supabase Auth.
- `npm run build`, `npm run test`, and `npm run test:e2e` passed from the user's Windows terminal on 2026-06-12. In the Codex managed shell, npm may need escalated execution because this checkout resolves `npm` through Volta and Volta writes under `C:\Users\iliskhan\AppData\Local\Volta`.
