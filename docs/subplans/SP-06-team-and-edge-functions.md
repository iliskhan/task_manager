# SP-06 Team And Edge Functions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps should use checkbox syntax for tracking during execution.

**Status:** Implemented and locally verified; Supabase DB test blocked by local stack; browser/e2e deferred  
**Master references:** `MP-02`, `MP-03`, `MP-04`, `MP-06`, `MP-07`, `MP-09`, `MP-10`, `MP-11`, `MP-12`, `MP-13`, `MP-14`, `MP-15`  
**Depends on:** `SP-01-foundation.md`, `SP-02-supabase-schema.md`, `SP-03-auth-and-workspace.md`, `SP-04-project-list.md`, `SP-05-kanban-and-tasks.md`  
**Goal:** Add owner-only team member addition by email through a Supabase Edge Function and replace the static settings placeholder with workspace/team data.  
**Architecture:** The browser keeps normal team reads behind Supabase RLS and invokes `add-workspace-member` for privileged email lookup and membership insertion. The Edge Function validates the authenticated caller, uses server-side Supabase credentials only inside the function, checks owner role before adding a member, and records a `member_added` activity event for SP-07 statistics/recent-activity work.  
**Tech Stack:** React, TypeScript, TanStack Query, Supabase JS, Supabase Edge Functions, Supabase Postgres/RLS, MUI, Zod, Vitest, React Testing Library.

---

## Scope

### In Scope

- Add a Supabase Edge Function named `add-workspace-member`.
- Keep JWT verification enabled for the function and reject unauthenticated calls.
- Validate the function request body: `workspaceId`, `email`, and role `member`.
- Normalize the submitted email before lookup.
- Verify the caller is an `owner` of the requested workspace before any membership change.
- Look up an existing registered profile by email using server-side credentials inside the Edge Function.
- Reject unknown users, duplicate members, non-owner callers, invalid email, invalid role, and malformed requests with stable `MP-10` error codes.
- Insert a `workspace_members` row for the target profile with role `member`.
- Insert a `member_added` row into `activity_events`.
- Add a browser-side team repository and TanStack Query hooks for workspace member list reads and Edge Function invocation.
- Replace the static settings placeholder with current profile, workspace basics, workspace member list, and owner-only add-member form.
- Add focused tests for Edge Function validation/branching, team repository mapping, add-member invocation, settings UI rendering, and owner-only form behavior.

### Out Of Scope

- Email invitations or adding users who are not already registered.
- Role editing, owner transfer, member removal, or destructive team management.
- Multi-workspace switching.
- Profile editing and workspace-name editing.
- Comments, notifications, realtime collaboration, attachments, custom statuses, sprints, billing, and production deployment.
- Calendar page data wiring and statistics dashboard data wiring beyond writing `member_added` activity events.
- Browser, Playwright, or `npm run test:e2e` verification unless explicitly requested in the current task.

## Files And Responsibilities

- `docs/subplans/SP-06-team-and-edge-functions.md`: implementation contract and completion evidence.
- `supabase/config.toml`: per-function JWT configuration for `add-workspace-member`.
- `supabase/functions/add-workspace-member/index.ts`: Deno Edge Function entrypoint, CORS handling, environment key selection, user authentication, and JSON response formatting.
- `supabase/functions/add-workspace-member/handler.ts`: testable request validation, owner/member branching, membership insert, activity insert, and stable error code mapping.
- `supabase/functions/add-workspace-member/handler.test.ts`: focused Edge Function logic tests using mocked Supabase query builders.
- `src/features/team/teamTypes.ts`: team member, role, request, response, and error-code types.
- `src/features/team/teamFormatters.ts`: role label, member display name, and joined-date helpers.
- `src/features/team/teamFormatters.test.ts`: focused formatter tests.
- `src/features/team/teamRepository.ts`: typed Supabase reads for workspace members and `supabase.functions.invoke` wrapper for member addition.
- `src/features/team/teamRepository.test.ts`: mocked repository tests for list mapping and Edge Function error handling.
- `src/features/team/teamQueries.ts`: TanStack Query keys and hooks for member list and add-member mutation.
- `src/features/team/AddMemberForm.tsx`: owner-only email form with validation and Russian status/error copy.
- `src/features/team/AddMemberForm.test.tsx`: form validation and submit tests.
- `src/features/team/TeamMemberList.tsx`: compact dark member list for settings.
- `src/features/settings/SettingsPage.tsx`: real account/workspace/team settings composition.
- `src/features/settings/SettingsPage.test.tsx`: settings page tests for authenticated data, member list states, and owner-only controls.
- `src/features/shell/Sidebar.test.tsx`: update only if workspace/profile expectations need adjustment.
- `vite.config.ts`: include Supabase function unit tests in Vitest without adding browser/e2e execution.

## Data And Interface Changes

