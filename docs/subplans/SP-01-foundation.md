# SP-01 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps should use checkbox syntax for tracking during execution.

**Status:** Draft  
**Master references:** `MP-04`, `MP-05`, `MP-06`, `MP-07`, `MP-12`, `MP-13`, `MP-14`  
**Depends on:** None  
**Goal:** Create the runnable React + TypeScript + Vite foundation for the Russian-language task manager, including the dark MUI design system, app shell, routing, and placeholder screens.  
**Architecture:** The app is a Vite React SPA with providers in `src/app`, feature folders matching `MP-07`, and a reusable authenticated shell in `src/features/shell`. This subplan intentionally uses static placeholder content only so later Supabase, auth, project, Kanban, calendar, and statistics subplans can attach real data without replacing the foundation.  
**Tech Stack:** React, TypeScript, Vite, React Router, TanStack Query, MUI, Emotion, MUI Icons, Vitest, React Testing Library, Playwright.

---

## Scope

### In Scope

- Scaffold a Vite + React + TypeScript app that runs locally.
- Configure MUI with a custom dark theme based on `MP-05` and the reference screenshots in `docs/assets/reference-design/`.
- Configure React Router routes from `MP-04`.
- Configure TanStack Query provider with default client settings.
- Build a dark app shell with a left sidebar, Russian navigation labels, user profile block, and responsive collapse behavior.
- Build placeholder pages for login, projects, project detail, calendar, statistics, and settings.
- Add focused tests for initial render and route navigation.
- Add Playwright configuration for future E2E coverage and a smoke test if the app can be served during verification.

### Out Of Scope

- Supabase client configuration and environment variables.
- Supabase migrations, RLS policies, generated database types, or local Supabase setup.
- Real authentication, session persistence, protected-route enforcement, and logout behavior.
- Project CRUD, project progress calculation, project visit persistence, or search/filter/sort behavior backed by data.
- Kanban drag-and-drop, task drawer, task CRUD, task labels, assignee changes, and task mutations.
- Calendar deadline data, statistics calculations, team management, Edge Functions, realtime, notifications, comments, attachments, custom statuses, sprints, billing, and multi-workspace switching.

## Files And Responsibilities

- `package.json`: npm scripts and dependencies for the frontend foundation.
- `index.html`: Vite HTML entrypoint.
- `vite.config.ts`: Vite React plugin and Vitest test environment configuration.
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript project configuration.
- `playwright.config.ts`: Playwright smoke-test configuration.
- `src/main.tsx`: React root render.
- `src/App.tsx`: App provider composition and router attachment.
- `src/app/router/AppRouter.tsx`: Route tree and redirects.
- `src/app/providers/AppProviders.tsx`: MUI theme, CssBaseline, BrowserRouter, and QueryClientProvider.
- `src/app/theme/theme.ts`: MUI dark theme tokens, typography, palette, shape, and component overrides.
- `src/features/shell/AppShell.tsx`: Desktop-first app layout with sidebar and content region.
- `src/features/shell/Sidebar.tsx`: Logo, navigation, future nav placeholders, and user profile block.
- `src/features/auth/LoginPage.tsx`: Static login placeholder screen.
- `src/features/projects/ProjectsPage.tsx`: Static first authenticated screen placeholder based on reference screenshot 02.
- `src/features/projects/ProjectDetailPage.tsx`: Static project detail placeholder based on reference screenshot 01.
- `src/features/calendar/CalendarPage.tsx`: Static calendar placeholder.
- `src/features/stats/StatsPage.tsx`: Static statistics placeholder.
- `src/features/settings/SettingsPage.tsx`: Static settings placeholder.
- `src/shared/ui/PageHeader.tsx`: Reusable compact page title/header primitive.
- `src/test/setup.ts`: Testing Library setup.
- `src/app/router/AppRouter.test.tsx`: Router and navigation tests.
- `tests/smoke.spec.ts`: Playwright smoke test for the default app screen.

## Data And Interface Changes

