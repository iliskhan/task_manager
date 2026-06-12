# SP-04 Project List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps should use checkbox syntax for tracking during execution.

**Status:** Implemented and locally verified, including explicit browser smoke
**Master references:** `MP-02`, `MP-03`, `MP-04`, `MP-05`, `MP-06`, `MP-07`, `MP-08`, `MP-09`, `MP-11`, `MP-12`, `MP-13`, `MP-14`, `MP-15`
**Depends on:** `SP-01-foundation.md`, `SP-02-supabase-schema.md`, `SP-03-auth-and-workspace.md`
**Goal:** Replace the static first authenticated screen with a Supabase-backed project list that supports project creation, owner-only project maintenance, search/filter/sort, computed progress, and project visit tracking.
**Architecture:** The projects feature owns project-specific query hooks, mutation hooks, mapping helpers, and page components. Data access stays browser-safe through the existing typed Supabase client and SP-02 RLS policies; the authenticated workspace and user come from `useAuth`.
**Tech Stack:** React, TypeScript, React Router, TanStack Query, Supabase JS, Supabase Postgres/RLS, MUI, Zod, Vitest, React Testing Library, Playwright when browser verification is explicitly requested.

---

## Scope

### In Scope

- Replace the hard-coded project rows in `ProjectsPage` with workspace-scoped Supabase data.
- Query active and archived projects for the authenticated workspace.
- Compute project progress from `tasks` rows using `done task count / total project task count`; render `0%` when a project has no tasks.
- Read the current user's `project_visits` rows and render last-visited metadata.
- Upsert `project_visits` when a user opens `/app/projects/:projectId`.
- Add client-side project search by name and description.
- Add active/archived/all filter behavior using `projects.archived_at`.
- Add sort behavior for deadline, progress, last visit, and creation date.
- Add create-project flow for authenticated workspace members.
- Add owner-only edit and archive actions for project basics because the current SP-02 RLS policy allows project updates only to owners.
- Insert `activity_events` for project creation, update, and archive mutations.
- Add loading, empty, and error states that fit the existing dark Russian UI.
- Keep the existing visual direction close to `docs/assets/reference-design/screenshot-02-project-list-overview.png`.
- Add focused tests for progress calculation, filtering/sorting, project queries/mutations, and page behavior.

### Out Of Scope

- Kanban columns, drag-and-drop, task drawer, task CRUD, assignee changes, label editing, and optimistic task movement.
- Project-specific Kanban board implementation inside `/app/projects/:projectId`.
- Team member addition by email and the `add-workspace-member` Edge Function.
- Calendar data wiring and statistics dashboard data wiring.
- Hard delete for projects.
- Changing SP-02 RLS policies to let members update project basics.
- Realtime updates, comments, notifications, attachments, custom statuses, sprints, billing, production deployment, and multi-workspace switching.

## Files And Responsibilities

- `src/features/projects/projectTypes.ts`: project feature types derived from `src/lib/supabase/database.types.ts`.
- `src/features/projects/projectMetrics.ts`: pure progress and task-count calculations.
- `src/features/projects/projectMetrics.test.ts`: focused tests for progress calculation, zero-task behavior, and status counting.
- `src/features/projects/projectFormatters.ts`: deadline, last-visit, and project color/icon formatting helpers.
- `src/features/projects/projectFormatters.test.ts`: focused tests for deadline status and missing visit/deadline display.
- `src/features/projects/projectFilters.ts`: pure search, active/archive filter, and sort helpers.
- `src/features/projects/projectFilters.test.ts`: focused tests for search/filter/sort combinations.
- `src/features/projects/projectRepository.ts`: typed Supabase reads and writes for projects, tasks, project visits, and project activity events.
- `src/features/projects/projectRepository.test.ts`: mocked Supabase-client tests for query branching and mutation payloads.
- `src/features/projects/projectQueries.ts`: TanStack Query hooks and cache keys for project list, project detail, and project mutations.
- `src/features/projects/ProjectFormDialog.tsx`: create/edit project dialog with Zod validation and compact MUI controls.
- `src/features/projects/ProjectActionsMenu.tsx`: owner-only project edit/archive menu.
- `src/features/projects/ProjectCard.tsx`: presentational project row/card extracted from the current `ProjectsPage`.
- `src/features/projects/ProjectListControls.tsx`: search, active/archive filter, and sorting controls.
- `src/features/projects/ProjectsPage.tsx`: page composition, authenticated workspace wiring, list states, dialogs, and mutation feedback.
- `src/features/projects/ProjectsPage.test.tsx`: page behavior tests with mocked hooks and auth context.
- `src/features/projects/ProjectDetailPage.tsx`: load real project header data and record the current user's project visit on open.
- `src/features/projects/ProjectDetailPage.test.tsx`: route/page behavior tests for real project metadata, missing project state, and visit recording.
- `src/app/router/AppRouter.test.tsx`: update expectations if project detail headings or loading states change.
- `tests/smoke.spec.ts`: optional Playwright smoke updates for seeded project list and create-project flow when browser verification is explicitly requested.

