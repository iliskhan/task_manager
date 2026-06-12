# SP-08 Browser QA Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps should use checkbox syntax for tracking during execution.

**Status:** Draft from browser QA on 2026-06-12  
**Master references:** `MP-03`, `MP-05`, `MP-09`, `MP-10`, `MP-11`, `MP-12`, `MP-13`, `MP-14`, `MP-15`  
**Depends on:** `SP-08-qa-and-polish.md`  
**Goal:** Fix the browser-verified MVP gaps found after SP-08: mobile task drawer clipping and locally verifiable add-member Edge Function behavior.  
**Architecture:** Keep this as a narrow QA follow-up to the completed MVP, not a new product slice and not `SP-09` future collaboration. The task drawer fix stays in the existing task UI components, while the add-member fix keeps privileged membership writes inside the Edge Function and only adds local-serving compatibility for browser verification.  
**Tech Stack:** React, TypeScript, MUI, Supabase Edge Functions, Supabase JS, Vitest, Playwright, in-app Browser QA.

---

## Scope

### In Scope

- Fix the mobile task drawer so it is fully inside a 390px viewport and its action buttons are not clipped.
- Add a regression check for the task drawer at mobile viewport width.
- Make `add-workspace-member` locally verifiable under `supabase functions serve` without committing secrets.
- Preserve deployed Edge Function behavior that reads Supabase-provided runtime secrets.
- Verify the settings duplicate-member path returns the stable `already_member` message instead of a generic internal error.
- Add or update e2e coverage for the settings add-member path when the local function runtime is running.
- Re-run non-browser tests, build, Supabase DB tests, Playwright e2e, and in-app Browser checks for the fixed flows.

### Out Of Scope

- `SP-09` future collaboration work: comments, notifications, realtime, or attachments.
- New team-management features such as member removal, role editing, owner transfer, or email invitations.
- Broad redesign of the project list, board, calendar, statistics, or settings screens.
- Changing database schema or RLS policies unless the Edge Function fix proves a real policy blocker.
- Treating Browser-runtime native date-input `fill()` behavior as an app bug; Playwright e2e already persisted task/project dates.

## Browser QA Findings From 2026-06-12

- Desktop and mobile project list, project search, project creation, project detail, Kanban create/edit flow, progress updates, calendar deep links, statistics, settings read state, invalid-email validation, and mobile logout were browser-verified.
- `npm run test:e2e` passed: 5 Chromium tests.
- `npx supabase db reset` passed and `npx supabase test db` passed: 3 files, 53 tests.
- Finding 1: at a 390x844 viewport, `TaskDrawer` opens shifted to the right. Measured dialog bounds were approximately `left = 196`, `right = 586`, `width = 390` while the viewport width was `390`; the `Создать` button was visibly clipped.
- Finding 2: settings add-member form returns `Не удалось добавить участника.` when adding existing `member@example.com`. `supabase functions serve` receives the request, but local `--env-file` skips `SUPABASE_*` names, so the function falls into its generic internal error path before returning `already_member`.
- Non-finding: stale `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` appeared after resetting the local database while the browser still held an old Supabase session. A fresh sign-in recovered normally.

## Files And Responsibilities

- `src/features/tasks/TaskDrawer.tsx`: fix mobile drawer paper positioning/width and action row wrapping so the full drawer stays inside the viewport.
- `tests/smoke.spec.ts`: add a mobile viewport regression check that opens the task drawer and asserts the dialog/action buttons are within viewport bounds.
- `supabase/functions/add-workspace-member/env.ts`: new small helper for reading deployed and local function environment variables without logging secret values.
- `supabase/functions/add-workspace-member/env.test.ts`: focused tests for deployed Supabase env names and local override env names.
- `supabase/functions/add-workspace-member/index.ts`: use the env helper, keep JWT verification, keep CORS, and keep stable JSON error behavior.
- `src/features/team/teamRepository.ts`: update only if the browser error mapping needs to preserve `already_member` from the function response.
- `src/features/team/teamRepository.test.ts`: extend only if repository error mapping changes.
- `tests/smoke.spec.ts`: add a settings duplicate-member smoke step or separate test that expects the user-visible duplicate-member error when the function runtime is available.
- `docs/subplans/SP-08-browser-qa-fixes.md`: track implementation evidence and deferred items accurately.

## Data And Interface Changes

- No database schema changes are planned.
- No RLS changes are planned unless testing proves owner membership checks fail inside the Edge Function.
- Add local-only Edge Function env fallbacks, for example:
  - `TASK_MANAGER_SUPABASE_URL`
  - `TASK_MANAGER_SUPABASE_ANON_KEY`
  - `TASK_MANAGER_SUPABASE_SERVICE_ROLE_KEY`
