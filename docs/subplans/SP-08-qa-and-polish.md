# SP-08 QA And Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps should use checkbox syntax for tracking during execution.

**Status:** Implemented and locally verified; Playwright/browser/e2e deferred  
**Master references:** `MP-05`, `MP-11`, `MP-12`, `MP-13`, `MP-14`, `MP-15`  
**Depends on:** `SP-01`, `SP-02`, `SP-03`, `SP-04`, `SP-05`, `SP-06`, `SP-07`  
**Goal:** Polish the completed MVP screens so the app is accessible, responsive enough for MVP use, covered by focused non-browser tests, and has deferred Playwright smoke coverage ready for an explicitly requested browser run.  
**Architecture:** Keep this as a cross-feature QA pass over the existing React/MUI screens instead of adding new product capability. Prefer small shared UI helpers only when they remove repeated loading, empty, or error-state markup across existing pages. Browser/e2e execution remains deferred unless explicitly requested by the current task.  
**Tech Stack:** React, TypeScript, MUI, React Testing Library, Vitest, Playwright test definitions.

---

## Scope

### In Scope

- Responsive polish for the authenticated shell, especially mobile access to profile/logout and non-overlapping controls.
- Accessibility polish for loading, empty, and error states on existing MVP screens.
- Focused unit/component tests that verify the shell polish and async state semantics without requiring a browser.
- Playwright smoke test definitions for the MVP path from sign-in through task creation, Kanban movement, calendar, statistics, and logout.
- Documentation/checklist updates that distinguish executed non-browser verification from deferred browser/e2e checks.

### Out Of Scope

- Running Playwright, browser, visual QA, or `npm run test:e2e` unless the current task explicitly requests it.
- New product features beyond existing MVP screens.
- Comments, notifications, attachments, realtime collaboration, custom statuses, sprints, billing, multi-workspace switching, or any `SP-09` future collaboration work.
- Production deployment or hosting setup.
- Broad visual redesign away from the dark compact screenshot direction.

## Files And Responsibilities

- `src/features/shell/Sidebar.tsx`: mobile profile/logout access and navigation accessibility.
- `src/features/shell/Sidebar.test.tsx`: component coverage for desktop/mobile profile actions and navigation semantics.
- `src/shared/ui/StatePanel.tsx`: reusable accessible loading, empty, and error panel for existing pages.
- `src/shared/ui/StatePanel.test.tsx`: status/alert semantics and loading indicator coverage.
- `src/features/projects/ProjectsPage.tsx`: use the shared state panel for loading, error, and empty states.
- `src/features/projects/ProjectsPage.test.tsx`: verify loading, error, and empty states remain accessible.
- `src/features/calendar/CalendarPage.tsx`: add accessible calendar region/state semantics without changing data behavior.
- `src/features/calendar/CalendarPage.test.tsx`: verify calendar state semantics and empty deadline state.
- `src/features/stats/StatsPage.tsx`: use accessible state semantics for loading, error, and empty dashboard states.
- `src/features/stats/StatsPage.test.tsx`: verify statistics state semantics and empty dashboard state.
- `tests/smoke.spec.ts`: define the deferred MVP smoke path for browser execution.
- `docs/subplans/SP-08-qa-and-polish.md`: implementation checklist, verification evidence, and deferred browser/e2e notes.

## Data And Interface Changes

- No database schema, RLS policy, Edge Function, or Supabase API contract changes.
- No new route is introduced.
- Existing component behavior is preserved while loading/empty/error output gains accessible roles or shared presentation.
- Playwright smoke definitions may create local test data when `npm run test:e2e` is explicitly requested in a future run.

## Tasks

### Task 1: Validate The QA Scope

- [x] Confirm `SP-01` through `SP-07` are implemented or explicitly deferred according to their own notes.
- [x] Confirm `SP-08` references `MP-05`, `MP-11`, `MP-12`, `MP-13`, `MP-14`, and `MP-15`.
- [x] Confirm this subplan keeps `SP-09` future collaboration out of MVP scope.
- [x] Run `rg "MP-05|MP-11|MP-12|MP-13|MP-14|MP-15|SP-08" docs/subplans/SP-08-qa-and-polish.md`.

### Task 2: Polish The Responsive Shell

- [x] Add or update a focused `Sidebar` test that verifies the mobile profile/logout action is rendered.
- [x] Run the focused `Sidebar` test and confirm the expected failure before implementation.
- [x] Update `Sidebar` so small screens still expose the authenticated profile identity and a logout action without overlapping primary navigation.
- [x] Keep desktop sidebar layout and existing logout action intact.
- [x] Run `npm run test -- src/features/shell/Sidebar.test.tsx` and confirm it passes.

### Task 3: Add Accessible State Panels

- [x] Create `src/shared/ui/StatePanel.test.tsx` with failing tests for loading status, error alert, and empty note semantics.
- [x] Run the focused `StatePanel` test and confirm the expected failure before implementation.
- [x] Create `src/shared/ui/StatePanel.tsx` with compact dark styling, `role="status"` for loading/empty states, and `Alert` semantics for errors.
- [x] Run `npm run test -- src/shared/ui/StatePanel.test.tsx` and confirm it passes.

