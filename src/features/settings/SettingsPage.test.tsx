import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { appTheme } from '../../app/theme/theme';
import type { AuthContextValue } from '../auth/authTypes';
import { useAuth } from '../auth/useAuth';
import {
  useAddWorkspaceMemberMutation,
  useWorkspaceMembersQuery,
} from '../team/teamQueries';
import type { TeamMember } from '../team/teamTypes';
import { SettingsPage } from './SettingsPage';

vi.mock('../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../team/teamQueries', () => ({
  useWorkspaceMembersQuery: vi.fn(),
  useAddWorkspaceMemberMutation: vi.fn(),
}));

const addMemberMutateAsync = vi.fn();

describe('SettingsPage', () => {
  beforeEach(() => {
    addMemberMutateAsync.mockReset();
    vi.mocked(useAuth).mockReturnValue(createAuthValue({ role: 'owner' }));
    vi.mocked(useAddWorkspaceMemberMutation).mockReturnValue({
      mutateAsync: addMemberMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    } as never);
  });

  test('renders authenticated profile, workspace, and members', () => {
    mockMembersQuery([createMember({ displayName: 'Мария' })]);

    renderSettingsPage();

    expect(screen.getByRole('heading', { name: 'Настройки' })).toBeVisible();
    expect(screen.getByText('Алексей')).toBeVisible();
    expect(screen.getByText('owner@example.com')).toBeVisible();
    expect(screen.getByText('Команда Task Manager')).toBeVisible();
    expect(screen.getByText('Владелец')).toBeVisible();
    expect(screen.getByText('Мария')).toBeVisible();
  });

  test('shows member loading and error states', () => {
    vi.mocked(useWorkspaceMembersQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as never);

    const { rerender } = renderSettingsPage();

    expect(screen.getByText('Загрузка команды...')).toBeVisible();

    vi.mocked(useWorkspaceMembersQuery).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('failed'),
    } as never);
    rerender(
      <ThemeProvider theme={appTheme}>
        <SettingsPage />
      </ThemeProvider>,
    );

    expect(screen.getByText('Не удалось загрузить команду.')).toBeVisible();
  });

  test('shows add-member form only to owners', () => {
    mockMembersQuery([]);

    const { rerender } = renderSettingsPage();

    expect(screen.getByLabelText('Email участника')).toBeVisible();

    vi.mocked(useAuth).mockReturnValue(createAuthValue({ role: 'member' }));
    rerender(
      <ThemeProvider theme={appTheme}>
        <SettingsPage />
      </ThemeProvider>,
    );

    expect(screen.queryByLabelText('Email участника')).not.toBeInTheDocument();
    expect(screen.getByText('Добавление участников доступно владельцу.')).toBeVisible();
  });

  test('adds a member from settings and shows success feedback', async () => {
    const user = userEvent.setup();
    mockMembersQuery([]);
    addMemberMutateAsync.mockResolvedValue(createMember({ email: 'member@example.com' }));

    renderSettingsPage();

    await user.type(screen.getByLabelText('Email участника'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Добавить участника' }));

    expect(addMemberMutateAsync).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      email: 'member@example.com',
    });
    expect(screen.getByText('Участник добавлен.')).toBeVisible();
  });
});

function renderSettingsPage() {
  return render(
    <ThemeProvider theme={appTheme}>
      <SettingsPage />
    </ThemeProvider>,
  );
}

function mockMembersQuery(members: TeamMember[]) {
  vi.mocked(useWorkspaceMembersQuery).mockReturnValue({
    data: members,
    isLoading: false,
    isError: false,
    error: null,
  } as never);
}

function createAuthValue(overrides: { role: 'owner' | 'member' }): AuthContextValue {
  return {
    status: 'authenticated',
    session: null,
    user: { id: 'owner-1', email: 'owner@example.com' } as AuthContextValue['user'],
    profile: {
      id: 'owner-1',
      email: 'owner@example.com',
      display_name: 'Алексей',
      avatar_url: null,
      created_at: '2026-06-07T00:00:00.000Z',
      updated_at: '2026-06-07T00:00:00.000Z',
    },
    workspace: {
      id: 'workspace-1',
      name: 'Команда Task Manager',
      created_by: 'owner-1',
      created_at: '2026-06-07T00:00:00.000Z',
      updated_at: '2026-06-07T00:00:00.000Z',
    },
    role: overrides.role,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshWorkspace: vi.fn(),
  };
}

function createMember(overrides: Partial<TeamMember> = {}): TeamMember {
  return {
    userId: 'member-1',
    email: 'member@example.com',
    displayName: null,
    avatarUrl: null,
    role: 'member',
    createdAt: '2026-06-12T12:00:00.000Z',
    ...overrides,
  };
}
