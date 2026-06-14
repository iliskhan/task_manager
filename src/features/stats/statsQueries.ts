import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { loadWorkspaceStats } from './statsRepository';

export const statsQueryKeys = {
  all: ['stats'] as const,
  workspace: (workspaceId: string | null) =>
    [...statsQueryKeys.all, 'workspace', workspaceId] as const,
};

export function useWorkspaceStatsQuery(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: statsQueryKeys.workspace(workspaceId ?? null),
    enabled: Boolean(workspaceId),
    queryFn: () => loadWorkspaceStats(supabase, workspaceId!),
  });
}
