# SP-05 Kanban And Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps should use checkbox syntax for tracking during execution.

**Status:** Implemented and locally verified; browser/e2e deferred
**Master references:** `MP-02`, `MP-03`, `MP-04`, `MP-05`, `MP-06`, `MP-07`, `MP-08`, `MP-09`, `MP-11`, `MP-12`, `MP-13`, `MP-14`, `MP-15`
**Depends on:** `SP-01-foundation.md`, `SP-02-supabase-schema.md`, `SP-03-auth-and-workspace.md`, `SP-04-project-list.md`
**Goal:** Replace the static project-detail task list with a Supabase-backed Kanban board, task drawer, task CRUD, and drag-and-drop status/ordering workflow.
**Architecture:** The project detail route keeps ownership of the project header and visit tracking from SP-04, while new `board` and `tasks` feature modules own Kanban rendering, task form state, task repository calls, and drag-and-drop ordering. Server state stays in TanStack Query; Supabase RLS remains the security boundary; drag moves use optimistic updates with rollback on mutation failure.
**Tech Stack:** React, TypeScript, React Router, TanStack Query, Supabase JS, Supabase Postgres/RLS, MUI, MUI Icons, Zod, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, Vitest, React Testing Library, Playwright only when browser verification is explicitly requested.

---

## Scope

### In Scope

- Install the maintained dnd-kit packages through the package manager; do not hand-edit package versions.
- Replace the static task rows in `ProjectDetailPage` with a real Kanban board as the default project detail work area.
- Load tasks, labels, task-label joins, workspace members, and member profiles for the current project.
- Render the five MVP statuses from `MP-11`: `backlog`, `todo`, `in_progress`, `review`, and `done`.
- Keep every Kanban column visible, including empty columns.
- Sort tasks within each column by numeric `position`.
- Create tasks with title, description, status, priority, assignee, due date, and labels.
- Edit existing task fields from a right-side drawer on desktop and a usable full-width/full-height layout on small screens.
- Move tasks between columns and reorder tasks inside a column with drag-and-drop.
- Persist task status and position after each move.
- Use optimistic updates for drag moves and task edits where the local state can be rolled back safely.
- Roll back failed moves and show a Russian error message without leaving the board blank.
- Insert `activity_events` for task creation, task updates, and task moves so SP-07 can use recent activity later.
- Invalidate or update project list/detail caches so progress reflects completed tasks after mutations.
- Add focused tests for task grouping, position calculation, repository payloads, query invalidation, drawer submit behavior, and board rendering.
- Keep the dark compact visual direction from `docs/assets/reference-design/screenshot-01-project-detail-task-list.png`.

### Out Of Scope

- Team member addition by email and the `add-workspace-member` Edge Function.
- Calendar page data wiring and statistics dashboard data wiring.
- Project overview tab and project-specific statistics tab data wiring beyond keeping the tab labels visible.
- Task comments, notifications, file attachments, custom statuses, sprints, bulk task actions, task hard delete, and realtime updates.
- Changing SP-02 RLS policies or database schema unless a focused implementation blocker is found and documented before changing scope.
- Running Playwright, `npm run test:e2e`, or in-app Browser verification unless explicitly requested in the implementation task.

## Files And Responsibilities