- Edge Function:
  - name: `add-workspace-member`;
  - request: `{ "workspaceId": "uuid", "email": "member@example.com", "role": "member" }`;
  - success response: `{ "member": { "userId": "uuid", "email": "member@example.com", "displayName": "Name", "avatarUrl": null, "role": "member", "createdAt": "iso-date" } }`;
  - error response: `{ "code": "unauthenticated" | "not_owner" | "invalid_email" | "invalid_role" | "user_not_found" | "already_member" | "internal_error", "message": "..." }`.
- Reads:
  - `workspace_members` filtered by authenticated `workspace_id`;
  - `profiles` for member profile display.
- Writes:
  - `workspace_members` insert for the target profile, role `member`;
  - `activity_events` insert with `event_type = 'member_added'`, caller as `actor_id`, and payload containing the added user's id/email/role.
- Component contracts:
  - `SettingsPage` consumes `profile`, `workspace`, `role`, and `user` from `useAuth`.
  - `useWorkspaceMembersQuery(workspaceId)` reads the member list only after a workspace exists.
  - `useAddWorkspaceMemberMutation()` invokes the Edge Function and invalidates the member list on success.
  - `AddMemberForm` renders only for owners and only adds the fixed MVP role `member`.

## Tasks

### Task 1: Add Edge Function Plan And Configuration

- [x] Create this `SP-06-team-and-edge-functions.md` subplan from the master plan and template.
- [x] Confirm the subplan references `MP-03`, `MP-09`, `MP-10`, `MP-11`, `MP-12`, and `MP-14`.
- [x] Add `[functions.add-workspace-member] verify_jwt = true` to `supabase/config.toml`.
- [x] Keep secrets out of committed files; rely on Supabase-provided Edge Function environment variables.
- [x] Run `rg "MP-03|MP-09|MP-10|MP-11|MP-12|SP-06" docs/subplans/SP-06-team-and-edge-functions.md`.

### Task 2: Add Edge Function Validation And Handler

- [x] Create `supabase/functions/add-workspace-member/handler.ts`.
- [x] Add `parseAddWorkspaceMemberRequest` with tests for valid input, malformed JSON shape, invalid email, and invalid role.
- [x] Run `npm run test -- supabase/functions/add-workspace-member/handler.test.ts` and confirm the first focused tests fail before implementation.
- [x] Implement request parsing, email normalization, role validation, and stable error response helpers.
- [x] Add tests for unauthenticated caller, non-owner caller, unknown email, duplicate membership, successful insert, and activity-event insert.
- [x] Implement `handleAddWorkspaceMember` against an injected Supabase-like client.
- [x] Run `npm run test -- supabase/functions/add-workspace-member/handler.test.ts` and confirm the handler tests pass.

### Task 3: Add Edge Function Entrypoint

- [x] Create `supabase/functions/add-workspace-member/index.ts`.
- [x] Handle `OPTIONS` preflight and JSON responses with CORS headers.
- [x] Read `SUPABASE_URL`, publishable/anon key, and secret key from Edge Function environment variables.
- [x] Authenticate the bearer token through a user-scoped Supabase client.
- [x] Call `handleAddWorkspaceMember` with the authenticated user id and server-side Supabase client.
- [x] Return the handler status and JSON body without logging secrets.
- [x] Run a TypeScript syntax/transpile check for `index.ts` and `handler.ts` if local Deno function serving is unavailable.

### Task 4: Add Team Repository And Query Hooks

- [x] Create `src/features/team/teamTypes.ts`.
- [x] Create `src/features/team/teamFormatters.ts` and `teamFormatters.test.ts`.
- [x] Add tests for role label, empty display name fallback, and joined-date formatting.
- [x] Create `src/features/team/teamRepository.ts`.
- [x] Add `loadWorkspaceMembers(client, workspaceId)` using browser-safe RLS reads.
- [x] Add `addWorkspaceMember(client, input)` using `supabase.functions.invoke('add-workspace-member', { body })`.
- [x] Map function error codes to user-visible Russian messages without exposing internal details.
- [x] Create `src/features/team/teamRepository.test.ts`.
- [x] Test member-list mapping, successful function invocation, and `FunctionsHttpError` JSON error mapping.
- [x] Create `src/features/team/teamQueries.ts` with member-list and add-member mutation hooks.
- [x] Run `npm run test -- src/features/team/teamFormatters.test.ts src/features/team/teamRepository.test.ts`.

### Task 5: Build Team Settings UI

- [x] Create `src/features/team/AddMemberForm.tsx`.
- [x] Create `src/features/team/AddMemberForm.test.tsx`.
- [x] Test invalid email feedback and successful normalized submit.
- [x] Create `src/features/team/TeamMemberList.tsx`.
- [x] Update `src/features/settings/SettingsPage.tsx` to render current profile, workspace name, role, member list, and owner-only add-member form.
- [x] Create `src/features/settings/SettingsPage.test.tsx`.
- [x] Test loading, empty/error member list states, owner add-member visibility, member add-member hidden state, and successful add-member feedback.
- [x] Run `npm run test -- src/features/team/AddMemberForm.test.tsx src/features/settings/SettingsPage.test.tsx`.

