import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  projectQueryKeys,
  useCreateProjectMutation,
  useProjectListQuery,
  useRestoreProjectMutation,
} from './projectQueries';
import { createProject, loadProjectList, restoreProject } from './projectRepository';
import type { ProjectListItem } from './projectTypes';

vi.mock('../../lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('./projectRepository', () => ({
  createProject: vi.fn(),
  loadProjectList: vi.fn(),
  loadProjectDetail: vi.fn(),
  updateProject: vi.fn(),
  archiveProject: vi.fn(),
  restoreProject: vi.fn(),
  recordProjectVisit: vi.fn(),
}));

describe('projectQueries', () => {
  beforeEach(() => {
    vi.mocked(loadProjectList).mockReset();
    vi.mocked(createProject).mockReset();
    vi.mocked(restoreProject).mockReset();
  });

  test('loads project list for a workspace and user', async () => {
    vi.mocked(loadProjectList).mockResolvedValue([]);
    const { wrapper } = createQueryWrapper();

    const { result } = renderHook(
      () => useProjectListQuery('workspace-1', 'user-1'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(loadProjectList).toHaveBeenCalledWith(
      expect.anything(),
      'workspace-1',
      'user-1',
    );
  });

  test('invalidates project list after creating a project', async () => {
    vi.mocked(createProject).mockResolvedValue({ id: 'project-1' } as never);
    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateProjectMutation(), { wrapper });

    await result.current.mutateAsync({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      name: 'Новый проект',
      description: null,
      iconName: 'briefcase',
      color: '#42a5ff',
      deadline: null,
    });

    expect(createProject).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: projectQueryKeys.list('workspace-1', 'user-1'),
    });
  });

  test('updates cached project archive state after restoring a project', async () => {
    vi.mocked(restoreProject).mockResolvedValue({
      id: 'project-1',
      archived_at: null,
    } as never);
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(projectQueryKeys.list('workspace-1', 'user-1'), [
      createProjectListItem({
        id: 'project-1',
        archived_at: '2026-06-12T12:00:00.000Z',
      }),
    ]);

    const { result } = renderHook(() => useRestoreProjectMutation(), { wrapper });

    await result.current.mutateAsync({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      projectId: 'project-1',
    });

    expect(
      queryClient.getQueryData<ProjectListItem[]>(
        projectQueryKeys.list('workspace-1', 'user-1'),
      )?.[0].archived_at,
    ).toBeNull();
  });
});

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

function createProjectListItem(overrides: Partial<ProjectListItem> = {}): ProjectListItem {
  return {
    id: 'project-1',
    workspace_id: 'workspace-1',
    name: 'Проект',
    description: null,
    icon_name: 'briefcase',
    color: '#42a5ff',
    deadline: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    doneTaskCount: 0,
    totalTaskCount: 0,
    progress: 0,
    lastVisitedAt: null,
    deadlineStatus: {
      dateText: 'Без дедлайна',
      statusText: 'Срок не задан',
      tone: 'muted',
      daysUntilDeadline: null,
    },
    lastVisitText: 'Еще не открывали',
    displayColor: '#42a5ff',
    displayIconName: 'briefcase',
    ...overrides,
  };
}
