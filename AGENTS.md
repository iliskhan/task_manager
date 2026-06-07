# Agent Instructions

This repository is a new React + Supabase Task Manager project. Before making product, architecture, or implementation decisions, read the project planning documents first.

## Required Reading Order

1. `docs/master-plan.md`
   - Main product and architecture source of truth.
   - Use `MP-XX` section IDs when referencing requirements.
2. `docs/subplans/README.md`
   - Explains how future implementation subplans are organized.
   - Use it before creating or executing a subplan.
3. `docs/subplans/_template.md`
   - Use this template for new subplans.

## Planning Rules

- Do not silently expand MVP scope.
- If implementation work does not fit the current master plan, update or discuss the master plan before changing product direction.
- Future implementation work should be split into subplans named like `SP-01-foundation.md`.
- Each subplan must reference relevant `MP-XX` sections from `docs/master-plan.md`.
- Keep subplans independently implementable and verifiable.

## Product Direction

- The app is a Russian-language team task manager.
- The UI should stay close to the provided screenshots: dark app shell, left sidebar, purple accents, project progress rows, compact work-focused layout.
- First screen after login is the project/task-space list with progress.
- Project detail should center on a Jira-like Kanban board.
- MVP uses one workspace, roles `owner` and `member`, project list, Kanban tasks, calendar, statistics, settings/team.

## Baseline Tech Stack

- React + TypeScript + Vite.
- MUI with a custom dark theme.
- React Router.
- TanStack Query.
- Supabase Auth, Postgres, Row Level Security, and Edge Functions.
- `@dnd-kit/core` and `@dnd-kit/sortable` for Kanban drag-and-drop.
- Zod for validation.
- Vitest and Playwright for verification.

## Supabase And Security

- Treat Supabase RLS as the primary data-security boundary.
- Enable RLS on all browser-accessible tables.
- Never expose service role keys in browser code.
- Use Edge Functions for privileged or sensitive operations, especially workspace member addition by email.
- Keep the MVP no-realtime by default unless a later subplan explicitly adds realtime.

## OpenAI Documentation Rule

When working with OpenAI API, Codex, Agents SDK, tools, or Responses API, always use the OpenAI developer docs MCP first.

## Development Discipline

- Prefer small, focused modules and vertical slices.
- Keep the app runnable after each subplan.
- Add tests proportionally to risk: RLS, auth, Kanban ordering, task mutations, and Edge Functions need focused verification.
- Do not build out-of-scope features such as comments, notifications, attachments, custom statuses, sprints, billing, or multi-workspace switching unless a new subplan explicitly adds them.

