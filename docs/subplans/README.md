# Subplan System

This directory stores implementation subplans derived from `docs/master-plan.md`.

Each subplan should be small enough that it can be implemented and verified independently. Do not create a subplan that spans unrelated systems unless the coupling is necessary for a working vertical slice.

## Naming

Use this format:

```text
SP-XX-short-kebab-name.md
```

Examples:

- `SP-01-foundation.md`
- `SP-02-supabase-schema.md`
- `SP-05-kanban-and-tasks.md`

## Required Cross-References

Every subplan must include:

- master plan sections, for example `MP-06`, `MP-08`, `MP-12`;
- dependencies on earlier subplans;
- exact deliverables;
- explicit non-scope;
- acceptance criteria;
- verification commands or manual QA steps.

## Recommended Subplan Map

| Subplan | Purpose | Master References |
| --- | --- | --- |
| `SP-01-foundation.md` | Vite, React, TypeScript, MUI theme, router, app shell | `MP-05`, `MP-06`, `MP-07` |
| `SP-02-supabase-schema.md` | Migrations, RLS, generated types, seed data | `MP-08`, `MP-09`, `MP-12` |
| `SP-03-auth-and-workspace.md` | Auth screens, protected routes, profile, one-workspace bootstrap | `MP-03`, `MP-04`, `MP-11` |
| `SP-04-project-list.md` | First screen, project CRUD, search/filter/sort, progress, visits | `MP-04`, `MP-05`, `MP-11` |
| `SP-05-kanban-and-tasks.md` | Board, drag/drop, task drawer, task CRUD | `MP-05`, `MP-07`, `MP-11`, `MP-12` |
| `SP-06-team-and-edge-functions.md` | Add member by email, membership validation, activity events | `MP-03`, `MP-09`, `MP-10` |
| `SP-07-calendar-and-statistics.md` | Monthly deadlines, progress dashboards, recent activity | `MP-04`, `MP-11`, `MP-12` |
| `SP-08-qa-and-polish.md` | Responsive, accessibility, empty/error/loading states, E2E | `MP-05`, `MP-12`, `MP-15` |
| `SP-09-future-collaboration.md` | Comments, notifications, realtime, attachments after MVP | `MP-02`, `MP-10`, `MP-13` |

## Rules For Future Agents

- Read `docs/master-plan.md` before writing or executing any subplan.
- Keep each subplan tied to stable `MP-XX` references.
- Do not silently expand MVP scope.
- If a subplan needs to change the master plan, update the master plan first and document the reason.
- Prefer vertical slices that leave the app runnable after each subplan.