## Data And Interface Changes

- No new database tables or migrations are required.
- Reads:
  - `projects` filtered by authenticated `workspace_id`;
  - `tasks` filtered by authenticated `workspace_id` and grouped by `project_id`;
  - `project_visits` filtered by current `user_id`;
  - one `projects` row for `/app/projects/:projectId`.
- Writes:
  - insert into `projects` with `workspace_id`, `name`, `description`, `icon_name`, `color`, `deadline`, and `created_by`;
  - owner-only update of project basics through existing `projects_update_owners` RLS policy;
  - owner-only archive by setting `projects.archived_at`;
  - upsert into `project_visits` for the current user when opening a project;
  - insert into `activity_events` for `project_created`, `project_updated`, and `project_archived`.
- Component contracts:
  - `ProjectsPage` consumes `workspace`, `user`, and `role` from `useAuth`.
  - Project query hooks require a non-null authenticated workspace before running.
  - Project edit/archive controls render only when `role === 'owner'`.
  - Create project stays available to owners and members, matching SP-02 insert policy.

## Tasks

### Task 1: Add Project Domain Helpers

- [x] Create `src/features/projects/projectTypes.ts` with typed aliases for project rows, task rows, project visits, project list items, filters, sort keys, and mutation inputs.
- [x] Create `src/features/projects/projectMetrics.ts`.
- [x] Implement progress calculation as:
  - numerator: tasks where `status === 'done'`;
  - denominator: all tasks for the project;
  - result: integer percentage rounded to the nearest whole number;
  - zero tasks: `0`.
- [x] Create `src/features/projects/projectMetrics.test.ts`.
- [x] Test `0%` for no tasks.
- [x] Test partial progress for mixed statuses.
- [x] Test `100%` when all project tasks are done.
- [x] Create `src/features/projects/projectFormatters.ts`.
- [x] Add deadline status formatting for no deadline, future deadline, today, and overdue.
- [x] Add last-visit formatting for no visit and known visit.
- [x] Create `src/features/projects/projectFormatters.test.ts`.
- [x] Run `npm run test -- src/features/projects/projectMetrics.test.ts src/features/projects/projectFormatters.test.ts`.

### Task 2: Add Search, Filter, And Sort Logic

- [x] Create `src/features/projects/projectFilters.ts`.
- [x] Implement case-insensitive search against project `name` and `description`.
- [x] Implement status filter values `active`, `archived`, and `all`.
- [x] Implement sort keys `deadline`, `progress`, `lastVisit`, and `createdAt`.
- [x] Keep projects without a deadline or visit at the end for deadline and visit sorting.
- [x] Create `src/features/projects/projectFilters.test.ts`.
- [x] Test search by title and description.
- [x] Test active and archived filtering.
- [x] Test each sort key with missing deadline and missing visit values.
- [x] Run `npm run test -- src/features/projects/projectFilters.test.ts`.

### Task 3: Add Supabase Project Repository

- [x] Create `src/features/projects/projectRepository.ts`.
- [x] Add `loadProjectList(client, workspaceId, userId)`:
  - read workspace projects;
  - read workspace tasks needed for progress counts;
  - read current user's project visits;
  - return mapped project list items.
- [x] Add `loadProjectDetail(client, workspaceId, projectId)`:
  - read one project;
  - reject or return `null` when the project is outside the current workspace.
- [x] Add `createProject(client, input)`:
  - insert a project under the current workspace;
  - set `created_by` to the current user;
  - insert a `project_created` activity event after the project insert succeeds.
- [x] Add `updateProject(client, input)`:
  - update project basics only;
  - insert a `project_updated` activity event after the update succeeds.
- [x] Add `archiveProject(client, input)`:
  - set `archived_at` to the current timestamp;
  - insert a `project_archived` activity event after the archive succeeds.
