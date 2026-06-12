# SP-03 Auth And Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps should use checkbox syntax for tracking during execution.

**Status:** Implemented (local env and Playwright run deferred)
**Master references:** `MP-03`, `MP-04`, `MP-06`, `MP-07`, `MP-09`, `MP-11`, `MP-12`, `MP-13`, `MP-14`, `MP-15`
**Depends on:** `SP-01-foundation.md`, `SP-02-supabase-schema.md`
**Goal:** Add real Supabase email/password authentication, protected app routes, logout, profile creation, and one-workspace bootstrap while preserving the existing dark Russian UI shell.
**Architecture:** The React app will get a browser-safe Supabase client in `src/lib/supabase`, an auth/workspace provider in `src/features/auth`, and protected routing around the existing `/app/*` shell. Auth state comes from Supabase Auth; workspace/profile bootstrap uses browser-accessible `profiles`, `workspaces`, and `workspace_members` rows protected by SP-02 RLS policies.
**Tech Stack:** React, TypeScript, Vite env variables, React Router, TanStack Query, Supabase JS Auth, Supabase Postgres/RLS, MUI, Zod, Vitest, React Testing Library, Playwright.

---

## Scope

### In Scope

- Install `@supabase/supabase-js` through npm without manually pinning a version.
- Add browser-safe Supabase environment variable documentation.
- Add a typed Supabase browser client using `src/lib/supabase/database.types.ts`.
- Replace the static login placeholder with email/password sign-in and sign-up modes.
- Add auth session provider using Supabase Auth session state.
- Protect `/app/*` routes and redirect unauthenticated users to `/login`.
- Redirect authenticated users away from `/login` to `/app/projects`.
- Add logout in the sidebar profile area.
- Ensure an authenticated user has a `profiles` row.
- Ensure an authenticated user has one workspace membership; create a personal team workspace and owner membership only when none exists.
- Expose current profile, workspace, and role to the shell for display.
- Add focused unit/integration tests for auth routing and bootstrap behavior.
- Add Playwright auth smoke coverage using the seeded local user.

### Out Of Scope

- Team member addition by email and `add-workspace-member` Edge Function.
- Project list data wiring, project CRUD, progress calculations, project visit persistence, search/filter/sort backed by Supabase.
- Kanban board, task drawer, task CRUD, task assignment, labels UI, drag-and-drop, and optimistic task mutations.
- Calendar data, statistics data, activity feed UI, comments, notifications, realtime, attachments, custom statuses, sprints, billing, and multi-workspace switching.
- Production hosting, remote Supabase linking, and committing local Supabase keys.

## Files And Responsibilities

- `package.json`: add `@supabase/supabase-js` dependency through npm and keep existing scripts.
- `.env.example`: document browser-safe local Supabase variables without committing real secrets.
- `src/lib/supabase/client.ts`: create the typed Supabase browser client from Vite env variables.
- `src/lib/supabase/authBootstrap.ts`: profile and one-workspace bootstrap helpers.
- `src/lib/supabase/authBootstrap.test.ts`: focused tests for profile/workspace bootstrap branching.
- `src/features/auth/authTypes.ts`: shared auth/profile/workspace context types.
- `src/features/auth/AuthProvider.tsx`: subscribe to Supabase Auth state, bootstrap profile/workspace, expose status and actions.
- `src/features/auth/useAuth.ts`: typed hook for consuming auth context.
- `src/features/auth/ProtectedRoute.tsx`: guard `/app/*` and `/login` redirects.
- `src/features/auth/LoginPage.tsx`: controlled sign-in/sign-up form with Russian copy, validation, loading, and error states.
- `src/features/auth/LoginPage.test.tsx`: form mode, validation, and submit behavior tests.
- `src/app/providers/AppProviders.tsx`: wrap the app with `AuthProvider` inside query/theme/router providers.
- `src/app/router/AppRouter.tsx`: route guards for `/login`, `/app/*`, `/`, and `*`.
- `src/app/router/AppRouter.test.tsx`: update routing tests for authenticated and unauthenticated states.
- `src/features/shell/Sidebar.tsx`: display the authenticated profile and add logout control.
- `tests/smoke.spec.ts`: extend smoke coverage to sign in with the seeded local owner and confirm logout.

## Data And Interface Changes