- `package.json`: add dnd-kit runtime dependencies through `npm install`.
- `package-lock.json`: package-manager generated dependency lock updates.
- `src/features/board/boardConstants.ts`: canonical Kanban statuses, labels, colors, and status ordering.
- `src/features/board/boardTypes.ts`: board-facing task, column, drag, and move types.
- `src/features/board/taskGrouping.ts`: pure helpers that group and sort tasks by status.
- `src/features/board/taskGrouping.test.ts`: tests for visible empty columns and position sorting.
- `src/features/board/taskPositioning.ts`: pure helpers that calculate numeric positions for append, prepend, between-task, and cross-column moves.
- `src/features/board/taskPositioning.test.ts`: tests for empty column, end-of-column, between-neighbor, and same-column reorder cases.
- `src/features/board/KanbanBoard.tsx`: board composition, dnd-kit context, drag events, column rendering, and create/edit drawer coordination.
- `src/features/board/KanbanBoard.test.tsx`: component tests for column rendering, task cards, empty states, and drawer opening.
- `src/features/board/BoardColumn.tsx`: one sortable Kanban column with header, task count, empty state, and task list.
- `src/features/tasks/taskTypes.ts`: task rows, labels, members, form values, mutation inputs, and mapped task view models.
- `src/features/tasks/taskSchemas.ts`: Zod schemas for create/edit task form values.
- `src/features/tasks/taskSchemas.test.ts`: validation tests for required title, trimmed optional fields, allowed status, allowed priority, due date clearing, and labels.
- `src/features/tasks/taskFormatters.ts`: date, priority, assignee, and label display helpers.
- `src/features/tasks/taskRepository.ts`: typed Supabase reads and writes for project board data, task create/update/move, task labels, and task activity events.
- `src/features/tasks/taskRepository.test.ts`: mocked Supabase-client tests for query shape, insert/update payloads, label replacement, move payloads, and activity events.
- `src/features/tasks/taskQueries.ts`: TanStack Query keys and hooks for project board load, task create, task update, task move, optimistic updates, rollback, and cache invalidation.
- `src/features/tasks/taskQueries.test.tsx`: hook tests for query keys, invalidation, and optimistic move rollback.
- `src/features/tasks/TaskCard.tsx`: compact Kanban task card with priority, due date, labels, assignee, and completed styling.
- `src/features/tasks/TaskDrawer.tsx`: right-side task detail drawer with create/edit modes and responsive small-screen layout.
- `src/features/tasks/TaskForm.tsx`: controlled MUI form for task fields and label selection.
- `src/features/tasks/TaskDrawer.test.tsx`: tests for create submit, edit submit, validation errors, and clearable optional fields.
- `src/features/projects/ProjectDetailPage.tsx`: remove static task data and render `KanbanBoard` with the loaded project id, workspace id, current user id, and project metadata.
- `src/features/projects/ProjectDetailPage.test.tsx`: update tests to cover board loading, loaded project header plus board, visit recording, and missing project state.
- `src/app/router/AppRouter.test.tsx`: update only if project detail loading or text expectations change.
- `tests/smoke.spec.ts`: optional Playwright coverage for create-task and drag-to-done flow only when browser verification is explicitly requested.

## Data And Interface Changes

- No schema migration is planned for SP-05.
- Reads:
  - `tasks` filtered by authenticated `workspace_id` and `project_id`;
  - `labels` filtered by authenticated `workspace_id`;
  - `task_labels` for loaded project tasks;
  - `workspace_members` filtered by authenticated `workspace_id`;
  - `profiles` for loaded workspace member user IDs.
- Writes:
  - insert into `tasks` with `workspace_id`, `project_id`, `created_by`, `title`, `description`, `status`, `priority`, `assignee_id`, `due_date`, and `position`;
  - update `tasks` for editable task fields;
  - update `tasks.status` and `tasks.position` for drag moves;
  - replace task labels by deleting existing `task_labels` rows for the task and inserting the selected label IDs;
  - insert `activity_events` with `task_created`, `task_updated`, and `task_moved` event types.
- Component contracts:
  - `KanbanBoard` receives authenticated `workspaceId`, `projectId`, `currentUserId`, and a project display context.
  - `TaskDrawer` receives create/edit mode, available labels, available assignees, initial values, submit state, and error state.
  - `taskQueries` invalidates the board query and the existing `projectQueryKeys.list/detail` caches after mutations that affect progress.
- Positioning contract:
  - New first task in an empty column uses position `1000`.
  - Appending after the last task uses previous position plus `1000`.
  - Inserting between two neighboring tasks uses the midpoint between their positions.
  - If a same-column reorder does not change the effective index, no mutation is sent.

## Tasks

### Task 1: Add dnd-kit And Board Constants

- [x] Run `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` and let npm choose compatible current versions.
- [x] Confirm `package.json` and `package-lock.json` changed only through npm.
- [x] Create `src/features/board/boardConstants.ts` with the five MVP status keys, Russian display labels, and stable ordering.
- [x] Create `src/features/board/boardTypes.ts` with `TaskStatus`, `TaskPriority`, `BoardTask`, `BoardColumnView`, and `TaskMoveInput`.
- [x] Run `npm run build` and fix only typing issues introduced by these files.

