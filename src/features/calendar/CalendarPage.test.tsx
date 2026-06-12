import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { appTheme } from '../../app/theme/theme';
import type { AuthContextValue } from '../auth/authTypes';
import { useAuth } from '../auth/useAuth';
import { CalendarPage } from './CalendarPage';
import { useCalendarDeadlinesQuery } from './calendarQueries';
import type { CalendarTaskDeadline } from './calendarTypes';

vi.mock('../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./calendarQueries', () => ({
  useCalendarDeadlinesQuery: vi.fn(),
}));

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-12T12:00:00.000Z'));
    vi.mocked(useAuth).mockReturnValue(createAuthValue());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renders loading and error states from the deadlines query', () => {
    mockCalendarQuery({ isLoading: true });

    const { rerender } = renderCalendarPage();

    expect(screen.getByRole('status')).toHaveTextContent('Загружаем календарь...');

    mockCalendarQuery({ isError: true });
    rerender(
      <ThemeProvider theme={appTheme}>
        <MemoryRouter>
          <CalendarPage />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить календарь.');
  });

  test('renders empty deadline state as a polite status', () => {
    mockCalendarQuery({ data: [] });

    renderCalendarPage();

    expect(screen.getByRole('status')).toHaveTextContent('В задачах пока нет дедлайнов.');
  });

  test('renders task deadlines with overdue state and project deep links', () => {
    mockCalendarQuery({
      data: [
        createDeadline({
          id: 'overdue-task',
          title: 'Закрыть просроченную задачу',
          dueDate: '2026-06-11',
          status: 'todo',
        }),
        createDeadline({
          id: 'task-1',
          title: 'Подготовить отчет',
          dueDate: '2026-06-15',
          status: 'review',
        }),
      ],
    });

    renderCalendarPage();

    expect(screen.getByRole('heading', { name: 'Июнь 2026' })).toBeVisible();
    expect(screen.getByText('Просрочено')).toBeVisible();
    expect(screen.getByRole('link', { name: /Подготовить отчет/i })).toHaveAttribute(
      'href',
      '/app/projects/project-1?taskId=task-1',
    );
    expect(screen.getAllByText('Бизнес')[0]).toBeVisible();
  });
});

function renderCalendarPage() {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function mockCalendarQuery(
  overrides: Partial<{
    data: CalendarTaskDeadline[];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  }> = {},
) {
  vi.mocked(useCalendarDeadlinesQuery).mockReturnValue({
    data: overrides.data ?? [],
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

function createDeadline(
  overrides: Partial<CalendarTaskDeadline> = {},
): CalendarTaskDeadline {
  return {
    id: 'task-1',
    title: 'Задача',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-06-15',
    project: {
      id: 'project-1',
      name: 'Бизнес',
      color: '#42a5ff',
      iconName: 'briefcase',
    },
    ...overrides,
  };
}
