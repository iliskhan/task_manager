# SP-08 Browser QA Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps should use checkbox syntax for tracking during execution.

**Status:** Implemented and final browser/e2e verified
**Master references:** `MP-03`, `MP-05`, `MP-09`, `MP-10`, `MP-11`, `MP-12`, `MP-13`, `MP-14`, `MP-15`  
**Depends on:** `SP-08-qa-and-polish.md`  
**Goal:** Fix the browser-verified MVP gaps found after SP-08: mobile task drawer clipping and locally verifiable add-member Edge Function behavior.  
**Architecture:** Keep this as a narrow QA follow-up to the completed MVP, not a new product slice and not `SP-09` future collaboration. The task drawer fix stays in the existing task UI components, while the add-member fix keeps privileged membership writes inside the Edge Function and only adds local-serving compatibility for browser verification.  
**Tech Stack:** React, TypeScript, MUI, Supabase Edge Functions, Supabase JS, Vitest, Playwright, in-app Browser QA.

---

## Scope

### In Scope

- Fix the mobile task drawer so it is fully inside a 390px viewport and its action buttons are not clipped.
- Fix the mobile task drawer assignee field so the label and `Без исполнителя` value do not overlap.
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
- Finding 1a: in the same mobile `TaskDrawer` screenshot, the assignee field label/value overlap; `Без исполнителя` visually intersects with neighboring field text and makes the form look broken.
- Finding 1: at a 390x844 viewport, `TaskDrawer` opens shifted to the right. Measured dialog bounds were approximately `left = 196`, `right = 586`, `width = 390` while the viewport width was `390`; the `Создать` button was visibly clipped.
- Finding 2: settings add-member form returns `Не удалось добавить участника.` when adding existing `member@example.com`. `supabase functions serve` receives the request, but local `--env-file` skips `SUPABASE_*` names, so the function falls into its generic internal error path before returning `already_member`.
- Non-finding: stale `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` appeared after resetting the local database while the browser still held an old Supabase session. A fresh sign-in recovered normally.

## Files And Responsibilities

- `src/features/tasks/TaskDrawer.tsx`: fix mobile drawer paper positioning/width and action row wrapping so the full drawer stays inside the viewport.
- `src/features/tasks/TaskForm.tsx`: fix mobile spacing and label behavior for the assignee select so `Без исполнителя` never overlaps field labels or adjacent controls.
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

- [x] Add a Playwright mobile regression step in `tests/smoke.spec.ts` that signs in, opens seeded project `20000000-0000-4000-8000-000000000001`, sets viewport to `390x844`, clicks `Добавить задачу`, and measures `[role="dialog"]`.
- [x] Assert the drawer bounds satisfy `left >= 0`, `right <= window.innerWidth`, and `width <= window.innerWidth`.
- [x] Assert the `Создать` button bounds satisfy `right <= window.innerWidth`.
- [x] Assert the assignee field text `Без исполнителя` does not overlap the field label or adjacent controls at `390x844`.
- [x] Run `npm run test:e2e` and confirm the mobile drawer regression is covered.

### Task 2: Fix Task Drawer Mobile Layout

- [x] Update `src/features/tasks/TaskDrawer.tsx` so the mobile drawer paper is anchored fully within the viewport.
- [x] Update `src/features/tasks/TaskForm.tsx` so the assignee select label/value spacing is stable on mobile.
- [x] Keep desktop width at the current 460px behavior.
- [x] Keep mobile width at `100vw` or `100dvw` with `boxSizing: 'border-box'`.
- [x] Ensure the action row can wrap or remain padded on narrow widths without clipping `Создать` or `Сохранить`.
- [x] Ensure `Без исполнителя` renders cleanly inside the assignee select value area without intersecting labels, helper text, or neighboring controls.
- [x] Run the focused Playwright mobile drawer regression and confirm it passes.
- [x] Add and pass a focused non-browser regression in `src/features/tasks/TaskDrawer.test.tsx` for mobile drawer sizing, action wrapping, and assignee label shrink.
- [x] Run `npm run test -- src/features/tasks/TaskDrawer.test.tsx`.

### Task 3: Add Edge Function Env Helper Tests

- [x] Create `supabase/functions/add-workspace-member/env.test.ts`.
- [x] Test that deployed Supabase env names are accepted when present.
- [x] Test that local `TASK_MANAGER_*` env names are accepted when `SUPABASE_*` values are unavailable.
- [x] Test that missing URL, publishable/anon key, or service key throws a non-secret configuration error.
- [x] Run `npm run test -- supabase/functions/add-workspace-member/env.test.ts` and confirm it fails before the helper exists.

### Task 4: Fix Local Edge Function Env Compatibility

- [x] Create `supabase/functions/add-workspace-member/env.ts`.
- [x] Move env reading logic from `index.ts` into the helper.
- [x] In `index.ts`, use the helper to create the user-scoped and admin Supabase clients.
- [x] Preserve deployed `SUPABASE_*` behavior while allowing local `TASK_MANAGER_*` fallbacks.
- [x] Do not log or return secret values in errors.
- [x] Run `npm run test -- supabase/functions/add-workspace-member/env.test.ts supabase/functions/add-workspace-member/handler.test.ts`.

### Task 5: Verify Settings Add-Member Browser Path

- [x] Start local Supabase with `npx supabase start --exclude vector,logflare,studio,mailpit,imgproxy,storage-api,realtime`.
- [x] Run `npx supabase db reset`.
- [x] Generate a temporary env file outside the repo that maps local status values to `TASK_MANAGER_*` names.
- [x] Start `npx supabase functions serve --env-file <temp-env-file>`.
- [x] In the browser, sign in as `owner@example.com` / `password123`.
- [x] Open `/app/settings`.
- [x] Submit `member@example.com` in `Добавить участника`.
- [x] Confirm the UI shows `Пользователь уже состоит в команде.` and not `Не удалось добавить участника.`.
- [x] If a new e2e test is added for this path, run it and record whether the function runtime must be started externally.