### Task 6: Final Verification And Documentation Check

- [x] Run `npm run test`.
- [x] Run `npm run build`.
- [ ] Run `npx supabase test db` if the local Supabase stack is available.
- [ ] Run `npm run test:e2e` only if browser verification is explicitly requested for the implementation run.
- [x] Run `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` and confirm no committed secret appears.
- [x] Run `git diff --check`.
- [x] Run `git status --short` and confirm only SP-06-owned files changed.
- [x] Update this subplan's status and implementation notes with exact verification results before committing.

### Implementation Notes 2026-06-12

- Added `add-workspace-member` Edge Function configuration with JWT verification enabled in `supabase/config.toml`.
- Added a testable Edge Function handler covering valid input normalization, invalid email, invalid role, unauthenticated callers, non-owner callers, unknown users, duplicate members, successful membership insertion, and `member_added` activity insertion.
- Added a Deno Edge Function entrypoint with CORS handling, user-token authentication, server-side Supabase client creation, and JSON response mapping; Edge Function TypeScript files transpile without syntax diagnostics.
- Added `src/features/team/**` for member types, formatters, Supabase member reads, Edge Function invocation, TanStack Query hooks, add-member form, and member list rendering.
- Replaced the static settings placeholder with authenticated profile/workspace data, workspace member list states, and owner-only add-member form behavior.
- Focused red/green verification:
  - Initial handler test run failed because `./handler` did not exist, then `npm run test -- supabase/functions/add-workspace-member/handler.test.ts` passed: 1 file, 7 tests.
  - Initial team formatter/repository test run failed because `teamFormatters` and `teamRepository` did not exist, then the focused run passed: 2 files, 6 tests.
  - Initial UI test run failed against the static settings placeholder and missing `AddMemberForm`, then the focused run passed: 2 files, 6 tests.
- `npm run test` passed on 2026-06-12: 24 test files, 91 tests.
- `npm run build` passed on 2026-06-12; Vite reported the existing large-chunk warning.
- `npx supabase test db` was attempted with the documented Volta escalation, but the local database was unavailable: `dial tcp 127.0.0.1:54322: connectex: No connection could be made because the target machine actively refused it.`
- `npm run test:e2e`, Playwright, in-app Browser, and manual browser QA were not run because browser verification was not explicitly requested in this automation run.
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` returned no matches.
- `git diff --check` returned no whitespace errors; Git reported CRLF normalization warnings for touched files.

## Acceptance Criteria

- `add-workspace-member` rejects unauthenticated callers.
- `add-workspace-member` rejects authenticated non-owners.
- `add-workspace-member` rejects invalid email, invalid role, unknown registered user, and duplicate member requests with stable `MP-10` codes.
- Workspace owners can add an existing registered user to their workspace as `member`.
- Successful member addition inserts a `member_added` activity event.
- The settings page renders authenticated profile basics, workspace name, current role, and workspace member list from Supabase-backed data.
- Only owners see and can use the add-member form.
- Team reads stay browser-safe behind RLS; privileged email lookup and membership insertion stay inside the Edge Function.
- The app remains runnable after the subplan is complete.
- `npm run test`, `npm run build`, and available Supabase database tests pass in the implementation environment.
- Playwright/browser/e2e checks remain deferred unless explicitly requested.
- No service role key or Supabase project secret is committed.

## Verification

- `npm run test`
- `npm run build`
- `npx supabase test db` if the local Supabase stack is available
- `npm run test:e2e` only when browser verification is explicitly requested
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example`
- `git diff --check`
- Manual QA, only when browser verification is explicitly requested: sign in as the seeded owner, open settings, add the seeded member by email if not already present, and confirm the member list updates.
- Manual QA, only when browser verification is explicitly requested: sign in as a member and confirm the add-member form is not shown.

## Notes

- Supabase docs checked for this plan: Edge Functions are Deno TypeScript functions, local function serving uses `supabase functions serve`, per-function `verify_jwt` belongs in `supabase/config.toml`, browser invocation uses `supabase.functions.invoke`, CORS must be handled for browser calls, and service/secret keys are available only inside Edge Functions.
- Use the newer Edge Function secret variables when available, with legacy local variables as a fallback, but never commit actual key values.
- Keep the MVP role addition fixed to `member`; adding owners or transferring ownership is a separate product decision.
- Keep SP-06 independent from SP-07. This subplan writes `member_added` events, but calendar/statistics pages remain out of scope.
- In this repository, do not run Playwright or in-app-browser verification unless the user explicitly requests it in the current task.
- In the Codex managed shell on this Windows checkout, `npm` can fail through Volta with an AppData write error. If that happens during implementation verification, rerun the same `npm run ...` command with escalated execution using the repository rule in `AGENTS.md`.