### Task 2: Add Grouping And Position Helpers

- [x] Create `src/features/board/taskGrouping.ts`.
- [x] Implement `groupTasksByStatus(tasks)` so it always returns all five status columns and sorts each column by ascending `position`.
- [x] Create `src/features/board/taskGrouping.test.ts`.
- [x] Test that empty columns are present when no tasks exist.
- [x] Test that tasks are sorted by `position` inside each status.
- [x] Create `src/features/board/taskPositioning.ts`.
- [x] Implement `calculateTaskMovePosition({ activeTaskId, overTaskId, targetStatus, targetIndex, tasksByStatus })`.
- [x] Create `src/features/board/taskPositioning.test.ts`.
- [x] Test empty-column insert returns `1000`.
- [x] Test append returns previous last position plus `1000`.
- [x] Test between-task insert returns the midpoint.
- [x] Test same-column no-op returns `null`.
- [x] Run `npm run test -- src/features/board/taskGrouping.test.ts src/features/board/taskPositioning.test.ts`.

### Task 3: Add Task Validation And Formatting

- [x] Create `src/features/tasks/taskTypes.ts`.
- [x] Define task form values and mutation input types using `Tables<'tasks'>`, `Tables<'labels'>`, `Tables<'task_labels'>`, `Tables<'workspace_members'>`, and `Tables<'profiles'>`.
- [x] Create `src/features/tasks/taskSchemas.ts`.
- [x] Add a Zod schema where title is required after trim, description is nullable after trim, status and priority must be one of the MVP values, assignee is nullable, due date is nullable, and selected label IDs are unique.
- [x] Create `src/features/tasks/taskSchemas.test.ts`.
- [x] Test valid create values, missing title, invalid status, invalid priority, duplicate labels, and clearing nullable fields.
- [x] Create `src/features/tasks/taskFormatters.ts`.
- [x] Add formatting helpers for priority label/tone, due date text, overdue tone, assignee display name, and empty labels.
- [x] Run `npm run test -- src/features/tasks/taskSchemas.test.ts`.

### Task 4: Add Supabase Task Repository

- [x] Create `src/features/tasks/taskRepository.ts`.
- [x] Add `loadProjectBoard(client, workspaceId, projectId)` that loads tasks, labels, task-label joins, workspace members, and profiles.
- [x] Map loaded rows into `BoardTask[]`, available labels, and available assignees without leaking rows outside the authenticated workspace.
- [x] Add `createTask(client, input)` that inserts one task, replaces task labels when label IDs are provided, and inserts a `task_created` activity event.
- [x] Add `updateTask(client, input)` that updates editable task fields, replaces task labels, and inserts a `task_updated` activity event.
- [x] Add `moveTask(client, input)` that updates `status` and `position`, then inserts a `task_moved` activity event.
- [x] Create `src/features/tasks/taskRepository.test.ts`.
- [x] Test board data mapping with tasks, labels, task-label joins, and assignees.
- [x] Test create-task payload includes `workspace_id`, `project_id`, `created_by`, and computed `position`.
- [x] Test update-task payload does not modify immutable fields such as `workspace_id`, `project_id`, or `created_by`.
- [x] Test label replacement deletes old task labels and inserts the selected labels.
- [x] Test move-task payload updates only `status` and `position`.
- [x] Test activity events are inserted after successful create, update, and move mutations.
- [x] Run `npm run test -- src/features/tasks/taskRepository.test.ts`.

### Task 5: Add Task Query Hooks

- [x] Create `src/features/tasks/taskQueries.ts`.
- [x] Define stable query keys for project board data by `workspaceId` and `projectId`.
- [x] Add `useProjectBoardQuery(workspaceId, projectId)`.
- [x] Add `useCreateTaskMutation()`.
- [x] Add `useUpdateTaskMutation()`.
- [x] Add `useMoveTaskMutation()` with optimistic board cache update and rollback on error.
- [x] Invalidate the project board query after create/update/move.
- [x] Invalidate `projectQueryKeys.list(workspaceId, userId)` and `projectQueryKeys.detail(workspaceId, projectId)` after mutations that can change progress.
- [x] Create `src/features/tasks/taskQueries.test.tsx`.
- [x] Test mutation success invalidates board and project caches.
- [x] Test optimistic move updates the cached task status and position.
- [x] Test optimistic move rollback restores the previous board data when the mutation rejects.
- [x] Run `npm run test -- src/features/tasks/taskQueries.test.tsx`.

