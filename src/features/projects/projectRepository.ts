import type { TablesInsert, TablesUpdate } from '../../lib/supabase/database.types';
import { formatDeadlineStatus, formatLastVisit, getProjectColor, getProjectIconName } from './projectFormatters';
import { calculateProjectMetrics } from './projectMetrics';
import type {
  ArchiveProjectInput,
  ProjectListItem,
  ProjectMutationInput,
  ProjectRow,
  RestoreProjectInput,
  ProjectTaskRow,
  ProjectVisitRow,
  UpdateProjectInput,
} from './projectTypes';

type ProjectRepositoryClient = {
  from: (tableName: 'projects' | 'tasks' | 'project_visits' | 'activity_events') => any;
};

type RepositoryOptions = {
  now?: Date;
};

type SupabaseResponse<T> = {
  data: T;
  error: Error | null;
};

export async function loadProjectList(
  client: ProjectRepositoryClient,
  workspaceId: string,
  userId: string,
  options: RepositoryOptions = {},
): Promise<ProjectListItem[]> {
  const [projectsResponse, tasksResponse, visitsResponse] = await Promise.all([
    client
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    client.from('tasks').select('*').eq('workspace_id', workspaceId),
    client
      .from('project_visits')
      .select('*')
      .eq('user_id', userId)
      .order('visited_at', { ascending: false }),
  ]);

  const projects = getDataOrThrow<ProjectRow[]>(projectsResponse);
  const tasks = getDataOrThrow<ProjectTaskRow[]>(tasksResponse);
  const visits = getDataOrThrow<ProjectVisitRow[]>(visitsResponse);
  const visitsByProjectId = new Map(
    visits.map((visit) => [visit.project_id, visit.visited_at]),
  );

  return projects.map((project) =>
    mapProjectListItem(project, tasks, visitsByProjectId.get(project.id) ?? null, options),
  );
}

export async function loadProjectDetail(
  client: ProjectRepositoryClient,
  workspaceId: string,
  projectId: string,
  options: RepositoryOptions = {},
): Promise<ProjectListItem | null> {
  const projectResponse = await client
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', projectId)
    .maybeSingle();

  const project = getDataOrThrow<ProjectRow | null>(projectResponse);

  if (!project) {
    return null;
  }

  const tasksResponse = await client
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('project_id', projectId);

  return mapProjectListItem(
    project,
    getDataOrThrow<ProjectTaskRow[]>(tasksResponse),
    null,
    options,
  );
}

export async function createProject(
  client: ProjectRepositoryClient,
  input: ProjectMutationInput,
) {
  const projectPayload: TablesInsert<'projects'> = {
    workspace_id: input.workspaceId,
    created_by: input.userId,
    name: input.name,
    description: input.description,
    icon_name: input.iconName,
    color: input.color,
    deadline: input.deadline,
  };
  const projectResponse = await client
    .from('projects')
    .insert(projectPayload)
    .select('*')
    .single();
  const project = getDataOrThrow<ProjectRow>(projectResponse);

  await insertActivityEvent(client, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    projectId: project.id,
    eventType: 'project_created',
    payload: { name: project.name },
  });

  return project;
}

export async function updateProject(
  client: ProjectRepositoryClient,
  input: UpdateProjectInput,
) {
  const projectPayload: TablesUpdate<'projects'> = {
    name: input.name,
    description: input.description,
    icon_name: input.iconName,
    color: input.color,
    deadline: input.deadline,
  };
  const projectResponse = await client
    .from('projects')
    .update(projectPayload)
    .eq('workspace_id', input.workspaceId)
    .eq('id', input.projectId)
    .select('*')
    .single();
  const project = getDataOrThrow<ProjectRow>(projectResponse);

  await insertActivityEvent(client, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    projectId: input.projectId,
    eventType: 'project_updated',
    payload: { name: project.name },
  });

  return project;
}

export async function archiveProject(
  client: ProjectRepositoryClient,
  input: ArchiveProjectInput,
  options: RepositoryOptions = {},
) {
  const archivedAt = (options.now ?? new Date()).toISOString();
  const projectResponse = await client
    .from('projects')
    .update({ archived_at: archivedAt })
    .eq('workspace_id', input.workspaceId)
    .eq('id', input.projectId)
    .select('*')
    .single();
  const project = getDataOrThrow<ProjectRow>(projectResponse);

  await insertActivityEvent(client, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    projectId: input.projectId,
    eventType: 'project_archived',
    payload: { name: project.name },
  });

  return project;
}

export async function restoreProject(
  client: ProjectRepositoryClient,
  input: RestoreProjectInput,
) {
  const projectResponse = await client
    .from('projects')
    .update({ archived_at: null })
    .eq('workspace_id', input.workspaceId)
    .eq('id', input.projectId)
    .select('*')
    .single();
  const project = getDataOrThrow<ProjectRow>(projectResponse);

  await insertActivityEvent(client, {
    workspaceId: input.workspaceId,
    userId: input.userId,
    projectId: input.projectId,
    eventType: 'project_restored',
    payload: { name: project.name },
  });

  return project;
}

export async function recordProjectVisit(
  client: ProjectRepositoryClient,
  projectId: string,
  userId: string,
  options: RepositoryOptions = {},
) {
  const visitResponse = await client.from('project_visits').upsert(
    {
      project_id: projectId,
      user_id: userId,
      visited_at: (options.now ?? new Date()).toISOString(),
    },
    { onConflict: 'project_id,user_id' },
  );

  getDataOrThrow(visitResponse);
}

function mapProjectListItem(
  project: ProjectRow,
  tasks: ProjectTaskRow[],
  lastVisitedAt: string | null,
  options: RepositoryOptions,
): ProjectListItem {
  return {
    ...project,
    ...calculateProjectMetrics(project.id, tasks),
    lastVisitedAt,
    deadlineStatus: formatDeadlineStatus(project.deadline, options.now),
    lastVisitText: formatLastVisit(lastVisitedAt, options.now),
    displayColor: getProjectColor(project.color),
    displayIconName: getProjectIconName(project.icon_name),
  };
}

async function insertActivityEvent(
  client: ProjectRepositoryClient,
  input: {
    workspaceId: string;
    userId: string;
    projectId: string;
    eventType:
      | 'project_created'
      | 'project_updated'
      | 'project_archived'
      | 'project_restored';
    payload: Record<string, string>;
  },
) {
  const response = await client.from('activity_events').insert({
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    task_id: null,
    actor_id: input.userId,
    event_type: input.eventType,
    payload: input.payload,
  });

  getDataOrThrow(response);
}

function getDataOrThrow<T>(response: SupabaseResponse<T>) {
  if (response.error) {
    throw response.error;
  }

  return response.data;
}
