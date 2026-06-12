import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  projectQueryKeys,
  useCreateProjectMutation,
  useProjectListQuery,
} from './projectQueries';
import { createProject, loadProjectList } from './projectRepository';

vi.mock('../../lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('./projectRepository', () => ({
  createProject: vi.fn(),
  loadProjectList: vi.fn(),
  loadProjectDetail: vi.fn(),
  updateProject: vi.fn(),
  archiveProject: vi.fn(),
  recordProjectVisit: vi.fn(),
}));

describe('projectQueries', () => {
  beforeEach(() => {
    vi.mocked(loadProjectList).mockReset();
    vi.mocked(createProject).mockReset();
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