### Task 4: Apply State Panels To MVP Pages

- [x] Add or update focused page tests for accessible loading, error, and empty states on projects, calendar, and statistics screens.
- [x] Run the focused page tests and confirm the expected failures or current baseline before implementation.
- [x] Replace repeated loading, empty, and error markup in `ProjectsPage`, `CalendarPage`, and `StatsPage` with `StatePanel` where it keeps behavior unchanged.
- [x] Preserve project filtering, calendar task links, and statistics calculations.
- [x] Run `npm run test -- src/features/projects/ProjectsPage.test.tsx src/features/calendar/CalendarPage.test.tsx src/features/stats/StatsPage.test.tsx`.

### Task 5: Prepare Deferred MVP Smoke Coverage

- [x] Update `tests/smoke.spec.ts` with an MVP smoke path that signs in, opens a seeded project, creates a task, moves or edits it to `Done`, confirms project progress-related UI is reachable, opens calendar/statistics, and logs out.
- [x] Do not run `npm run test:e2e` in this automation run unless the current user task explicitly requests browser verification.
- [x] Record Playwright/browser/e2e execution as deferred in this subplan notes.

### Task 6: Non-Browser Verification And Closure

- [x] Run `npm run test`.
- [x] Run `npm run build`.
- [x] Run `git diff --check`.
- [x] Run `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` and confirm no committed secret appears.
- [x] Run `rg "MP-05|MP-11|MP-12|MP-13|MP-14|MP-15|SP-08" docs/subplans/SP-08-qa-and-polish.md` and confirm required cross-references remain.
- [x] Run `git status --short` and confirm only SP-08-owned files changed.
- [x] Update this subplan's status and implementation notes with exact verification results before committing.

### Implementation Notes 2026-06-12

- Added mobile authenticated profile/logout access to `Sidebar` while preserving the existing desktop profile area and primary navigation.
- Added `src/shared/ui/StatePanel.tsx` for accessible loading/empty live regions and error alerts without changing page data contracts.
- Updated `ProjectsPage`, `CalendarPage`, and `StatsPage` to use `StatePanel` for loading, error, and empty states.
- Extended focused tests for shell responsive access, `StatePanel`, and accessible page states.
- Updated `tests/smoke.spec.ts` with a deferred MVP browser path: sign in, open seeded project, create a task, edit it to `Done`, check project progress UI, open calendar/statistics, and log out through existing coverage.
- Focused red/green verification:
  - `npm run test -- src/features/shell/Sidebar.test.tsx` first failed because no mobile logout action existed, then passed: 1 file, 3 tests.
  - `npm run test -- src/shared/ui/StatePanel.test.tsx` first failed because `StatePanel` did not exist, then passed: 1 file, 3 tests.
  - `npm run test -- src/features/projects/ProjectsPage.test.tsx src/features/calendar/CalendarPage.test.tsx src/features/stats/StatsPage.test.tsx` first failed because old page states had no `role="status"`, then passed: 3 files, 11 tests.
  - Combined focused suite passed: 5 files, 17 tests.
- `npm run test` initially hit the documented Volta AppData sandbox blocker, then passed with escalated npm execution: 31 files, 110 tests.
- `npm run build` initially hit the documented Volta AppData sandbox blocker, then passed with escalated npm execution; Vite reported the existing large-chunk warning.
- `git diff --check` returned no whitespace errors; Git reported CRLF normalization warnings for touched files.
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` returned no matches.
- `rg "MP-05|MP-11|MP-12|MP-13|MP-14|MP-15|SP-08" docs/subplans/SP-08-qa-and-polish.md` confirmed required cross-references remain.
- `npm run test:e2e`, Playwright, in-app Browser, and manual browser QA were not run because browser verification was not explicitly requested in this automation run.

## Acceptance Criteria

- Authenticated shell remains usable on small screens, including visible profile context and logout access.
- Existing MVP pages expose accessible loading, empty, and error states without changing the underlying data behavior.
- Project list, calendar, statistics, settings/team, and Kanban flows remain covered by non-browser tests.
- MVP Playwright smoke coverage is present but execution remains deferred unless browser verification is explicitly requested.
- The app remains runnable after the subplan is complete.

## Verification

- `npm run test -- src/features/shell/Sidebar.test.tsx`
- `npm run test -- src/shared/ui/StatePanel.test.tsx`
- `npm run test -- src/features/projects/ProjectsPage.test.tsx src/features/calendar/CalendarPage.test.tsx src/features/stats/StatsPage.test.tsx`
- `npm run test`
- `npm run build`
- `git diff --check`
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example`
- `rg "MP-05|MP-11|MP-12|MP-13|MP-14|MP-15|SP-08" docs/subplans/SP-08-qa-and-polish.md`
- Deferred unless explicitly requested: `npm run test:e2e`, Playwright/browser visual QA, manual in-app-browser verification.

## Notes

- Browser and Playwright execution is intentionally deferred for automation runs unless explicitly requested in the current task.
- This subplan closes the MVP sequence after `SP-07`; `SP-09` remains future collaboration scope.
