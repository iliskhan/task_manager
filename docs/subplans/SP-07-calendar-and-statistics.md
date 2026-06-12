# SP-07 Calendar And Statistics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps should use checkbox syntax for tracking during execution.

**Status:** Implemented and locally verified; Supabase DB test blocked by local stack; browser/e2e deferred  
**Master references:** `MP-01`, `MP-02`, `MP-04`, `MP-05`, `MP-06`, `MP-07`, `MP-08`, `MP-09`, `MP-11`, `MP-12`, `MP-13`, `MP-14`, `MP-15`  
**Depends on:** `SP-01-foundation.md`, `SP-02-supabase-schema.md`, `SP-03-auth-and-workspace.md`, `SP-04-project-list.md`, `SP-05-kanban-and-tasks.md`, `SP-06-team-and-edge-functions.md`  
**Goal:** Replace the static calendar and statistics placeholders with Supabase-backed deadline and analytics views that read the same project/task/activity data as the rest of the MVP.  
**Architecture:** Calendar and statistics stay as read-only React feature modules backed by browser-safe Supabase reads protected by RLS. Pure helpers own date grids, overdue detection, status counts, progress, upcoming deadlines, and activity mapping; page components only compose query state and compact dark MUI UI. Calendar task links route into the existing project detail board and request opening the matching task drawer by URL query parameter.  
**Tech Stack:** React, TypeScript, React Router, TanStack Query, Supabase JS, Supabase Postgres/RLS, MUI, MUI Icons, Vitest, React Testing Library.

---

## Scope

### In Scope

- Replace `CalendarPage` static placeholder data with real workspace task deadlines.
- Render a monthly calendar grid with all weekdays, current-month cells, today styling, and task deadline chips.
- Highlight overdue non-done tasks.
- Include project color/name context for each deadline item.
- Add previous/next month controls using local React state.
- Make calendar task chips link to the project detail route with a task query parameter.
- Teach the existing Kanban board to open the task drawer when the route supplies a valid `taskId`.
- Replace `StatsPage` static placeholder data with real workspace analytics.
- Show overall completion, active project count, overdue count, and upcoming deadline count.
- Show per-project progress, task counts by status, upcoming deadlines, overdue tasks, and recent activity from `activity_events`.
- Add focused tests for pure calendar helpers, calendar repository mapping, calendar page rendering, task deep-link drawer opening, statistics metrics, statistics repository mapping, and statistics page rendering.

### Out Of Scope

- Creating, editing, or deleting tasks from the calendar page.
- Dedicated task-detail routes.
- Full project overview tab wiring or project-specific statistics tab wiring.
- New database tables, schema migrations, RLS policy changes, or Edge Functions.
- Realtime updates, comments, notifications UI, attachments, custom statuses, sprints, billing, production deployment, or multi-workspace switching.
- Browser, Playwright, or `npm run test:e2e` verification unless explicitly requested in the current task.

## Files And Responsibilities

- `docs/subplans/SP-07-calendar-and-statistics.md`: implementation contract and completion evidence.
- `src/features/calendar/calendarTypes.ts`: calendar deadline task, project context, day cell, and month view types.
- `src/features/calendar/calendarUtils.ts`: pure month-grid, date formatting, overdue detection, and grouping helpers.
- `src/features/calendar/calendarUtils.test.ts`: focused tests for month grid shape, task grouping, and overdue detection.
- `src/features/calendar/calendarRepository.ts`: browser-safe Supabase reads for workspace projects/tasks and mapping to calendar deadline items.
- `src/features/calendar/calendarRepository.test.ts`: repository tests for task/project mapping and filtering.
- `src/features/calendar/calendarQueries.ts`: TanStack Query keys and `useCalendarDeadlinesQuery`.
- `src/features/calendar/CalendarPage.tsx`: real monthly deadline calendar UI with loading, error, empty, overdue, and project-link states.
- `src/features/calendar/CalendarPage.test.tsx`: page tests using mocked auth/query hooks.
- `src/features/stats/statsTypes.ts`: workspace analytics view model types.
- `src/features/stats/statsMetrics.ts`: pure status-count, progress, overdue, upcoming, and activity mapping helpers.
- `src/features/stats/statsMetrics.test.ts`: focused analytics tests.
- `src/features/stats/statsRepository.ts`: browser-safe Supabase reads for projects, tasks, activity events, and actor profiles.
- `src/features/stats/statsRepository.test.ts`: repository tests for query shape and mapping.
- `src/features/stats/statsQueries.ts`: TanStack Query keys and `useWorkspaceStatsQuery`.
- `src/features/stats/StatsPage.tsx`: real analytics dashboard UI with loading, error, empty, and data states.
- `src/features/stats/StatsPage.test.tsx`: page tests using mocked auth/query hooks.
- `src/features/board/KanbanBoard.tsx`: accept an optional initial task id and open the existing edit drawer after board data loads.
- `src/features/board/KanbanBoard.test.tsx`: add coverage that a valid initial task id opens the edit drawer.
- `src/features/projects/ProjectDetailPage.tsx`: read `taskId` from URL search params and pass it into `KanbanBoard`.
- `src/features/projects/ProjectDetailPage.test.tsx`: add coverage that project detail passes the URL task id into the board.