- Keep deployed/runtime names supported:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEYS` or `SUPABASE_ANON_KEY`
  - `SUPABASE_SECRET_KEYS` or `SUPABASE_SERVICE_ROLE_KEY`
- Do not commit any env file containing local secret values.
- `add-workspace-member` must still return stable `MP-10` error codes, including `already_member`.

## Tasks

### Task 1: Add Mobile Drawer Regression Coverage

- [ ] Add a Playwright mobile regression step in `tests/smoke.spec.ts` that signs in, opens seeded project `20000000-0000-4000-8000-000000000001`, sets viewport to `390x844`, clicks `Добавить задачу`, and measures `[role="dialog"]`.
- [ ] Assert the drawer bounds satisfy `left >= 0`, `right <= window.innerWidth`, and `width <= window.innerWidth`.
- [ ] Assert the `Создать` button bounds satisfy `right <= window.innerWidth`.
- [ ] Run `npm run test:e2e` and confirm the new regression fails before the fix.

### Task 2: Fix Task Drawer Mobile Layout

- [ ] Update `src/features/tasks/TaskDrawer.tsx` so the mobile drawer paper is anchored fully within the viewport.
- [ ] Keep desktop width at the current 460px behavior.
- [ ] Keep mobile width at `100vw` or `100dvw` with `boxSizing: 'border-box'`.
- [ ] Ensure the action row can wrap or remain padded on narrow widths without clipping `Создать` or `Сохранить`.
- [ ] Run the focused Playwright mobile drawer regression and confirm it passes.
- [ ] Run `npm run test -- src/features/tasks/TaskDrawer.test.tsx`.

### Task 3: Add Edge Function Env Helper Tests

- [ ] Create `supabase/functions/add-workspace-member/env.test.ts`.
- [ ] Test that deployed Supabase env names are accepted when present.
- [ ] Test that local `TASK_MANAGER_*` env names are accepted when `SUPABASE_*` values are unavailable.
- [ ] Test that missing URL, publishable/anon key, or service key throws a non-secret configuration error.
- [ ] Run `npm run test -- supabase/functions/add-workspace-member/env.test.ts` and confirm it fails before the helper exists.

### Task 4: Fix Local Edge Function Env Compatibility

- [ ] Create `supabase/functions/add-workspace-member/env.ts`.
- [ ] Move env reading logic from `index.ts` into the helper.
- [ ] In `index.ts`, use the helper to create the user-scoped and admin Supabase clients.
- [ ] Preserve deployed `SUPABASE_*` behavior while allowing local `TASK_MANAGER_*` fallbacks.
- [ ] Do not log or return secret values in errors.
- [ ] Run `npm run test -- supabase/functions/add-workspace-member/env.test.ts supabase/functions/add-workspace-member/handler.test.ts`.

### Task 5: Verify Settings Add-Member Browser Path

- [ ] Start local Supabase with `npx supabase start --exclude vector`.
- [ ] Run `npx supabase db reset`.
- [ ] Generate a temporary env file outside the repo that maps local status values to `TASK_MANAGER_*` names.
- [ ] Start `npx supabase functions serve --env-file <temp-env-file>`.
- [ ] In the browser, sign in as `owner@example.com` / `password123`.
- [ ] Open `/app/settings`.
- [ ] Submit `member@example.com` in `Добавить участника`.
- [ ] Confirm the UI shows `Пользователь уже состоит в команде.` and not `Не удалось добавить участника.`.
- [ ] If a new e2e test is added for this path, run it and record whether the function runtime must be started externally.

### Task 6: Final Verification And Documentation Check

- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `npx supabase db reset`.
- [ ] Run `npx supabase test db`.
- [ ] Run `npm run test:e2e`.
- [ ] Run in-app Browser QA at desktop and `390x844` mobile widths for:
  - project detail task drawer create mode;
  - project detail task drawer edit mode;
  - settings duplicate-member error path.
- [ ] Run `git diff --check`.
- [ ] Run `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` and confirm no committed secret appears in code or browser env examples.
- [ ] Run `rg "sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{20,}\." docs/subplans/SP-08-browser-qa-fixes.md` and confirm this subplan does not contain local key values.
- [ ] Update this subplan status and implementation notes with exact verification results before committing.

## Acceptance Criteria

- At `390x844`, the task drawer is fully visible and neither `Создать` nor `Сохранить` is clipped.
- Desktop task drawer behavior remains unchanged.
- The add-member Edge Function can be served locally with an uncommitted temp env file that does not use skipped `SUPABASE_*` keys.
- Submitting existing `member@example.com` from settings returns the user-visible duplicate-member message.
- Existing `add-workspace-member` handler tests still pass.
- `npm run test`, `npm run build`, Supabase DB tests, and Playwright e2e pass after the fixes.
- Browser QA confirms the fixed mobile drawer and settings add-member path.
- No local secrets or service role keys are committed.

## Verification

- `npm run test -- src/features/tasks/TaskDrawer.test.tsx`
- `npm run test -- supabase/functions/add-workspace-member/env.test.ts supabase/functions/add-workspace-member/handler.test.ts`
- `npm run test`
- `npm run build`
- `npx supabase db reset`
- `npx supabase test db`
- `npm run test:e2e`
- In-app Browser QA at desktop and `390x844` mobile widths.
- `git diff --check`
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example`
- `rg "sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{20,}\." docs/subplans/SP-08-browser-qa-fixes.md`

## Notes

- This plan is intentionally named as an SP-08 follow-up. Do not repurpose `SP-09`; the master plan reserves `SP-09` for future collaboration features.
- Keep the local function env file outside the repository. The implementation may document a one-liner to generate it, but must not commit the file or key values.
- The Browser runtime could not set native date inputs with `fill()` in this session; this was not treated as an app issue because Playwright e2e persisted dates successfully.