- Adds frontend route interface:
  - `/login`
  - `/app/projects`
  - `/app/projects/:projectId`
  - `/app/calendar`
  - `/app/stats`
  - `/app/settings`
  - `/` redirects to `/app/projects`
- Adds the first reusable visual interface for later subplans:
  - dark sidebar shell;
  - purple active navigation state;
  - compact page header pattern;
  - panel/card surface styles;
  - Russian navigation labels.
- No database tables, RLS policies, Edge Functions, Supabase clients, API contracts, or mutation contracts are added in this subplan.

## Tasks

### Task 1: Scaffold Tooling And Project Entry

- [ ] Create `package.json` with scripts:
  - `dev`: `vite`
  - `build`: `tsc -b && vite build`
  - `preview`: `vite preview`
  - `test`: `vitest run`
  - `test:watch`: `vitest`
  - `test:e2e`: `playwright test`
- [ ] Add runtime dependencies:
  - `@emotion/react`
  - `@emotion/styled`
  - `@mui/icons-material`
  - `@mui/material`
  - `@tanstack/react-query`
  - `@vitejs/plugin-react`
  - `react`
  - `react-dom`
  - `react-router-dom`
  - `zod`
- [ ] Add dev dependencies:
  - `@playwright/test`
  - `@testing-library/jest-dom`
  - `@testing-library/react`
  - `@testing-library/user-event`
  - `typescript`
  - `vite`
  - `vitest`
  - `jsdom`
- [ ] Create Vite and TypeScript config files.
- [ ] Create `index.html`, `src/main.tsx`, and a minimal `src/App.tsx`.
- [ ] Run `npm install`.
- [ ] Run `npm run build` and confirm the scaffold builds.

### Task 2: Add App Providers And Theme

- [ ] Create `src/app/theme/theme.ts` with a dark palette:
  - app background near `#0b0f17`;
  - sidebar surface near `#111722`;
  - panel surface near `#161d2a`;
  - primary purple near `#7c3aed`;
  - readable white and muted gray text;
  - compact `8px` border radius by default.
- [ ] Configure MUI typography for compact desktop UI and Russian copy readability.
- [ ] Add component overrides for buttons, cards/papers, text fields, tabs, and list items so defaults match the dark operational UI.
- [ ] Create `src/app/providers/AppProviders.tsx` with `ThemeProvider`, `CssBaseline`, `QueryClientProvider`, and `BrowserRouter`.
- [ ] Wire `AppProviders` in `src/App.tsx`.
- [ ] Run `npm run build`.

### Task 3: Add Routing And Shell

- [ ] Create `src/app/router/AppRouter.tsx` with the route tree from `MP-04`.
- [ ] Redirect `/` and unknown routes to `/app/projects`.
- [ ] Create `src/features/shell/AppShell.tsx` with a fixed left sidebar on desktop and responsive collapsed layout on narrow screens.
- [ ] Create `src/features/shell/Sidebar.tsx` with these primary labels:
  - `Мои задачи`
  - `Календарь`
  - `Статистика`
  - `Настройки`
- [ ] Add non-primary future navigation entries as disabled or visually secondary items only:
  - `Приоритеты`
  - `Метки`
  - `Архив`
- [ ] Add a static user profile block with `Алексей` and `alexey@mail.ru`.
- [ ] Use MUI Icons for navigation and action icons.
- [ ] Run `npm run build`.

### Task 4: Add Placeholder Screens

- [ ] Create `src/features/auth/LoginPage.tsx` with a compact static login form layout and Russian labels for email, password, sign in, and sign up.
- [ ] Create `src/features/projects/ProjectsPage.tsx` as the first authenticated screen with static rows reflecting reference screenshot 02:
  - page title `Мои задачи`;
  - search field;
  - category filter control;
  - sorting control;
  - primary create button `Новая задача`;
  - project rows for `Бизнес`, `Работа`, `Учеба`, and `Личная жизнь`.
- [ ] Create `src/features/projects/ProjectDetailPage.tsx` with static project header and task-list placeholder reflecting reference screenshot 01:
  - back button;
  - project title `Бизнес`;
  - progress and deadline cards;
  - tabs `Задачи`, `Обзор`, `Статистика`;
  - add-task row;
  - filters `Все`, `Не выполненные`, `Выполненные`;
  - static task rows.