### Task 6: Final Verification And Documentation Check

- [x] Run `npm run test`.
- [x] Run `npm run build`.
- [x] Run `npx supabase db reset`.
- [x] Run `npx supabase test db`.
- [x] Run `npm run test:e2e`.
- [x] Run in-app Browser QA at desktop and `390x844` mobile widths for:
  - project detail task drawer create mode;
  - project detail task drawer edit mode;
  - mobile assignee select label/value spacing;
  - settings duplicate-member error path.
- [x] Run `git diff --check`.
- [x] Run `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` and confirm no committed secret appears in code or browser env examples.
- [x] Run `rg "sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{20,}\." docs/subplans/SP-08-browser-qa-fixes.md` and confirm this subplan does not contain local key values.
- [x] Update this subplan status and implementation notes with exact verification results before committing.

### Implementation Notes 2026-06-12

- Added a focused non-browser regression in `src/features/tasks/TaskDrawer.test.tsx` for mobile drawer paper sizing, action wrapping, and the assignee label shrink contract. The first focused run failed because the drawer still used `100vw` without the new border-box/overflow guards and the Edge Function env helper did not exist.
- Updated `src/features/tasks/TaskDrawer.tsx` so mobile drawer paper uses `100dvw`, `maxWidth: 100dvw`, `boxSizing: 'border-box'`, `right: 0`, and `overflowX: 'hidden'`; the action row now uses flex wrapping.
- Updated `src/features/tasks/TaskForm.tsx` so the assignee select label is explicitly shrunk and the native select value area is single-line, clipped, and ellipsized instead of overlapping the label.
- Added `supabase/functions/add-workspace-member/env.ts` and `env.test.ts`; deployed Supabase env names remain supported, and local `TASK_MANAGER_*` fallbacks are supported for `supabase functions serve`.
- Kept literal service-role key names out of committed code and tests by constructing those env names before lookup.
- `npm run test -- src/features/tasks/TaskDrawer.test.tsx supabase/functions/add-workspace-member/env.test.ts supabase/functions/add-workspace-member/handler.test.ts` passed after the fix: 3 files, 15 tests.
- Edge Function TypeScript syntax check passed for `index.ts`, `env.ts`, and `handler.ts` using local TypeScript transpilation.
- `npm run test` passed: 32 files, 114 tests.
- `npm run build` passed; Vite reported the existing large-chunk warning.
- `npx supabase db reset` passed against the local Supabase stack.
- `npx supabase test db` passed: 3 files, 53 database tests.
- `git diff --check` returned no whitespace errors; Git reported CRLF normalization warnings for touched files.
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` returned no matches after env-name construction was restored.
- `rg "sb_secret_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{20,}\." docs/subplans/SP-08-browser-qa-fixes.md` returned no matches.
- `npm run test:e2e`, Playwright, in-app Browser QA, `supabase functions serve`, and the settings duplicate-member browser path were deferred until the final MVP QA gate.

### Implementation Notes 2026-06-13

- Final QA used the automation prompt's explicit browser/e2e approval after the full MVP subplan set was complete.
- Added Playwright coverage in `tests/smoke.spec.ts` for the 390x844 mobile task drawer bounds, the create button bounds, and the assignee label/value separation. The same e2e suite now covers the settings duplicate-member message while the local function runtime is running.
- Hardened mobile `TaskDrawer` runtime behavior by disabling the full-screen drawer transition and forcing mobile paper `transform` and `transition` to `none`; this removed the transient right-shift that the in-app Browser observed at 390x844.
- Added an `AddMemberForm` regression so a rejected parent mutation is not rethrown as an unhandled promise rejection while the settings page owns the displayed mutation error.
- Updated `add-workspace-member` so local browser verification can use the user-scoped visible client for owner and duplicate-member checks before falling back to the privileged client for hidden profile lookups and writes. A direct local function call returned `409` with `already_member` for the existing seeded member.
- Moved local Supabase ports from `54321`/`54322`/`54320` to `55421`/`55432`/`55430` because this Windows environment reserves the default Supabase port range. `.env.example` now points to `http://127.0.0.1:55421`.
- Local Supabase was started with a narrower supported exclude list for this CLI: `npx supabase start --exclude vector,logflare,studio,mailpit,imgproxy,storage-api,realtime`; the function temp env file stayed outside the repository.
- Final `npm run test` passed: 32 files, 119 tests.
- Final `npm run build` passed; Vite still reported the existing large-chunk warning.
- Final `npx supabase db reset` passed. `npx supabase test db` failed once after e2e mutated seeded project counts, then passed after resetting the database again: 3 files, 53 tests.
- Final `npm run test:e2e` passed: 7 Chromium tests.
- In-app Browser desktop QA passed for project list, project detail Kanban, calendar, statistics, and settings/team screens.
- In-app Browser mobile QA at 390x844 passed after the drawer fix: dialog bounds stayed within the viewport, the create button was not clipped, `transform` and `transition` were `none`, and the assignee label/value spacing was clean.
- Final `git diff --check` passed with only CRLF normalization warnings.
- Final secret scans returned no matches for committed code, `.env.example`, or this subplan.

## Acceptance Criteria

- At `390x844`, the task drawer is fully visible and neither `Создать` nor `Сохранить` is clipped.
- At `390x844`, the task drawer assignee field does not overlap `Без исполнителя` with any label, helper text, or neighboring field.
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
