create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_not_blank check (length(btrim(email)) > 0)
);

create unique index profiles_email_lower_idx on public.profiles (lower(email));

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_not_blank check (length(btrim(name)) > 0)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  icon_name text,
  color text,
  deadline date,
  archived_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_name_not_blank check (length(btrim(name)) > 0)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null check (status in ('backlog', 'todo', 'in_progress', 'review', 'done')),
  priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  position numeric not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_not_blank check (length(btrim(title)) > 0)
);

create table public.labels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  constraint labels_name_not_blank check (length(btrim(name)) > 0),
  unique (workspace_id, name)
);

create table public.task_labels (
  task_id uuid not null references public.tasks(id) on delete cascade,
  label_id uuid not null references public.labels(id) on delete cascade,
  primary key (task_id, label_id)
);

create table public.project_visits (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  visited_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  actor_id uuid not null references public.profiles(id),
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint activity_events_type_not_blank check (length(btrim(event_type)) > 0)
);

create index workspace_members_user_id_idx on public.workspace_members (user_id);
create index workspace_members_workspace_id_role_idx on public.workspace_members (workspace_id, role);
create index projects_workspace_id_archived_at_deadline_idx on public.projects (workspace_id, archived_at, deadline);
create index tasks_workspace_id_project_id_status_position_idx on public.tasks (workspace_id, project_id, status, position);
create index tasks_workspace_id_assignee_id_idx on public.tasks (workspace_id, assignee_id);
create index tasks_workspace_id_due_date_idx on public.tasks (workspace_id, due_date);
create index task_labels_label_id_idx on public.task_labels (label_id);
create index project_visits_user_id_visited_at_idx on public.project_visits (user_id, visited_at desc);
create index activity_events_workspace_id_created_at_idx on public.activity_events (workspace_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create or replace function public.ensure_task_project_workspace_match()
returns trigger
language plpgsql
as $$
declare
  parent_workspace_id uuid;
begin
  select workspace_id
  into parent_workspace_id
  from public.projects
  where id = new.project_id;

  if parent_workspace_id is null then
    raise exception 'task project % does not exist', new.project_id;
  end if;

  if new.workspace_id is distinct from parent_workspace_id then
    raise exception 'task workspace % does not match project workspace %', new.workspace_id, parent_workspace_id;
  end if;

  return new;
end;
$$;

create trigger tasks_project_workspace_match
before insert or update of workspace_id, project_id on public.tasks
for each row execute function public.ensure_task_project_workspace_match();

create or replace function public.ensure_task_label_workspace_match()
returns trigger
language plpgsql
as $$
declare
  task_workspace_id uuid;
  label_workspace_id uuid;
begin
  select workspace_id
  into task_workspace_id
  from public.tasks
  where id = new.task_id;

  select workspace_id
  into label_workspace_id
  from public.labels
  where id = new.label_id;

  if task_workspace_id is null or label_workspace_id is null then
    raise exception 'task % or label % does not exist', new.task_id, new.label_id;
  end if;

  if task_workspace_id is distinct from label_workspace_id then
    raise exception 'task workspace % does not match label workspace %', task_workspace_id, label_workspace_id;
  end if;

  return new;
end;
$$;

create trigger task_labels_workspace_match
before insert or update of task_id, label_id on public.task_labels
for each row execute function public.ensure_task_label_workspace_match();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_member_role(target_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select wm.role
  from public.workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.profile_shares_workspace(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members self_membership
    join public.workspace_members target_membership
      on target_membership.workspace_id = self_membership.workspace_id
    where self_membership.user_id = auth.uid()
      and target_membership.user_id = target_user_id
  );
$$;

create or replace function public.is_workspace_creator(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = target_workspace_id
      and w.created_by = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.labels enable row level security;
alter table public.task_labels enable row level security;
alter table public.project_visits enable row level security;
alter table public.activity_events enable row level security;

create policy profiles_select_same_workspace
on public.profiles for select
to authenticated
using ((select auth.uid()) = id or public.profile_shares_workspace(id));

create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy workspaces_select_members
on public.workspaces for select
to authenticated
using (public.is_workspace_member(id));

create policy workspaces_insert_creator
on public.workspaces for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy workspaces_update_owners
on public.workspaces for update
to authenticated
using (public.workspace_member_role(id) = 'owner')
with check (public.workspace_member_role(id) = 'owner');

create policy workspace_members_select_members
on public.workspace_members for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy workspace_members_insert_owner_or_initial_self
on public.workspace_members for insert
to authenticated
with check (
  (
    user_id = (select auth.uid())
    and role = 'owner'
    and public.is_workspace_creator(workspace_id)
  )
  or public.workspace_member_role(workspace_id) = 'owner'
);

create policy workspace_members_delete_owners
on public.workspace_members for delete
to authenticated
using (public.workspace_member_role(workspace_id) = 'owner');

create policy projects_select_members
on public.projects for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy projects_insert_members
on public.projects for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and created_by = (select auth.uid())
);

create policy projects_update_owners
on public.projects for update
to authenticated
using (public.workspace_member_role(workspace_id) = 'owner')
with check (public.workspace_member_role(workspace_id) = 'owner');

create policy projects_delete_owners
on public.projects for delete
to authenticated
using (public.workspace_member_role(workspace_id) = 'owner');

create policy tasks_select_members
on public.tasks for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy tasks_insert_members
on public.tasks for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and created_by = (select auth.uid())
);

create policy tasks_update_members
on public.tasks for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy labels_select_members
on public.labels for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy labels_insert_members
on public.labels for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

create policy labels_update_members
on public.labels for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy labels_delete_members
on public.labels for delete
to authenticated
using (public.is_workspace_member(workspace_id));

create policy task_labels_select_members
on public.task_labels for select
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.labels l on l.id = task_labels.label_id
    where t.id = task_labels.task_id
      and t.workspace_id = l.workspace_id
      and public.is_workspace_member(t.workspace_id)
  )
);

create policy task_labels_insert_members
on public.task_labels for insert
to authenticated
with check (
  exists (
    select 1
    from public.tasks t
    join public.labels l on l.id = task_labels.label_id
    where t.id = task_labels.task_id
      and t.workspace_id = l.workspace_id
      and public.is_workspace_member(t.workspace_id)
  )
);

create policy task_labels_delete_members
on public.task_labels for delete
to authenticated
using (
  exists (
    select 1
    from public.tasks t
    join public.labels l on l.id = task_labels.label_id
    where t.id = task_labels.task_id
      and t.workspace_id = l.workspace_id
      and public.is_workspace_member(t.workspace_id)
  )
);

create policy project_visits_select_own_members
on public.project_visits for select
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = project_visits.project_id
      and public.is_workspace_member(p.workspace_id)
  )
);

create policy project_visits_insert_own_members
on public.project_visits for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = project_visits.project_id
      and public.is_workspace_member(p.workspace_id)
  )
);

create policy project_visits_update_own_members
on public.project_visits for update
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = project_visits.project_id
      and public.is_workspace_member(p.workspace_id)
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.projects p
    where p.id = project_visits.project_id
      and public.is_workspace_member(p.workspace_id)
  )
);

create policy activity_events_select_members
on public.activity_events for select
to authenticated
using (public.is_workspace_member(workspace_id));

create policy activity_events_insert_members
on public.activity_events for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and actor_id = (select auth.uid())
);

