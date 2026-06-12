import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../../features/auth/authTypes';
import { AppRouter } from './AppRouter';

vi.mock('../../features/projects/ProjectsPage', () => ({
  ProjectsPage: () => <h1>Мои задачи</h1>,
}));

vi.mock('../../features/calendar/CalendarPage', () => ({
  CalendarPage: () => <h1>Календарь</h1>,
}));

const authenticatedAuth = createAuthValue({
  status: 'authenticated',
  profile: {
    id: 'user-1',
    email: 'owner@example.com',
    display_name: 'Alexey',
    avatar_url: null,
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
  },
  workspace: {
    id: 'workspace-1',
    name: 'Команда owner',
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
  },
  role: 'owner',
});

describe('AppRouter', () => {
  test('redirects unauthenticated app routes to login', async () => {
    renderRouter('/app/projects', createAuthValue({ status: 'unauthenticated' }));

    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeVisible();
  });

  test('redirects authenticated users away from login to projects', async () => {
    renderRouter('/login', authenticatedAuth);

    expect(
      await screen.findByRole('heading', { name: 'Мои задачи' }),
    ).toBeVisible();
  });

  test('keeps authenticated sidebar navigation working', async () => {
    renderRouter('/app/projects', authenticatedAuth);

    await userEvent.click(screen.getByRole('link', { name: /Календарь/i }));

    expect(
      await screen.findByRole('heading', { name: 'Календарь' }),
    ).toBeVisible();
  });
});

function renderRouter(initialEntry: string, auth: AuthContextValue) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <AppRouter />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function createAuthValue(
  overrides: Partial<AuthContextValue>,
): AuthContextValue {
  return {
    status: 'loading',
    session: null,
    user: null,
    profile: null,
    workspace: null,
    role: null,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshWorkspace: vi.fn(),
    ...overrides,
  };
}
