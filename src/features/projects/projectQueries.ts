import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import {
  archiveProject,
  createProject,
  loadProjectDetail,
  loadProjectList,
  recordProjectVisit,
  updateProject,
} from './projectRepository';
import type {
  ArchiveProjectInput,
  ProjectMutationInput,
  UpdateProjectInput,
} from './projectTypes';

type RecordProjectVisitInput = {
  workspaceId: string;
  projectId: string;
  userId: string;
};

export const projectQueryKeys = {
  all: ['projects'] as const,
  list: (workspaceId: string, userId: string) =>
    [...projectQueryKeys.all, 'list', workspaceId, userId] as const,
  detail: (workspaceId: string, projectId: string) =>
    [...projectQueryKeys.all, 'detail', workspaceId, projectId] as const,
};

export function useProjectListQuery(
  workspaceId: string | null | undefined,
  userId: string | null | undefined,
) {
  return useQuery({
    queryKey: projectQueryKeys.list(workspaceId ?? 'missing-workspace', userId ?? 'missing-user'),
    enabled: Boolean(workspaceId && userId),
    queryFn: () => loadProjectList(supabase, workspaceId!, userId!),
  });
}

export function useProjectDetailQuery(
  workspaceId: string | null | undefined,
  projectId: string | null | undefined,
) {
  return useQuery({
    queryKey: projectQueryKeys.detail(
      workspaceId ?? 'missing-workspace',
      projectId ?? 'missing-project',
    ),
    enabled: Boolean(workspaceId && projectId),
    queryFn: () => loadProjectDetail(supabase, workspaceId!, projectId!),
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProjectMutationInput) => createProject(supabase, input),
    onSuccess: (_project, input) =>
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.list(input.workspaceId, input.userId),
      }),
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => updateProject(supabase, input),
    onSuccess: (_project, input) => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.list(input.workspaceId, input.userId),
      });
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.detail(input.workspaceId, input.projectId),
      });
    },
  });
}

export function useArchiveProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ArchiveProjectInput) => archiveProject(supabase, input),
    onSuccess: (_project, input) => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.list(input.workspaceId, input.userId),
      });
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.detail(input.workspaceId, input.projectId),
      });
    },
  });
}

export function useRecordProjectVisitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordProjectVisitInput) =>
      recordProjectVisit(supabase, input.projectId, input.userId),
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.list(input.workspaceId, input.userId),
      });
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.detail(input.workspaceId, input.projectId),
      });
    },
  });
}
