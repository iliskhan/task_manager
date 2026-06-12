# Task Manager

Локальный React + Supabase проект командного менеджера задач.

## Тестовые аккаунты

После загрузки локальных seed-данных через Supabase, например после `npx supabase db reset`, доступны тестовые аккаунты:

| Роль | Email | Пароль | Имя в профиле |
| --- | --- | --- | --- |
| Владелец workspace | `owner@example.com` | `password123` | Алексей |
| Участник workspace | `member@example.com` | `password123` | Мария |

Эти учетные записи предназначены только для локальной разработки и проверки сценариев авторизации, ролей `owner` / `member` и доступа к seeded workspace из `supabase/seed.sql`.