## Data And Interface Changes

- No schema migration is planned for SP-07.
- Calendar reads:
  - `projects` filtered by authenticated `workspace_id`;
  - `tasks` filtered by authenticated `workspace_id`, then narrowed in application code to active-project tasks with non-null `due_date`.
- Statistics reads:
  - `projects` filtered by authenticated `workspace_id`;
  - `tasks` filtered by authenticated `workspace_id`;
  - `activity_events` filtered by authenticated `workspace_id` and ordered by newest first;
  - `profiles` for recent activity actor labels when actor ids exist.
- Component contracts:
  - `useCalendarDeadlinesQuery(workspaceId)` loads deadline tasks only after a workspace exists.
  - `useWorkspaceStatsQuery(workspaceId)` loads dashboard analytics only after a workspace exists.
  - `CalendarPage` links each task to `/app/projects/:projectId?taskId=:taskId`.
  - `ProjectDetailPage` reads `taskId` from search params and passes it to `KanbanBoard`.
  - `KanbanBoard` opens the edit drawer for `initialTaskId` once matching board data is available.

## Tasks

### Task 1: Add Calendar Domain Helpers

- [x] Create `src/features/calendar/calendarTypes.ts`.
- [x] Create `src/features/calendar/calendarUtils.test.ts`.
- [x] Add failing tests for six-week month grid generation, deadline grouping by date, and overdue non-done task detection.
- [x] Create `src/features/calendar/calendarUtils.ts`.
- [x] Implement the minimal calendar helper logic.
- [x] Run `npm run test -- src/features/calendar/calendarUtils.test.ts` and confirm it passes.

### Task 2: Add Calendar Repository And Query Hook

- [x] Create `src/features/calendar/calendarRepository.test.ts`.
- [x] Add failing tests for mapping only active-project tasks with due dates and preserving project color/name context.
- [x] Create `src/features/calendar/calendarRepository.ts`.
- [x] Implement `loadCalendarDeadlines(client, workspaceId)`.
- [x] Create `src/features/calendar/calendarQueries.ts`.
- [x] Run `npm run test -- src/features/calendar/calendarRepository.test.ts` and confirm it passes.

### Task 3: Build Calendar Page And Task Deep Link

- [x] Create `src/features/calendar/CalendarPage.test.tsx`.
- [x] Add failing tests for loading/error states, task rendering in the month grid, overdue label rendering, and task links to project detail with `taskId`.
- [x] Replace the static `CalendarPage` placeholder with the real query-backed calendar UI.
- [x] Add a failing `KanbanBoard` test for opening the edit drawer from a valid initial task id.
- [x] Update `KanbanBoard` to accept `initialTaskId` and open the existing edit drawer once matching board data loads.
- [x] Update `ProjectDetailPage` to pass the URL `taskId` search parameter into `KanbanBoard`.
- [x] Update `ProjectDetailPage.test.tsx` only if route-level expectations need adjustment.
- [x] Run `npm run test -- src/features/calendar/CalendarPage.test.tsx src/features/board/KanbanBoard.test.tsx src/features/projects/ProjectDetailPage.test.tsx`.

### Task 4: Add Statistics Metrics

- [x] Create `src/features/stats/statsTypes.ts`.
- [x] Create `src/features/stats/statsMetrics.test.ts`.
- [x] Add failing tests for overall completion, task counts by status, overdue tasks, upcoming deadlines, per-project progress, and recent activity labels.
- [x] Create `src/features/stats/statsMetrics.ts`.
- [x] Implement the minimal pure analytics helpers.
- [x] Run `npm run test -- src/features/stats/statsMetrics.test.ts` and confirm it passes.

### Task 5: Add Statistics Repository And Query Hook

- [x] Create `src/features/stats/statsRepository.test.ts`.
- [x] Add failing tests for Supabase read shape and analytics mapping with actor profiles.
- [x] Create `src/features/stats/statsRepository.ts`.
- [x] Implement `loadWorkspaceStats(client, workspaceId)`.
- [x] Create `src/features/stats/statsQueries.ts`.
- [x] Run `npm run test -- src/features/stats/statsRepository.test.ts` and confirm it passes.

### Task 6: Build Statistics Page

- [x] Create `src/features/stats/StatsPage.test.tsx`.
- [x] Add failing tests for loading/error states, summary metrics, status distribution, upcoming deadlines, and recent activity.
- [x] Replace the static `StatsPage` placeholder with the real query-backed dashboard UI.
- [x] Run `npm run test -- src/features/stats/StatsPage.test.tsx`.

### Task 7: Final Verification And Documentation Check