- [x] Add `recordProjectVisit(client, projectId, userId)`:
  - upsert `project_visits` by `(project_id, user_id)`;
  - set `visited_at` to the current timestamp.
- [x] Create `src/features/projects/projectRepository.test.ts`.
- [x] Test list mapping with projects, tasks, and visits.
- [x] Test create-project payload includes `workspace_id` and `created_by`.
- [x] Test edit/archive mutation payloads do not attempt hard delete.
- [x] Test project visit upsert payload uses the current user id.
- [x] Run `npm run test -- src/features/projects/projectRepository.test.ts`.

### Task 4: Add TanStack Query Hooks

- [x] Create `src/features/projects/projectQueries.ts`.
- [x] Define stable query keys for:
  - project list by workspace and user;
  - project detail by workspace and project id.
- [x] Add `useProjectListQuery(workspaceId, userId)`.
- [x] Add `useProjectDetailQuery(workspaceId, projectId)`.
- [x] Add `useCreateProjectMutation()`.
- [x] Add `useUpdateProjectMutation()`.
- [x] Add `useArchiveProjectMutation()`.
- [x] Add `useRecordProjectVisitMutation()`.
- [x] Invalidate the project list query after create, update, archive, and visit mutations.
- [x] Keep mutations free of global client state outside TanStack Query and the existing Supabase client.
- [x] Run `npm run test -- src/features/projects/projectRepository.test.ts`.

### Task 5: Build Project List UI Components

- [x] Extract the current project row markup from `ProjectsPage` into `src/features/projects/ProjectCard.tsx`.
- [x] Keep the compact dark row/card layout, progress bar, deadline text, last-visit text, and icon tile.
- [x] Create `src/features/projects/ProjectListControls.tsx`.
- [x] Wire controlled search input, active/archive/all select, and sort select.
- [x] Create `src/features/projects/ProjectActionsMenu.tsx`.
- [x] Render edit and archive actions only for owners.
- [x] Prevent the actions menu click from navigating the card link.
- [x] Create `src/features/projects/ProjectFormDialog.tsx`.
- [x] Add Zod validation:
  - project name is required and trimmed;
  - description is optional and trimmed;
  - deadline is optional;
  - color and icon use fixed option sets from the UI.
- [x] Use MUI dialog controls that preserve the existing dark theme and mobile layout.
- [x] Run `npm run build` to catch component typing issues.

### Task 6: Wire `ProjectsPage` To Real Data

- [x] Update `src/features/projects/ProjectsPage.tsx` to consume `workspace`, `user`, and `role` from `useAuth`.
- [x] Fetch projects through `useProjectListQuery`.
- [x] Replace the hard-coded `projects` array with query results.
- [x] Apply search/filter/sort helpers client-side to the fetched list.
- [x] Change the primary action label to `Новый проект`.
- [x] Open `ProjectFormDialog` for project creation.
- [x] Show mutation progress and errors in-page without leaving the user on a blank screen.
- [x] Render loading, empty, and error states with Russian copy.
- [x] Keep archived projects hidden by default under the `active` filter.
- [x] Create `src/features/projects/ProjectsPage.test.tsx`.
- [x] Test seeded-like projects render from mocked query data.
- [x] Test search and archived filter behavior.
- [x] Test create dialog validation and submit call.
- [x] Test owner-only actions are hidden for `member` and visible for `owner`.
- [x] Run `npm run test -- src/features/projects/ProjectsPage.test.tsx`.

### Task 7: Wire Project Detail Header And Visits

- [x] Update `src/features/projects/ProjectDetailPage.tsx` to read `projectId` from `useParams`.
- [x] Consume `workspace` and `user` from `useAuth`.
- [x] Fetch the project through `useProjectDetailQuery`.
- [x] Record a project visit once the project has loaded for the current user.
- [x] Replace the hard-coded project title, description, progress, and deadline header with real project data.
- [x] Keep Kanban board, task drawer, and task mutation behavior out of this subplan.
- [x] Add not-found/error/loading states for missing or inaccessible projects.
- [x] Create `src/features/projects/ProjectDetailPage.test.tsx`.
- [x] Test that a loaded project renders its real title and description.
- [x] Test that visit recording is called with the current user and route project id.
- [x] Test that missing project data shows a controlled not-found state.
- [x] Run `npm run test -- src/features/projects/ProjectDetailPage.test.tsx`.

### Task 8: Update Smoke Coverage Only When Browser Verification Is Requested

