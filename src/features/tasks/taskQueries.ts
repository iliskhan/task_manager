import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { projectQueryKeys } from '../projects/projectQueries';
import type { ProjectBoardData, TaskMoveInput } from '../board/boardTypes';
import {
  createTask,
  loadProjectBoard,
  moveTask,
  updateTask,
} from './taskRepository';
import type { CreateTaskInput, UpdateTaskInput } from './taskTypes';

export const taskQueryKeys = {
  all: ['tasks'] as const,
  board: (workspaceId: string, projectId: string) =>
    [...taskQueryKeys.all, 'board', workspaceId, projectId] as const,
};

export function useProjectBoardQuery(
  workspaceId: string | null | undefined,
  projectId: string | null | undefined,
) {
  return useQuery({
    queryKey: taskQueryKeys.board(
      workspaceId ?? 'missing-workspace',
      projectId ?? 'missing-project',
    ),
    enabled: Boolean(workspaceId && projectId),
    queryFn: () => loadProjectBoard(supabase, workspaceId!, projectId!),
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(supabase, input),
    onSuccess: (_task, input) => {
      invalidateTaskProjectCaches(queryClient, input);
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTaskInput) => updateTask(supabase, input),
    onSuccess: (_task, input) => {
      invalidateTaskProjectCaches(queryClient, input);
    },
  });
}

export function useMoveTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskMoveInput) => moveTask(supabase, input),
    onMutate: async (input) => {
      const boardKey = taskQueryKeys.board(input.workspaceId, input.projectId);
      await queryClient.cancelQueries({ queryKey: boardKey });
      const previousBoard = queryClient.getQueryData<ProjectBoardData>(boardKey);

      if (previousBoard) {
        queryClient.setQueryData<ProjectBoardData>(boardKey, {
          ...previousBoard,
          tasks: previousBoard.tasks.map((task) =>
            task.id === input.taskId
              ? {
                  ...task,
                  status: input.status,
                  position: input.position,
                }
              : task,
          ),
        });
      }

      return { previousBoard };
    },
    onError: (_error, input, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(
          taskQueryKeys.board(input.workspaceId, input.projectId),
          context.previousBoard,
        );
      }
    },
    onSettled: (_task, _error, input) => {
      if (input) {
        invalidateTaskProjectCaches(queryClient, input);
      }
    },
  });
}

function invalidateTaskProjectCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  input: {
    workspaceId: string;
    projectId: string;
    userId: string;
  },
) {
  queryClient.invalidateQueries({
    queryKey: taskQueryKeys.board(input.workspaceId, input.projectId),
  });
  queryClient.invalidateQueries({
    queryKey: projectQueryKeys.list(input.workspaceId, input.userId),
  });
  queryClient.invalidateQueries({
    queryKey: projectQueryKeys.detail(input.workspaceId, input.projectId),
  });
}
