import { ThemeProvider } from '@mui/material';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { appTheme } from '../../app/theme/theme';
import type { AuthContextValue } from '../auth/authTypes';
import { useAuth } from '../auth/useAuth';
import { KanbanBoard } from '../board/KanbanBoard';
import { ProjectDetailPage } from './ProjectDetailPage';
import {
  useProjectDetailQuery,
  useRecordProjectVisitMutation,
} from './projectQueries';
import type { ProjectListItem } from './projectTypes';

vi.mock('../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./projectQueries', () => ({
  useProjectDetailQuery: vi.fn(),
  useRecordProjectVisitMutation: vi.fn(),
}));

vi.mock('../board/KanbanBoard', () => ({
  KanbanBoard: vi.fn(() => <div>Канбан доска</div>),
}));

const recordVisitMutate = vi.fn();

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    recordVisitMutate.mockReset();
    vi.mocked(useAuth).mockReturnValue(createAuthValue());
    vi.mocked(useRecordProjectVisitMutation).mockReturnValue({
      mutate: recordVisitMutate,
      isPending: false,
    } as never);
  });

  test('renders loaded project metadata', () => {
    mockProjectDetail(createProject({ name: 'Реальный проект', description: 'Описание из базы' }));

    renderProjectDetail();

    expect(screen.getByRole('heading', { name: 'Реальный проект' })).toBeVisible();
    expect(screen.getByText('Описание из базы')).toBeVisible();
    expect(screen.getByText('50%')).toBeVisible();
    expect(screen.getByText('Канбан доска')).toBeVisible();
    expect(KanbanBoard).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        currentUserId: 'user-1',
      }),
      undefined,
    );
  });

  test('records a visit for the current user and route project', async () => {
    mockProjectDetail(createProject({ id: 'project-1' }));

    renderProjectDetail('/app/projects/project-1');

    await waitFor(() =>
      expect(recordVisitMutate).toHaveBeenCalledWith({
        workspaceId: 'workspace-1',
        userId: 'user-1',
        projectId: 'project-1',
      }),
    );
  });

  test('renders a controlled not-found state for missing projects', () => {
    mockProjectDetail(null);

    renderProjectDetail();

    expect(screen.getByRole('heading', { name: 'Проект не найден' })).toBeVisible();
  });
});

function renderProjectDetail(initialEntry = '/app/projects/project-1') {
  return render(
    <ThemeProvider theme={appTheme}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/app/projects/:projectId" element={<ProjectDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

function mockProjectDetail(project: ProjectListItem | null) {
  vi.mocked(useProjectDetailQuery).mockReturnValue({
    data: project,
    isLoading: false,
    isError: false,
    error: null,
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

function createProject(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: 'project-1',
    workspace_id: 'workspace-1',
    name: 'Проект',
    description: 'Описание',
    icon_name: 'briefcase',
    color: '#42a5ff',
    deadline: '2026-06-20',
    archived_at: null,
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    doneTaskCount: 1,
    totalTaskCount: 2,
    progress: 50,
    lastVisitedAt: null,
    deadlineStatus: {
      dateText: '20.06.2026',
      statusText: 'Осталось 8 дней',
      tone: 'success',
      daysUntilDeadline: 8,
    },
    lastVisitText: 'Еще не открывали',
    displayColor: '#42a5ff',
    displayIconName: 'briefcase',
    ...overrides,
  };
}