- [ ] Create `CalendarPage`, `StatsPage`, and `SettingsPage` placeholders using the same shell and panel styles.
- [ ] Create `src/shared/ui/PageHeader.tsx` only if at least two pages share the same compact header pattern.
- [ ] Run `npm run build`.

### Task 5: Add Focused Tests

- [ ] Create `src/test/setup.ts` importing `@testing-library/jest-dom/vitest`.
- [ ] Configure Vitest to use `jsdom` and `src/test/setup.ts`.
- [ ] Create `src/app/router/AppRouter.test.tsx`.
- [ ] Add a test that renders the app at `/` and expects `Мои задачи` to be visible.
- [ ] Add a test that clicks `Календарь` and expects the calendar placeholder heading to be visible.
- [ ] Add a test that clicks `Статистика` and expects the statistics placeholder heading to be visible.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.

### Task 6: Add Playwright Smoke Test

- [ ] Create `playwright.config.ts` with `webServer` running `npm run dev -- --host 127.0.0.1`.
- [ ] Create `tests/smoke.spec.ts`.
- [ ] Add a smoke test that opens `/app/projects`, confirms `Мои задачи` is visible, and confirms sidebar navigation is visible.
- [ ] Add a smoke test that opens `/app/projects/demo`, confirms `Бизнес` is visible, and confirms task tabs are visible.
- [ ] Run `npm run test:e2e` if Playwright browsers are installed.
- [ ] If browsers are not installed, record the blocker and keep `npm run build` and `npm run test` as required verification for SP-01.

### Task 7: Visual QA And Documentation Check

- [ ] Start the dev server with `npm run dev`.
- [ ] Open `/app/projects` and compare against `docs/assets/reference-design/screenshot-02-project-list-overview.png`.
- [ ] Open `/app/projects/demo` and compare against `docs/assets/reference-design/screenshot-01-project-detail-task-list.png`.
- [ ] Check a mobile-width viewport and confirm sidebar/content controls do not overlap.
- [ ] Run `rg "screenshot-.*\\.jpg" docs/master-plan.md docs/assets/reference-design/README.md` and confirm no stale `.jpg` references remain in the source-of-truth screenshot docs.
- [ ] Run `rg "SP-01|MP-05|MP-06|MP-07|MP-13|MP-14" docs/subplans/SP-01-foundation.md` and confirm the required cross-references are present.

## Acceptance Criteria

- The project has a runnable Vite React TypeScript app.
- `/app/projects` is the default first app screen and renders a dark project list placeholder.
- `/app/projects/:projectId` renders a dark project detail placeholder with tabs and task rows.
- Sidebar navigation renders Russian labels and supports route navigation.
- MUI theme establishes the dark shell, dark content panels, purple active/accent states, compact spacing, and readable typography.
- `npm run build` passes.
- `npm run test` passes.
- Playwright smoke tests pass when browsers are available, or the missing browser installation is explicitly reported.
- No Supabase, auth persistence, real data, Kanban mutations, calendar data, statistics calculations, team management, Edge Functions, or out-of-scope MVP features are implemented in SP-01.

## Verification

- `npm install`
- `npm run build`
- `npm run test`
- `npm run test:e2e`
- Manual QA: open `/app/projects` and compare the layout direction with `docs/assets/reference-design/screenshot-02-project-list-overview.png`.
- Manual QA: open `/app/projects/demo` and compare the layout direction with `docs/assets/reference-design/screenshot-01-project-detail-task-list.png`.
- Manual QA: reduce viewport width and confirm no text or controls overlap.

## Notes

- Keep this subplan focused on foundation and visual shell. `SP-02` owns Supabase schema and RLS, and `SP-03` owns real authentication and protected route behavior.
- Use the real `.png` reference screenshots currently stored in `docs/assets/reference-design/`.
- The shell may include secondary future navigation entries only as non-primary inactive UI, matching `MP-04`; do not create full feature pages for them in this subplan.
