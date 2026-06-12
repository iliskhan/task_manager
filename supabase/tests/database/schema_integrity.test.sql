begin;

select plan(42);

select has_table('profiles');
select has_table('workspaces');
select has_table('workspace_members');
select has_table('projects');
select has_table('tasks');
select has_table('labels');
select has_table('task_labels');
select has_table('project_visits');
select has_table('activity_events');

select has_column('profiles', 'id');
select has_column('profiles', 'email');
select has_column('workspaces', 'created_by');
select has_column('workspace_members', 'role');
select has_column('projects', 'workspace_id');
select has_column('tasks', 'status');
select has_column('tasks', 'priority');
select has_column('tasks', 'position');
select has_column('task_labels', 'task_id');
select has_column('task_labels', 'label_id');
select has_column('activity_events', 'payload');

select ok(
  exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'workspace_members'
      and constraint_type = 'PRIMARY KEY'
  ),
  'workspace_members has a primary key'
);

select ok(
  exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'task_labels'
      and constraint_type = 'PRIMARY KEY'
  ),
  'task_labels has a primary key'
);

select ok(
  exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'tasks'
      and constraint_type = 'CHECK'
      and constraint_name like '%status%'
  ),
  'tasks.status has a check constraint'
);

select ok(
  exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'tasks'
      and constraint_type = 'CHECK'
      and constraint_name like '%priority%'
  ),
  'tasks.priority has a check constraint'
);

select ok(
  exists (
    select 1
    from information_schema.referential_constraints rc
    join information_schema.table_constraints tc
      on tc.constraint_catalog = rc.constraint_catalog
      and tc.constraint_schema = rc.constraint_schema
      and tc.constraint_name = rc.constraint_name
    where tc.table_schema = 'public'
      and tc.table_name = 'tasks'
  ),
  'tasks has foreign keys'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'profiles'
      and indexname = 'profiles_email_lower_idx'
  ),
  'profiles has a lower(email) unique index'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'tasks'
      and indexname = 'tasks_workspace_id_project_id_status_position_idx'
  ),
  'tasks has the kanban query index'
);

select ok(
  has_schema_privilege('authenticated', 'public', 'USAGE'),
  'authenticated role can use the public schema'
);

select ok(
  not exists (
    select 1
    from (
      values
        ('profiles', 'SELECT'),
        ('profiles', 'INSERT'),
        ('profiles', 'UPDATE'),
        ('workspaces', 'SELECT'),
        ('workspaces', 'INSERT'),
        ('workspaces', 'UPDATE'),
        ('workspace_members', 'SELECT'),
        ('workspace_members', 'INSERT'),
        ('workspace_members', 'DELETE'),
        ('projects', 'SELECT'),
        ('projects', 'INSERT'),
        ('projects', 'UPDATE'),
        ('projects', 'DELETE'),
        ('tasks', 'SELECT'),
        ('tasks', 'INSERT'),
        ('tasks', 'UPDATE'),
        ('labels', 'SELECT'),
        ('labels', 'INSERT'),
        ('labels', 'UPDATE'),
        ('labels', 'DELETE'),
        ('task_labels', 'SELECT'),
        ('task_labels', 'INSERT'),
        ('task_labels', 'DELETE'),
        ('project_visits', 'SELECT'),
        ('project_visits', 'INSERT'),
        ('project_visits', 'UPDATE'),
        ('activity_events', 'SELECT'),
        ('activity_events', 'INSERT')
    ) as required(table_name, privilege_type)
    where not has_table_privilege(
      'authenticated',
      format('public.%I', required.table_name),
      required.privilege_type
    )
  ),
  'authenticated role has table privileges required by RLS policies'
);

select ok(
  has_function_privilege('authenticated', 'public.is_workspace_member(uuid)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.workspace_member_role(uuid)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.profile_shares_workspace(uuid)', 'EXECUTE')
  and has_function_privilege('authenticated', 'public.is_workspace_creator(uuid)', 'EXECUTE'),
  'authenticated role can execute RLS helper functions'
);

select ok(c.relrowsecurity, 'profiles RLS enabled')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'profiles';

select ok(c.relrowsecurity, 'workspaces RLS enabled')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'workspaces';

select ok(c.relrowsecurity, 'workspace_members RLS enabled')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'workspace_members';

select ok(c.relrowsecurity, 'projects RLS enabled')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'projects';

select ok(c.relrowsecurity, 'tasks RLS enabled')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'tasks';

select ok(c.relrowsecurity, 'labels RLS enabled')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'labels';

select ok(c.relrowsecurity, 'task_labels RLS enabled')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'task_labels';

select ok(c.relrowsecurity, 'project_visits RLS enabled')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'project_visits';

select ok(c.relrowsecurity, 'activity_events RLS enabled')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'activity_events';

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'is_workspace_member'
      and p.prosecdef
  ),
  'is_workspace_member is security definer'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'workspace_member_role'
      and p.prosecdef
  ),
  'workspace_member_role is security definer'
);

select ok(
  exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'profile_shares_workspace'
      and p.prosecdef
  ),
  'profile_shares_workspace is security definer'
);

select * from finish();

rollback;
