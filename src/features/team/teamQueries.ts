import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { addWorkspaceMember, loadWorkspaceMembers } from './teamRepository';
import type { AddWorkspaceMemberInput } from './teamTypes';

export const teamQueryKeys = {
  all: ['team'] as const,
  members: (workspaceId: string | null) =>
    [...teamQueryKeys.all, 'members', workspaceId] as const,
};

export function useWorkspaceMembersQuery(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: teamQueryKeys.members(workspaceId ?? null),
    enabled: Boolean(workspaceId),
    queryFn: () => loadWorkspaceMembers(supabase, workspaceId!),
  });
}

export function useAddWorkspaceMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddWorkspaceMemberInput) =>
      addWorkspaceMember(supabase, input),
    onSuccess: (_member, input) =>
      queryClient.invalidateQueries({
        queryKey: teamQueryKeys.members(input.workspaceId),
      }),
  });
}
