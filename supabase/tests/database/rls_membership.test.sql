begin;

select no_plan();

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'target@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Иван"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'outsider@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Ольга"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.profiles (id, email, display_name)
values
  ('00000000-0000-4000-8000-000000000003', 'target@example.com', 'Иван'),
  ('00000000-0000-4000-8000-000000000004', 'outsider@example.com', 'Ольга')
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select is(
  (
    select count(*)::int
    from public.workspaces
    where id = '10000000-0000-4000-8000-000000000001'
  ),
  1,
  'owner can read seeded workspace'
);

select is(
  (
    select count(*)::int
    from public.projects
    where workspace_id = '10000000-0000-4000-8000-000000000001'
  ),
  4,
  'owner can read seeded workspace projects'
);

select lives_ok(
  $$
    insert into public.workspace_members (workspace_id, user_id, role)
    values (
      '10000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000003',
      'member'
    )
  $$,
  'owner can add an existing profile to the workspace'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select is(
  (
    select count(*)::int
    from public.projects
    where workspace_id = '10000000-0000-4000-8000-000000000001'
  ),
  4,
  'member can read workspace projects'
);

select throws_ok(
  $$
    insert into public.workspace_members (workspace_id, user_id, role)
    values (
      '10000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000004',
      'member'
    )
  $$,
  '42501',
  null,
  'member cannot insert another workspace member'
);

select lives_ok(
  $$
    insert into public.tasks (
      id,
      workspace_id,
      project_id,
      title,
      description,
      status,
      priority,
      assignee_id,
      due_date,
      position,
      created_by
    )
    values (
      '40000000-0000-4000-8000-000000000099',
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      'Проверить RLS insert',
      'Тестовая задача, откатывается транзакцией pgTAP.',
      'todo',
      'medium',
      '00000000-0000-4000-8000-000000000002',
      '2026-06-25',
      999,
      '00000000-0000-4000-8000-000000000002'
    )
  $$,
  'workspace member can insert a task'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);

select is(
  (
    select count(*)::int
    from public.workspaces
    where id = '10000000-0000-4000-8000-000000000001'
  ),
  0,
  'non-member cannot read seeded workspace'
);

select is(
  (
    select count(*)::int
    from public.projects
    where workspace_id = '10000000-0000-4000-8000-000000000001'
  ),
  0,
  'non-member cannot read seeded workspace projects'
);

select throws_ok(
  $$
    insert into public.tasks (
      id,
      workspace_id,
      project_id,
      title,
      description,
      status,
      priority,
      assignee_id,
      due_date,
      position,
      created_by
    )
    values (
      '40000000-0000-4000-8000-000000000100',
      '10000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001',
      'Нельзя создать',
      'Non-member insert должен быть отклонен RLS.',
      'todo',
      'medium',
      null,
      '2026-06-26',
      1000,
      '00000000-0000-4000-8000-000000000004'
    )
  $$,
  '42501',
  null,
  'non-member cannot insert a task into the workspace'
);

select * from finish();

rollback;

