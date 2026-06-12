import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { projectQueryKeys } from '../projects/projectQueries';
import type { ProjectBoardData } from '../board/boardTypes';
import {
  taskQueryKeys,
  useCreateTaskMutation,
  useMoveTaskMutation,
  useProjectBoardQuery,
} from './taskQueries';
import { createTask, loadProjectBoard, moveTask } from './taskRepository';
import type { CreateTaskInput } from './taskTypes';

vi.mock('../../lib/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

vi.mock('./taskRepository', () => ({
  loadProjectBoard: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  moveTask: vi.fn(),
}));

describe('taskQueries', () => {
  beforeEach(() => {
    vi.mocked(loadProjectBoard).mockReset();
    vi.mocked(createTask).mockReset();
    vi.mocked(moveTask).mockReset();
  });

  test('loads board data for a workspace and project', async () => {
    vi.mocked(loadProjectBoard).mockResolvedValue(createBoardData());
    const { wrapper } = createQueryWrapper();

    const { result } = renderHook(
      () => useProjectBoardQuery('workspace-1', 'project-1'),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(loadProjectBoard).toHaveBeenCalledWith(expect.anything(), 'workspace-1', 'project-1');
  });

  test('invalidates board and project caches after creating a task', async () => {
    vi.mocked(createTask).mockResolvedValue({ id: 'task-1' } as never);
    const { queryClient, wrapper } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTaskMutation(), { wrapper });

    await result.current.mutateAsync(createTaskInput());

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: taskQueryKeys.board('workspace-1', 'project-1'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: projectQueryKeys.list('workspace-1', 'user-1'),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: projectQueryKeys.detail('workspace-1', 'project-1'),
    });
  });

  test('optimistic move updates cached task and rollback restores it on error', async () => {
    vi.mocked(moveTask).mockRejectedValue(new Error('move failed'));
    const { queryClient, wrapper } = createQueryWrapper();
    queryClient.setQueryData(
      taskQueryKeys.board('workspace-1', 'project-1'),
      createBoardData(),
    );

    const { result } = renderHook(() => useMoveTaskMutation(), { wrapper });

    await expect(
      result.current.mutateAsync({
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        userId: 'user-1',
        taskId: 'task-1',
        status: 'done',
        position: 5000,
      }),
    ).rejects.toThrow('move failed');

    expect(queryClient.getQueryData(taskQueryKeys.board('workspace-1', 'project-1'))).toEqual(
      createBoardData(),
    );
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

function createTaskInput(overrides: Partial<CreateTaskInput> = {}): CreateTaskInput {
  return {
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    userId: 'user-1',
    title: 'Новая задача',
    description: null,
    status: 'todo',
    priority: 'medium',
    assigneeId: null,
    dueDate: null,
    labelIds: [],
    position: 1000,
    ...overrides,
  };
}

function createBoardData(): ProjectBoardData {
  return {
    labels: [],
    assignees: [],
    tasks: [
      {
        id: 'task-1',
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        title: 'Задача',
        description: null,
        status: 'todo',
        priority: 'medium',
        assigneeId: null,
        dueDate: null,
        position: 1000,
        createdBy: 'user-1',
        createdAt: '2026-06-07T00:00:00.000Z',
        updatedAt: '2026-06-07T00:00:00.000Z',
        labels: [],
        assignee: null,
      },
    ],
  };
}
