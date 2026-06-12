import { calculateWorkspaceStats } from './statsMetrics';
import type {
  StatsActivityEventRow,
  StatsProfileRow,
  StatsProjectRow,
  StatsTaskRow,
  WorkspaceStats,
} from './statsTypes';

type StatsRepositoryClient = {
  from: (
    tableName: 'projects' | 'tasks' | 'activity_events' | 'profiles',
  ) => any;
};

type SupabaseResponse<T> = {
  data: T;
  error: Error | null;
};

type RepositoryOptions = {
  now?: Date;
};

export async function loadWorkspaceStats(
  client: StatsRepositoryClient,
  workspaceId: string,
  options: RepositoryOptions = {},
): Promise<WorkspaceStats> {
  const [projectsResponse, tasksResponse, activityResponse] = await Promise.all([
    client
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    client
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('due_date', { ascending: true }),
    client
      .from('activity_events')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(12),
  ]);

  const projects = getDataOrThrow<StatsProjectRow[]>(projectsResponse);
  const tasks = getDataOrThrow<StatsTaskRow[]>(tasksResponse);
  const activityEvents = getDataOrThrow<StatsActivityEventRow[]>(activityResponse);
  const actorIds = Array.from(
    new Set(
      activityEvents
        .map((event) => event.actor_id)
        .filter((actorId): actorId is string => Boolean(actorId)),
    ),
  );
  const profiles = actorIds.length
    ? getDataOrThrow<StatsProfileRow[]>(
        await client.from('profiles').select('*').in('id', actorIds),
      )
    : [];

  return calculateWorkspaceStats({
    projects,
    tasks,
    activityEvents,
    profiles,
    now: options.now,
  });
}

function getDataOrThrow<T>(response: SupabaseResponse<T>) {
  if (response.error) {
    throw response.error;
  }

  return response.data;
}
