import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../auth/authTypes';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  test('displays authenticated profile data', () => {
    renderSidebar();

    expect(screen.getAllByText('Мария')[0]).toBeVisible();
    expect(screen.getAllByText('member@example.com')[0]).toBeVisible();
  });

  test('calls signOut from the profile area', async () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    renderSidebar({ signOut });

    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });

  test('exposes profile logout from the compact mobile shell', () => {
    renderSidebar();

    expect(screen.getAllByText('member@example.com')[0]).toBeVisible();
    expect(screen.getByRole('button', { name: 'Выйти из мобильного профиля' })).toBeVisible();
  });
});

function renderSidebar(overrides: Partial<AuthContextValue> = {}) {
  return render(
    <AuthContext.Provider value={createAuthValue(overrides)}>
      <MemoryRouter initialEntries={['/app/projects']}>
        <Sidebar width={296} />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function createAuthValue(
  overrides: Partial<AuthContextValue>,
): AuthContextValue {
  return {
    status: 'authenticated',
    session: null,
    user: null,
    profile: {
      id: 'user-1',
      email: 'member@example.com',
      display_name: 'Мария',
      avatar_url: null,
      created_at: '2026-06-07T00:00:00.000Z',
      updated_at: '2026-06-07T00:00:00.000Z',
    },
    workspace: {
      id: 'workspace-1',
      name: 'Команда Task Manager',
      created_by: 'user-1',
      created_at: '2026-06-07T00:00:00.000Z',
      updated_at: '2026-06-07T00:00:00.000Z',
    },
    role: 'member',
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshWorkspace: vi.fn(),
    ...overrides,
  };
}
