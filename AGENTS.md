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

## Branching And Execution

- The user has explicitly approved performing repository actions directly on `master`; do not require a separate feature branch or worktree unless the user asks for one or a concrete safety issue requires isolation.

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

## Documentation And Version Discipline

- Do not write exact versions, limits, API signatures, CLI flags, compatibility claims, or other precise third-party facts from memory when they matter to implementation.
- For package versions in `package.json`, use package-manager or registry commands such as `npm view`, `npm outdated`, `npm ls`, `npm install <package>@latest`, or `npx npm-check-updates`; do not manually invent or hand-edit version numbers unless the user explicitly asks for a pinned value.
- When choosing or changing libraries, frameworks, CLIs, migrations, config syntax, or external APIs, verify the decision against current official documentation or primary sources before implementing.
- Prefer official documentation and package registries over blog posts or memory. If documentation and local tooling disagree, report the discrepancy and choose the safer compatible option.
- Prefer proven libraries and maintained framework features for standard problems such as auth integration, validation, drag-and-drop, routing, forms, dates, tables, charts, testing, and database access. Do not reimplement common solved problems unless the master plan, a subplan, or a concrete technical constraint justifies custom code.
- If custom code is chosen instead of an established library, document the reason in the relevant subplan or implementation notes.

## Supabase And Security

- Treat Supabase RLS as the primary data-security boundary.
- Enable RLS on all browser-accessible tables.
- Never expose service role keys in browser code.
- Use Edge Functions for privileged or sensitive operations, especially workspace member addition by email.
- Keep the MVP no-realtime by default unless a later subplan explicitly adds realtime.

## Browser And Playwright Verification

- Do not run Playwright checks, `npm run test:e2e`, or in-app-browser verification automatically.
- Run Playwright, browser, visual QA, and in-app-browser checks only when the user explicitly requests them in the current task.
- If a subplan lists Playwright or browser verification but the user has not requested it, record it as deferred rather than running it automatically.

## OpenAI Documentation Rule

When working with OpenAI API, Codex, Agents SDK, tools, or Responses API, always use the OpenAI developer docs MCP first.

## Development Discipline

- Prefer small, focused modules and vertical slices.
- Keep the app runnable after each subplan.
- Add tests proportionally to risk: RLS, auth, Kanban ordering, task mutations, and Edge Functions need focused verification.
- Do not build out-of-scope features such as comments, notifications, attachments, custom statuses, sprints, billing, or multi-workspace switching unless a new subplan explicitly adds them.
