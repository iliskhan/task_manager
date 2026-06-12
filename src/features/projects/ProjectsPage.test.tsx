import { ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { appTheme } from '../../app/theme/theme';
import type { AuthContextValue } from '../auth/authTypes';
import { useAuth } from '../auth/useAuth';
import { ProjectsPage } from './ProjectsPage';
import {
  useArchiveProjectMutation,
  useCreateProjectMutation,
  useProjectListQuery,
  useUpdateProjectMutation,
} from './projectQueries';
import type { ProjectListItem } from './projectTypes';

vi.mock('../auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./projectQueries', () => ({
  useProjectListQuery: vi.fn(),
  useCreateProjectMutation: vi.fn(),
  useUpdateProjectMutation: vi.fn(),
  useArchiveProjectMutation: vi.fn(),
}));

const createProjectMutateAsync = vi.fn();
const updateProjectMutateAsync = vi.fn();
const archiveProjectMutateAsync = vi.fn();

describe('ProjectsPage', () => {
  beforeEach(() => {
    createProjectMutateAsync.mockReset();
    updateProjectMutateAsync.mockReset();
    archiveProjectMutateAsync.mockReset();
    vi.mocked(useAuth).mockReturnValue(createAuthValue({ role: 'owner' }));
    vi.mocked(useCreateProjectMutation).mockReturnValue(
      createMutationResult(createProjectMutateAsync),
    );
    vi.mocked(useUpdateProjectMutation).mockReturnValue(
      createMutationResult(updateProjectMutateAsync),
    );
    vi.mocked(useArchiveProjectMutation).mockReturnValue(
      createMutationResult(archiveProjectMutateAsync),
    );
  });

  test('renders projects returned from the query', () => {
    mockProjectList([createProject({ id: 'project-1', name: 'Бизнес', progress: 50 })]);

    renderProjectsPage();

    expect(screen.getByRole('heading', { name: 'Мои задачи' })).toBeVisible();
    expect(screen.getByRole('link', { name: /Бизнес/i })).toBeVisible();
    expect(screen.getByText('50%')).toBeVisible();
  });

  test('renders accessible loading, error, and empty states', () => {
    mockProjectQuery({ isLoading: true });

    const { rerender } = renderProjectsPage();

    expect(screen.getByRole('status')).toHaveTextContent('Загружаем проекты...');

    mockProjectQuery({ isError: true });
    rerender(renderProjectsPageTree());

    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось загрузить проекты.');

    mockProjectList([]);
    rerender(renderProjectsPageTree());

    expect(screen.getByRole('status')).toHaveTextContent('Проекты не найдены');
  });

  test('searches active projects and can switch to archived projects', async () => {
    const user = userEvent.setup();
    mockProjectList([
      createProject({ id: 'business', name: 'Бизнес', description: 'Продажи' }),
      createProject({ id: 'study', name: 'Учеба', description: 'Материалы' }),
      createProject({
        id: 'archive',
        name: 'Архив',
        description: 'Материалы архива',
        archived_at: '2026-06-11T00:00:00.000Z',
      }),
    ]);

    renderProjectsPage();

    await user.type(screen.getByLabelText('Поиск проектов'), 'материал');

    expect(screen.queryByRole('link', { name: /Бизнес/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Учеба/i })).toBeVisible();

    await user.click(screen.getByRole('combobox', { name: 'Фильтр проектов' }));
    await user.click(screen.getByRole('option', { name: 'Архивные' }));

    expect(screen.getByRole('link', { name: /Архив/i })).toBeVisible();
    expect(screen.queryByRole('link', { name: /Учеба/i })).not.toBeInTheDocument();
  });

  test('validates and submits the create project dialog', async () => {
    const user = userEvent.setup();
    mockProjectList([]);

    renderProjectsPage();

    await user.click(screen.getByRole('button', { name: 'Новый проект' }));
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(screen.getByText('Название обязательно')).toBeVisible();

    await user.type(screen.getByLabelText('Название проекта'), 'Новый проект');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(createProjectMutateAsync).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      name: 'Новый проект',
      description: null,
      iconName: 'briefcase',
      color: '#42a5ff',
      deadline: null,
    });
  });

  test('shows project actions only to owners', () => {
    mockProjectList([createProject({ id: 'project-1', name: 'Бизнес' })]);

    const { rerender } = renderProjectsPage();

    expect(screen.getByRole('button', { name: 'Действия проекта Бизнес' })).toBeVisible();

    vi.mocked(useAuth).mockReturnValue(createAuthValue({ role: 'member' }));
    rerender(
      <ThemeProvider theme={appTheme}>
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(
      within(screen.getByRole('link', { name: /Бизнес/i })).queryByRole('button', {
        name: 'Действия проекта Бизнес',
      }),
    ).not.toBeInTheDocument();
  });
});

function renderProjectsPage() {
  return render(renderProjectsPageTree());
}

function renderProjectsPageTree() {
  return (
    <ThemeProvider theme={appTheme}>
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    </ThemeProvider>
  );
}

function mockProjectList(projects: ProjectListItem[]) {
  mockProjectQuery({ data: projects });
}

function mockProjectQuery(
  overrides: Partial<{
    data: ProjectListItem[];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  }> = {},
) {
  vi.mocked(useProjectListQuery).mockReturnValue({
    data: overrides.data ?? [],
    isLoading: overrides.isLoading ?? false,
    isError: overrides.isError ?? false,
    error: overrides.error ?? null,
  } as never);
}

function createAuthValue(overrides: { role: 'owner' | 'member' }): AuthContextValue {
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
    role: overrides.role,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshWorkspace: vi.fn(),
  };
}

function createMutationResult(mutateAsync: ReturnType<typeof vi.fn>) {
  return {
    mutateAsync,
    isPending: false,
    isError: false,
    error: null,
  } as never;
}

function createProject(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: 'project-1',
    workspace_id: 'workspace-1',
    name: 'Проект',
    description: null,
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
