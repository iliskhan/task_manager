import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { loadCalendarDeadlines } from './calendarRepository';

export const calendarQueryKeys = {
  all: ['calendar'] as const,
  deadlines: (workspaceId: string) =>
    [...calendarQueryKeys.all, 'deadlines', workspaceId] as const,
};

export function useCalendarDeadlinesQuery(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: calendarQueryKeys.deadlines(workspaceId ?? 'missing-workspace'),
    enabled: Boolean(workspaceId),
    queryFn: () => loadCalendarDeadlines(supabase, workspaceId!),
  });
}