- Environment variables:
  - `VITE_SUPABASE_URL`: local or project Supabase API URL.
  - `VITE_SUPABASE_PUBLISHABLE_KEY`: browser-safe Supabase key from local status or project settings.
- Supabase Auth calls:
  - sign in with email/password through Supabase Auth.
  - sign up with email/password through Supabase Auth.
  - subscribe to auth state changes and cleanly unsubscribe on provider unmount.
  - sign out from the sidebar.
- Supabase table writes:
  - upsert or insert the authenticated user's own `profiles` row.
  - create a `workspaces` row with `created_by = auth.uid()` when the user has no membership.
  - create the initial `workspace_members` row with `role = 'owner'` for that workspace.
- Supabase table reads:
  - current user's profile.
  - current user's workspace membership and workspace basics.
- Component contracts:
  - Auth context exposes `status`, `session`, `user`, `profile`, `workspace`, `role`, `signIn`, `signUp`, `signOut`, and `refreshWorkspace`.
  - App routes use auth status instead of static redirects.

## Tasks

### Task 1: Add Supabase Client And Env Contract

- [x] Run `npm install @supabase/supabase-js` and let npm choose the compatible current version.
- [x] Create `.env.example`:

```text
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=replace-with-local-publishable-key
```

- [x] Create `src/lib/supabase/client.ts` with a typed Supabase client:

```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Supabase environment variables are not configured.');
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey);
```

- [x] Run `npm run build` and confirm missing env handling is acceptable for a configured local run.

### Task 2: Add Workspace Bootstrap Helper

- [x] Create `src/lib/supabase/authBootstrap.ts`.
- [x] Define `AuthWorkspaceState` with `profile`, `workspace`, and `role`.
- [x] Implement `ensureAuthWorkspace(supabaseClient, user)`:
  - read or create `profiles` with `id = user.id` and `email = user.email`;
  - read current membership joined to `workspaces`;
  - if membership exists, return the first workspace and role;
  - if no membership exists, create a workspace named `Команда <email-prefix>` and insert initial owner membership;
  - return the created workspace, profile, and role.
- [x] Create `src/lib/supabase/authBootstrap.test.ts`.
- [x] Add tests:
  - existing member returns existing profile/workspace without creating a new workspace;
  - new authenticated user creates profile, workspace, and owner membership;
  - database error is returned as a thrown user-visible bootstrap error.
- [x] Run `npm run test -- src/lib/supabase/authBootstrap.test.ts`.

### Task 3: Add Auth Provider

- [x] Create `src/features/auth/authTypes.ts`.
- [x] Create `src/features/auth/AuthProvider.tsx`.
- [x] Use the Supabase Auth APIs verified from official docs:
  - get the current session on mount;
  - subscribe with `onAuthStateChange`;
  - call `signInWithPassword` for sign in;
  - call `signUp` for sign up;
  - call `signOut` for logout.
- [x] Bootstrap profile/workspace after a non-null session.
- [x] Expose loading, authenticated, unauthenticated, and error states.
- [x] Create `src/features/auth/useAuth.ts` and throw a clear error when used outside the provider.
- [x] Wire `AuthProvider` in `src/app/providers/AppProviders.tsx`.
- [x] Add provider tests for initial loading, signed-out state, and signed-in bootstrap state.
- [x] Run the auth provider tests.

### Task 4: Protect Routes

- [x] Create `src/features/auth/ProtectedRoute.tsx`.
- [x] Implement an app guard:
  - while auth status is loading, show a compact dark loading state;
  - when unauthenticated, redirect to `/login`;
  - when authenticated, render the app shell.
- [x] Implement a login guard:
  - when authenticated, redirect to `/app/projects`;
  - when unauthenticated, render `LoginPage`.
- [x] Update `src/app/router/AppRouter.tsx` so `/`, unknown routes, and `/app/*` respect auth state.
- [x] Update `src/app/router/AppRouter.test.tsx` to cover:
  - unauthenticated `/app/projects` redirects to `/login`;
  - authenticated `/login` redirects to `/app/projects`;
  - authenticated sidebar navigation still works.
- [x] Run `npm run test -- src/app/router/AppRouter.test.tsx`.

### Task 5: Replace Login Placeholder With Real Form