- [x] If the current task explicitly requests browser verification, update `tests/smoke.spec.ts`.
- [x] Keep the existing seeded-owner sign-in helper.
- [x] Assert the seeded Supabase projects render on `/app/projects`.
- [x] Assert creating a project through the UI adds a new row.
- [x] Assert opening a seeded project renders its real detail header.
- [x] Run `npm run test:e2e` only when browser verification is explicitly requested.
- [x] Confirm the no-browser-verification branch is not applicable because browser verification was explicitly requested and completed.

Completed on 2026-06-12 after explicit browser-verification approval: `tests/smoke.spec.ts` now opens the seeded project UUID instead of the retired placeholder route, and `npm run test:e2e` passes.

### Task 9: Final Verification And Documentation Check

- [x] Run `npx supabase db reset`.
- [x] Run `npx supabase test db`.
- [x] Run `npm run test`.
- [x] Run `npm run build`.
- [x] Run `npm run test:e2e` only if browser verification is explicitly requested for the implementation run.
- [x] Run `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` and confirm no committed secret appears.
- [x] Run `rg "MP-04|MP-05|MP-11|MP-12|SP-04" docs/subplans/SP-04-project-list.md` and confirm required cross-references remain.
- [x] Run `git status --short` and confirm only SP-04-owned files changed.

Completed on 2026-06-12 after explicit browser-verification approval: `npm run test:e2e` passes.

### Implementation Notes 2026-06-12

- `npm run test` passed: 12 test files, 46 tests.
- `npm run build` passed with Vite's existing chunk-size warning only.
- `npx supabase db reset` passed against the local Supabase stack.
- `npx supabase test db` passed: 3 files, 53 database tests.
- After explicit browser-verification approval, `npm run test:e2e` passed: 4 Chromium smoke tests, including seeded sign-in, project list navigation, project creation, and seeded project detail.
- In-app Browser smoke passed for `http://127.0.0.1:5173/login` -> `/app/projects` -> seeded project detail. Page title was `Task Manager`, the project list rendered seeded `Бизнес`, and detail rendered the real `Бизнес` header, tabs, progress, and task controls.
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` returned no matches.
- `git diff --check` returned no whitespace errors; Git reported CRLF normalization warnings for touched TS/TSX files.
- In the Codex managed shell, `npm` and `npx supabase` required escalated execution because Volta attempted to write under `C:\Users\iliskhan\AppData\Local\Volta`.
- A later attempt to rerun `npx supabase db reset` after the browser pass was rejected by the automatic escalation reviewer, so that cleanup rerun was not completed in this pass.

## Acceptance Criteria

- `/app/projects` renders projects from the authenticated workspace instead of static placeholder data.
- The seeded owner can see seeded projects after sign-in.
- Project progress is computed from task statuses and renders `0%` for projects with no tasks.
- Search, active/archive/all filtering, and deadline/progress/last-visit/created-date sorting work on the project list.
- An authenticated workspace member can create a project.
- Only owners see edit/archive actions, matching current project update RLS.
- Archiving a project removes it from the default active list and shows it under the archived/all filters.
- Opening `/app/projects/:projectId` records the current user's visit and renders real project header data.
- Project mutations insert activity events for future statistics/recent-activity work.
- The app remains runnable after the subplan is complete.
- `npm run test`, `npm run build`, Supabase reset, and Supabase database tests pass in the implementation environment.
- Playwright smoke coverage passes if browser verification is explicitly requested.
- No service role key or Supabase project secret is committed.

## Verification

- `npx supabase db reset`
- `npx supabase test db`
- `npm run test`
- `npm run build`
- `npm run test:e2e` only when browser verification is explicitly requested
- Manual QA, only when browser verification is explicitly requested: sign in as `owner@example.com` / `password123`, open `/app/projects`, verify seeded projects, create a project, archive it as owner, and confirm active/archive filters update.
- Manual QA, only when browser verification is explicitly requested: open a seeded project detail page and confirm the header uses real project data.

## Notes

- In this repository, do not run Playwright or in-app-browser verification unless the user explicitly requests it in the current task.
- In the Codex managed shell on this Windows checkout, `npm` can fail through Volta with an AppData write error. If that happens during implementation verification, rerun the same `npm run ...` command with escalated execution using the repository rule in `AGENTS.md`.
- Keep project list work independent from SP-05. This subplan may read `tasks` to compute progress, but it must not add task creation/editing, Kanban drag-and-drop, or task drawer behavior.
- If broader member edit permissions are desired later, update the master plan and SP-02 RLS policy deliberately before changing frontend behavior.