- [x] Run `npm run test`.
- [x] Run `npm run build`.
- [ ] Run `npx supabase test db` if the local Supabase stack is available.
- [ ] Run `npm run test:e2e` only if browser verification is explicitly requested for the implementation run.
- [x] Run `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` and confirm no committed secret appears.
- [x] Run `git diff --check`.
- [x] Run `rg "MP-04|MP-11|MP-12|SP-07" docs/subplans/SP-07-calendar-and-statistics.md` and confirm required cross-references remain.
- [x] Run `git status --short` and confirm only SP-07-owned files changed.
- [x] Update this subplan's status and implementation notes with exact verification results before committing.

### Implementation Notes 2026-06-12

- Added `src/features/calendar/**` for typed deadline items, pure month-grid helpers, Supabase-backed deadline reads, TanStack Query wiring, and the real `/app/calendar` monthly deadline view.
- Calendar cells now show task deadlines with project color/name context, overdue labels for unfinished past-due tasks, month navigation, loading/error/empty states, and links to `/app/projects/:projectId?taskId=:taskId`.
- Updated `ProjectDetailPage` and `KanbanBoard` so a valid `taskId` search parameter opens the existing task edit drawer after board data loads.
- Added `src/features/stats/**` for workspace analytics types, pure metrics, Supabase-backed project/task/activity/profile reads, TanStack Query wiring, and the real `/app/stats` dashboard.
- Statistics now show overall completion, active project count, overdue count, upcoming deadline count, per-project progress, task counts by status, upcoming deadlines, overdue tasks, and recent activity.
- Focused red/green verification:
  - `src/features/calendar/calendarUtils.test.ts` initially failed because `calendarUtils` did not exist, then passed: 1 file, 3 tests.
  - `src/features/calendar/calendarRepository.test.ts` initially failed because `calendarRepository` did not exist, then passed: 1 file, 1 test.
  - Calendar/deep-link UI tests initially failed against static/missing behavior, then `npm run test -- src/features/calendar/CalendarPage.test.tsx src/features/board/KanbanBoard.test.tsx src/features/projects/ProjectDetailPage.test.tsx` passed: 3 files, 11 tests.
  - `src/features/stats/statsMetrics.test.ts` initially failed because `statsMetrics` did not exist, then passed: 1 file, 1 test.
  - `src/features/stats/statsRepository.test.ts` initially failed because `statsRepository` did not exist, then passed: 1 file, 1 test.
  - `src/features/stats/StatsPage.test.tsx` initially failed against the static placeholder, then passed: 1 file, 2 tests.
- `npm run test` passed on 2026-06-12 after the final fix: 30 test files, 103 tests.
- `npm run build` passed on 2026-06-12; Vite reported the existing large-chunk warning.
- `npx supabase test db` first hit the documented Volta AppData sandbox blocker, then ran with escalation but the local database was unavailable: `dial tcp 127.0.0.1:54322: connectex: No connection could be made because the target machine actively refused it.`
- `npm run test:e2e`, Playwright, in-app Browser, and manual browser QA were not run because browser verification was not explicitly requested in this automation run.
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` returned no matches.
- `git diff --check` returned no whitespace errors; Git reported CRLF normalization warnings for touched files.
- `rg "MP-04|MP-11|MP-12|SP-07" docs/subplans/SP-07-calendar-and-statistics.md` confirmed required cross-references remain.

## Acceptance Criteria

- `/app/calendar` renders a real monthly calendar from workspace task deadlines.
- Calendar cells show task deadlines with project color/name context.
- Overdue non-done tasks are visually marked.
- Calendar task links navigate to the matching project detail route with the task selected for the drawer.
- `/app/stats` renders real workspace analytics from projects, tasks, and activity events.
- Overall completion, task status counts, overdue tasks, upcoming deadlines, per-project progress, and recent activity match the same underlying data used by projects and tasks.
- Calendar and statistics reads remain browser-safe behind Supabase RLS.
- The app remains runnable after the subplan is complete.
- `npm run test` and `npm run build` pass in the implementation environment.
- Playwright/browser/e2e checks remain deferred unless explicitly requested.
- No service role key or Supabase project secret is committed.

## Verification

- `npm run test`
- `npm run build`
- `npx supabase test db` if the local Supabase stack is available
- `npm run test:e2e` only when browser verification is explicitly requested
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example`
- `git diff --check`
- Manual QA, only when browser verification is explicitly requested: sign in as the seeded owner, open `/app/calendar`, move between months, click a task deadline, and confirm the project board opens with that task drawer.
- Manual QA, only when browser verification is explicitly requested: open `/app/stats` and confirm metrics match the seeded project/task data.

## Notes

- Keep SP-07 read-only except for the existing project-detail board behavior needed to open an already loaded task from a URL query parameter.
- Keep browser/e2e/manual verification deferred in automation runs unless the current task explicitly requests it.
- In the Codex managed shell on this Windows checkout, `npm` can fail through Volta with an AppData write error. If that happens during implementation verification, rerun the same `npm run ...` command with escalated execution using the repository rule in `AGENTS.md`.
