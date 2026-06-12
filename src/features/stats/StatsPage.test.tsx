import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { appTheme } from '../../app/theme/theme';
import type { AuthContextValue } from '../auth/authTypes';
import { useAuth } from '../auth/useAuth';
import { StatsPage } from './StatsPage';
import { useWorkspaceStatsQuery } from './statsQueries';
import type { WorkspaceStats } from './statsTypes';

vi.mock('../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./statsQueries', () => ({
  useWorkspaceStatsQuery: vi.fn(),
}));

describe('StatsPage', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue(createAuthValue());
  });

  test('renders loading and error states from the stats query', () => {
    mockStatsQuery({ isLoading: true });

    const { rerender } = renderStatsPage();

    expect(screen.getByRole('status')).toHaveTextContent('Загружаем статистику...');

    mockStatsQuery({ isError: true });
    rerender(
      <ThemeProvider theme={appTheme}>
        <StatsPage />
      </ThemeProvider>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить статистику.');
  });

  test('renders empty dashboard state as a polite status', () => {
    mockStatsQuery();

    renderStatsPage();

    expect(screen.getByRole('status')).toHaveTextContent('Данных для статистики пока нет.');
  });

  test('renders summary metrics, statuses, deadlines, and recent activity', () => {
    mockStatsQuery({ data: createWorkspaceStats() });

    renderStatsPage();

    expect(screen.getByRole('heading', { name: 'Статистика' })).toBeVisible();
    expect(screen.getByText('33%')).toBeVisible();
    expect(screen.getByText('Активные проекты')).toBeVisible();
    expect(screen.getByText('К выполнению')).toBeVisible();
    expect(screen.getByText('Ближайший дедлайн')).toBeVisible();
    expect(screen.getByText('Просроченная задача')).toBeVisible();
    expect(screen.getByText('Задача перемещена')).toBeVisible();
    expect(screen.getByText('Мария')).toBeVisible();
  });
});

function renderStatsPage() {
  return render(
    <ThemeProvider theme={appTheme}>
      <StatsPage />
    </ThemeProvider>,
  );
}

function mockStatsQuery(
  overrides: Partial<{
    data: WorkspaceStats;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  }> = {},
) {
  vi.mocked(useWorkspaceStatsQuery).mockReturnValue({
    data: overrides.data,
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    error: overrides.error ?? null,
  } as never);
}

function createAuthValue(): AuthContextValue {
  return {
    status: 'authenticated',
    session: null,
    user: { id: 'user-1', email: 'owner@example.com' } as AuthContextValue['user'],
    profile: null,
    workspace: {
      id: 'workspace-1',
      name: 'Команда',
      created_by: 'user-1',
      created_at: '2026-06-07T00:00:00.000Z',
      updated_at: '2026-06-07T00:00:00.000Z',
    },
    role: 'owner',
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshWorkspace: vi.fn(),
  };
}

function createWorkspaceStats(): WorkspaceStats {
  return {
    summary: {
      activeProjectCount: 2,
      totalTaskCount: 3,
      completedTaskCount: 1,
      completionPercent: 33,
      overdueTaskCount: 1,
      upcomingDeadlineCount: 1,
    },
    statusCounts: [
      { status: 'backlog', label: 'Бэклог', color: '#7f8798', count: 0, percent: 0 },
      { status: 'todo', label: 'К выполнению', color: '#42a5ff', count: 1, percent: 33 },
      { status: 'in_progress', label: 'В работе', color: '#7c3aed', count: 0, percent: 0 },
      { status: 'review', label: 'Проверка', color: '#f7c948', count: 1, percent: 33 },
      { status: 'done', label: 'Готово', color: '#66d861', count: 1, percent: 33 },
    ],
    projectProgress: [
      {
        projectId: 'project-1',
        name: 'Бизнес',
        color: '#42a5ff',
        doneTaskCount: 1,
        totalTaskCount: 2,
        progress: 50,
      },
    ],
    overdueTasks: [
      {
        id: 'task-overdue',
        title: 'Просроченная задача',
        dueDate: '2026-06-11',
        status: 'todo',
        projectId: 'project-1',
        projectName: 'Бизнес',
        projectColor: '#42a5ff',
      },
    ],
    upcomingDeadlines: [
      {
        id: 'task-upcoming',
        title: 'Ближайший дедлайн',
        dueDate: '2026-06-15',
        status: 'review',
        projectId: 'project-1',
        projectName: 'Бизнес',
        projectColor: '#42a5ff',
      },
    ],
    recentActivity: [
      {
        id: 'event-1',
        label: 'Задача перемещена',
        description: 'Ближайший дедлайн',
        actorName: 'Мария',
        projectName: 'Бизнес',
        createdAt: '2026-06-11T09:00:00.000Z',
      },
    ],
  };
}