- [x] Update `src/features/auth/LoginPage.tsx` to use controlled form state.
- [x] Add sign-in/sign-up mode switching without leaving `/login`.
- [x] Validate email and password with Zod:
  - email must be a valid email;
  - password must be present for sign in;
  - password must meet the minimum displayed by the form for sign up.
- [x] On submit, call `signIn` or `signUp` from `useAuth`.
- [x] Show Russian loading and error messages without leaking whether an account exists.
- [x] Keep the compact dark visual style from SP-01.
- [x] Create `src/features/auth/LoginPage.test.tsx` and cover:
  - sign-in form renders by default;
  - switch to sign-up mode changes button/copy;
  - invalid email shows validation feedback;
  - valid submit calls the expected auth action.
- [x] Run `npm run test -- src/features/auth/LoginPage.test.tsx`.

### Task 6: Add Logout And Authenticated Sidebar Profile

- [x] Update `src/features/shell/Sidebar.tsx` to read `profile` and `signOut` from `useAuth`.
- [x] Replace static `Алексей` and `alexey@mail.ru` with authenticated profile data.
- [x] Add a compact logout icon button in the profile area with accessible label `Выйти`.
- [x] Keep the sidebar responsive behavior unchanged.
- [x] Add or update tests so clicking logout calls `signOut`.
- [x] Run the relevant shell/auth tests.

### Task 7: Add Auth E2E Smoke Coverage

- [x] Ensure local `.env` is configured manually with local Supabase URL and browser-safe key; do not commit `.env`. Completed for local QA; `.env` remains ignored and uncommitted.
- [x] Ensure `npx supabase db reset` has loaded seeded users.
- [x] Update `tests/smoke.spec.ts`:
  - open `/login`;
  - sign in as `owner@example.com` with `password123`;
  - confirm `/app/projects` renders;
  - click logout;
  - confirm `/login` renders again.
- [x] Keep the existing project and detail smoke tests.
- [x] Run Playwright e2e smoke when browser verification is explicitly requested. Completed with the local Playwright CLI through bundled Node because the `npm` runner is blocked by Volta before tests start in this shell.

### Task 8: Final Verification

- [x] Run `npx supabase db reset`.
- [x] Run `npx supabase test db`.
- [x] Run `npm run build`.
- [x] Run `npm run test`.
- [x] Run Playwright e2e smoke if explicitly requested for this implementation run. Completed with the local Playwright CLI through bundled Node because the `npm` runner is blocked by Volta before tests start in this shell.
- [x] Run `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` and confirm no committed secret appears.
- [x] Run `git status --short` and confirm only SP-03-owned files changed.

## Acceptance Criteria

- `/login` supports email/password sign in and sign up with Russian UI copy.
- Unauthenticated users cannot access `/app/*` and are redirected to `/login`.
- Authenticated users opening `/login` are redirected to `/app/projects`.
- Signing in with seeded `owner@example.com` / `password123` loads the existing seeded workspace.
- A newly signed-up user gets a profile, one workspace, and an owner membership through browser-safe RLS-protected writes.
- Sidebar displays the authenticated user's profile data and can sign out.
- No service role key or project secret is committed.
- `npm run build`, `npm run test`, and Supabase db tests pass.
- Playwright auth smoke passes when browser verification is explicitly requested.

## Verification

- `npx supabase db reset`
- `npx supabase test db`
- Frontend build via bundled Node (`node node_modules/typescript/bin/tsc -b` and `node node_modules/vite/bin/vite.js build`)
- Unit tests via bundled Node (`node node_modules/vitest/vitest.mjs run`)
- Playwright e2e smoke via bundled Node (`node node_modules/@playwright/test/cli.js test` with Vite started by bundled Node)
- Manual QA: unauthenticated `/app/projects` redirects to `/login`.
- Manual QA: sign in with seeded local owner and confirm `/app/projects` opens.
- Manual QA: click sidebar logout and confirm `/login` opens.

## Notes

- Use the official Supabase JavaScript Auth docs for `signInWithPassword`, `signUp`, and `onAuthStateChange`; do not rely on deprecated v1 auth methods.
- Use browser-safe publishable/anon keys only. Never commit local secret keys, service role keys, or generated status output that includes secrets.
- Keep one-workspace MVP behavior. Do not add multi-workspace switching in this subplan.
- SP-04 owns real project list data and project CRUD after auth/workspace context exists.
- SP-06 owns owner-only member addition by email through an Edge Function.