### Task 6: Build Task Drawer

- [x] Create `src/features/tasks/TaskForm.tsx`.
- [x] Render controlled MUI inputs for title, description, status, priority, assignee, due date, and labels.
- [x] Keep status and priority controls constrained to the constants from `boardConstants.ts`.
- [x] Create `src/features/tasks/TaskDrawer.tsx`.
- [x] Support `create` and `edit` modes with Russian submit/cancel copy and compact dark styling.
- [x] Render as a right-side drawer on desktop and a full-width/full-height drawer on small screens.
- [x] Show validation errors inline and mutation errors at the top of the drawer.
- [x] Create `src/features/tasks/TaskDrawer.test.tsx`.
- [x] Test create submit sends trimmed values.
- [x] Test edit submit includes the task id and preserves unchanged fields.
- [x] Test missing title prevents submit.
- [x] Test clearing assignee, due date, and labels sends nullable/empty values.
- [x] Run `npm run test -- src/features/tasks/TaskDrawer.test.tsx`.

### Task 7: Build Kanban Board UI

- [x] Create `src/features/tasks/TaskCard.tsx`.
- [x] Render task title, priority, due date, labels, assignee, and completed styling without text overlap on narrow containers.
- [x] Create `src/features/board/BoardColumn.tsx`.
- [x] Render a sortable column header, task count, visible empty state, and task cards.
- [x] Create `src/features/board/KanbanBoard.tsx`.
- [x] Load board data with `useProjectBoardQuery`.
- [x] Open `TaskDrawer` from the add-task control with default status `todo`.
- [x] Open `TaskDrawer` in edit mode when a task card is clicked.
- [x] Wire dnd-kit drag end to `calculateTaskMovePosition` and `useMoveTaskMutation`.
- [x] Show a non-blocking Russian error message when move/create/update fails.
- [x] Create `src/features/board/KanbanBoard.test.tsx`.
- [x] Test all five columns render.
- [x] Test empty columns remain visible.
- [x] Test task cards render labels, assignee, priority, and due date.
- [x] Test clicking add task opens the create drawer.
- [x] Test clicking a task opens the edit drawer.
- [x] Run `npm run test -- src/features/board/KanbanBoard.test.tsx`.

### Task 8: Wire Project Detail Page

- [x] Update `src/features/projects/ProjectDetailPage.tsx`.
- [x] Remove the static task array and `TaskRow` component.
- [x] Render `KanbanBoard` inside the default tasks tab after the real project header.
- [x] Pass `workspace.id`, `project.id`, `user.id`, `project.name`, and `project.displayColor` into `KanbanBoard`.
- [x] Keep existing project loading, error, not-found, header, deadline, progress, and visit-recording behavior.
- [x] Keep project overview and statistics tabs visible but do not wire their data in SP-05.
- [x] Update `src/features/projects/ProjectDetailPage.test.tsx`.
- [x] Test a loaded project renders the real header and the board.
- [x] Test visit recording still happens once per loaded project.
- [x] Test missing project still renders the controlled not-found state.
- [x] Update `src/app/router/AppRouter.test.tsx` only if route-level expectations change.
- [x] Run `npm run test -- src/features/projects/ProjectDetailPage.test.tsx src/app/router/AppRouter.test.tsx`.

### Task 9: Update Smoke Coverage Only When Browser Verification Is Requested

- [ ] If the current implementation task explicitly requests browser verification, update `tests/smoke.spec.ts`.
- [ ] Keep the seeded-owner sign-in helper.
- [ ] Add a smoke step that creates a task in a seeded project.
- [ ] Add a smoke step that moves a task to `Done` and confirms the project progress changes.
- [ ] Run `npm run test:e2e` only when browser verification is explicitly requested.
- [ ] If browser verification is not requested, leave this task unchecked during implementation closure and record it as deferred.

