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
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Алексей"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'member@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Мария"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '{"sub":"00000000-0000-4000-8000-000000000001","email":"owner@example.com","email_verified":true}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000002',
    '{"sub":"00000000-0000-4000-8000-000000000002","email":"member@example.com","email_verified":true}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do update
set
  identity_data = excluded.identity_data,
  last_sign_in_at = excluded.last_sign_in_at,
  updated_at = now();

insert into public.profiles (id, email, display_name, avatar_url)
values
  ('00000000-0000-4000-8000-000000000001', 'owner@example.com', 'Алексей', null),
  ('00000000-0000-4000-8000-000000000002', 'member@example.com', 'Мария', null)
on conflict (id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url;

insert into public.workspaces (id, name, created_by)
values (
  '10000000-0000-4000-8000-000000000001',
  'Команда Task Manager',
  '00000000-0000-4000-8000-000000000001'
)
on conflict (id) do update
set
  name = excluded.name,
  created_by = excluded.created_by;

insert into public.workspace_members (workspace_id, user_id, role)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'owner'
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'member'
  )
on conflict (workspace_id, user_id) do update
set role = excluded.role;

insert into public.projects (
  id,
  workspace_id,
  name,
  description,
  icon_name,
  color,
  deadline,
  created_by
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Бизнес',
    'Запуск клиентских задач и контроль прогресса.',
    'business',
    '#7c3aed',
    '2026-06-30',
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'Работа',
    'Операционные задачи команды на неделю.',
    'work',
    '#2563eb',
    '2026-07-10',
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'Учеба',
    'План обучения и внутренних материалов.',
    'school',
    '#16a34a',
    '2026-07-20',
    '00000000-0000-4000-8000-000000000002'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'Личная жизнь',
    'Личные задачи без выхода за MVP-командный контекст.',
    'personal',
    '#f97316',
    '2026-08-01',
    '00000000-0000-4000-8000-000000000002'
  )
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  icon_name = excluded.icon_name,
  color = excluded.color,
  deadline = excluded.deadline,
  created_by = excluded.created_by;

insert into public.labels (id, workspace_id, name, color)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Срочно', '#ef4444'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Дизайн', '#a855f7'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Backend', '#22c55e')
on conflict (id) do update
set
  name = excluded.name,
  color = excluded.color;

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
values
  (
    '40000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Подготовить структуру задач',
    'Собрать первый набор задач для Kanban-доски.',
    'backlog',
    'medium',
    '00000000-0000-4000-8000-000000000001',
    '2026-06-14',
    100,
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Сверить требования MVP',
    'Проверить, что доска не выходит за MP-02.',
    'todo',
    'high',
    '00000000-0000-4000-8000-000000000002',
    '2026-06-16',
    200,
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'Настроить рабочий процесс',
    'Разложить статусы задач по колонкам.',
    'in_progress',
    'urgent',
    '00000000-0000-4000-8000-000000000001',
    '2026-06-18',
    100,
    '00000000-0000-4000-8000-000000000002'
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    'Проверить учебные материалы',
    'Просмотреть список документов для команды.',
    'review',
    'low',
    '00000000-0000-4000-8000-000000000002',
    '2026-06-22',
    100,
    '00000000-0000-4000-8000-000000000001'
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000004',
    'Закрыть личный план недели',
    'Пример завершенной задачи для расчета прогресса.',
    'done',
    'medium',
    '00000000-0000-4000-8000-000000000002',
    '2026-06-12',
    100,
    '00000000-0000-4000-8000-000000000002'
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  priority = excluded.priority,
  assignee_id = excluded.assignee_id,
  due_date = excluded.due_date,
  position = excluded.position;

insert into public.task_labels (task_id, label_id)
values
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003'),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000002')
on conflict (task_id, label_id) do nothing;

insert into public.project_visits (project_id, user_id, visited_at)
values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', '2026-06-07 10:00:00+00'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001', '2026-06-07 09:30:00+00'),
  ('20000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', '2026-06-06 17:20:00+00'),
  ('20000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', '2026-06-05 18:40:00+00')
on conflict (project_id, user_id) do update
set visited_at = excluded.visited_at;

insert into public.activity_events (
  id,
  workspace_id,
  project_id,
  task_id,
  actor_id,
  event_type,
  payload,
  created_at
)
values
  (
    '50000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    'task_created',
    '{"title":"Подготовить структуру задач"}'::jsonb,
    '2026-06-07 08:00:00+00'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000002',
    'task_moved',
    '{"from":"todo","to":"in_progress"}'::jsonb,
    '2026-06-07 08:30:00+00'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000004',
    '40000000-0000-4000-8000-000000000005',
    '00000000-0000-4000-8000-000000000002',
    'task_completed',
    '{"status":"done"}'::jsonb,
    '2026-06-07 09:00:00+00'
  )
on conflict (id) do update
set
  payload = excluded.payload,
  created_at = excluded.created_at;