### Task 10: Final Verification And Documentation Check

- [x] Run `npm run test`.
- [x] Run `npm run build`.
- [x] Run `npx supabase test db` if the local Supabase stack is available.
- [ ] Run `npm run test:e2e` only if browser verification is explicitly requested for the implementation run.
- [x] Run `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` and confirm no committed secret appears.
- [x] Run `rg "MP-05|MP-07|MP-11|MP-12|SP-05" docs/subplans/SP-05-kanban-and-tasks.md` and confirm required cross-references remain.
- [x] Run `git status --short` and confirm only SP-05-owned files changed.
- [x] Update this subplan's status and implementation notes with exact verification results before asking for commit.


### Implementation Notes 2026-06-12

- Installed `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` through npm; the first sandboxed attempt hit the documented Volta AppData write error, and the escalated install completed successfully.
- Added board/task modules for status constants, task grouping, position calculation, Supabase-backed board data, task create/update/move mutations, optimistic drag-move rollback, task drawer forms, task cards, and Kanban columns.
- Replaced the static project-detail task list with `KanbanBoard` while preserving the SP-04 real project header and visit recording.
- `npm run test` passed on 2026-06-12: 19 test files, 72 tests.
- `npm run build` passed on 2026-06-12; Vite reported the existing large-chunk warning.
- `npx supabase test db` passed on 2026-06-12 after Volta escalation: 3 files, 53 database tests.
- `rg "service_role|SUPABASE_SERVICE_ROLE|sb_secret|eyJ" supabase src .env.example` returned no matches.
- `rg "MP-05|MP-07|MP-11|MP-12|SP-05" docs/subplans/SP-05-kanban-and-tasks.md` confirmed required cross-references remain.
- `git diff --check` returned no whitespace errors; Git reported CRLF normalization warnings for `ProjectDetailPage.tsx` and `ProjectDetailPage.test.tsx`.
- `npm run test:e2e`, Playwright, and manual/browser QA were not run because this automation run did not explicitly request browser verification; Task 9 remains deferred.
## Acceptance Criteria

- `/app/projects/:projectId` renders a Kanban board backed by Supabase task data instead of static task rows.
- The board shows the five MVP columns in stable order and keeps empty columns visible.
- Tasks are sorted by `position` inside each column.
- A workspace member can create a task with title, description, status, priority, assignee, due date, and labels.
- A workspace member can edit those same task fields from the task drawer.
- Dragging a task within a column updates its position.
- Dragging a task across columns updates both `status` and `position`.
- Failed task moves roll back the UI and show an error.
- Project progress updates after tasks move into or out of `done`.
- Task mutations insert activity events for later statistics/recent-activity work.
- The app remains runnable after the subplan is complete.
- `npm run test` and `npm run build` pass in the implementation environment.
- Playwright smoke coverage passes only if browser verification is explicitly requested.
- No service role key or Supabase project secret is committed.

## Verification

- `npm run test`
- `npm run build`
- `npx supabase test db` if the local Supabase stack is available
- `npm run test:e2e` only when browser verification is explicitly requested
- Manual QA, only when browser verification is explicitly requested: sign in as `owner@example.com` / `password123`, open a seeded project, create a task, edit it, move it across Kanban columns, and confirm progress changes after moving to `Done`.
- Manual QA, only when browser verification is explicitly requested: check a narrow viewport and confirm the board scrolls horizontally and the task drawer remains usable without text overlap.

## Notes

- The implementation must keep SP-05 independent from SP-06. It may read existing workspace members for assignee choices, but member invitation/addition remains out of scope.
- The implementation must keep SP-05 independent from SP-07. It may insert task activity events and update task due dates, but calendar/statistics pages remain out of scope.
- In this repository, do not run Playwright or in-app-browser verification unless the user explicitly requests it in the current task.
- In the Codex managed shell on this Windows checkout, `npm` can fail through Volta with an AppData write error. If that happens during implementation verification, rerun the same `npm run ...` command with escalated execution using the repository rule in `AGENTS.md`.
- If task drag-and-drop reveals a real schema or RLS blocker, document the blocker in this file before expanding scope beyond frontend/task-query work.
