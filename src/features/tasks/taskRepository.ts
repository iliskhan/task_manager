import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../board/boardConstants';
import type { BoardAssignee, BoardLabel, BoardTask, TaskMoveInput } from '../board/boardTypes';
import type { TablesInsert, TablesUpdate } from '../../lib/supabase/database.types';
import type {
  CreateTaskInput,
  LabelRow,
  ProfileRow,
  ProjectBoardRepositoryData,
  TaskLabelRow,
  TaskRow,
  UpdateTaskInput,
  WorkspaceMemberRow,
} from './taskTypes';

type TaskRepositoryClient = {
  from: (
    tableName:
      | 'tasks'
      | 'labels'
      | 'task_labels'
      | 'workspace_members'
      | 'profiles'
      | 'activity_events',
  ) => any;
};

type SupabaseResponse<T> = {
  data: T;
  error: Error | null;
};

export async function loadProjectBoard(
  client: TaskRepositoryClient,
  workspaceId: string,
  projectId: string,
): Promise<ProjectBoardRepositoryData> {
  const [tasksResponse, labelsResponse, membersResponse] = await Promise.all([
    client
      .from('tasks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('project_id', projectId)
      .order('status')
      .order('position', { ascending: true }),
    client.from('labels').select('*').eq('workspace_id', workspaceId),
    client.from('workspace_members').select('*').eq('workspace_id', workspaceId),
  ]);

  const tasks = getDataOrThrow<TaskRow[]>(tasksResponse);
  const labels = getDataOrThrow<LabelRow[]>(labelsResponse);
  const members = getDataOrThrow<WorkspaceMemberRow[]>(membersResponse);
  const taskIds = tasks.map((task) => task.id);
  const memberIds = members.map((member) => member.user_id);
  const [taskLabelsResponse, profilesResponse] = await Promise.all([
    taskIds.length
      ? client.from('task_labels').select('*').in('task_id', taskIds)
      : Promise.resolve({ data: [], error: null }),
    memberIds.length
      ? client.from('profiles').select('*').in('id', memberIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const taskLabels = getDataOrThrow<TaskLabelRow[]>(taskLabelsResponse);
  const profiles = getDataOrThrow<ProfileRow[]>(profilesResponse);

  return mapProjectBoardData(tasks, labels, taskLabels, members, profiles);
}

export async function createTask(
  client: TaskRepositoryClient,
  input: CreateTaskInput,
) {
  const taskPayload: TablesInsert<'tasks'> = {
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    created_by: input.userId,
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    assignee_id: input.assigneeId,
    due_date: input.dueDate,
    position: input.position,
  };
  const taskResponse = await client
    .from('tasks')
    .insert(taskPayload)
    .select('*')
    .single();
  const task = getDataOrThrow<TaskRow>(taskResponse);

  await insertTaskLabels(client, task.id, input.labelIds);
  await insertActivityEvent(client, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    taskId: task.id,
    eventType: 'task_created',
    payload: { title: task.title },
  });

  return task;
}

export async function updateTask(
  client: TaskRepositoryClient,
  input: UpdateTaskInput,
) {
  const taskPayload: TablesUpdate<'tasks'> = {
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    assignee_id: input.assigneeId,
    due_date: input.dueDate,
  };
  const taskResponse = await client
    .from('tasks')
    .update(taskPayload)
    .eq('workspace_id', input.workspaceId)
    .eq('project_id', input.projectId)
    .eq('id', input.taskId)
    .select('*')
    .single();
  const task = getDataOrThrow<TaskRow>(taskResponse);

  await replaceTaskLabels(client, input.taskId, input.labelIds);
  await insertActivityEvent(client, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    taskId: input.taskId,
    eventType: 'task_updated',
    payload: { title: task.title },
  });

  return task;
}

export async function moveTask(
  client: TaskRepositoryClient,
  input: TaskMoveInput,
) {
  const taskResponse = await client
    .from('tasks')
    .update({
      status: input.status,
      position: input.position,
    })
    .eq('workspace_id', input.workspaceId)
    .eq('project_id', input.projectId)
    .eq('id', input.taskId)
    .select('*')
    .single();
  const task = getDataOrThrow<TaskRow>(taskResponse);

  await insertActivityEvent(client, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    taskId: input.taskId,
    eventType: 'task_moved',
    payload: {
      title: task.title,
      status: input.status,
      position: input.position,
    },
  });

  return task;
}

function mapProjectBoardData(
  tasks: TaskRow[],
  labels: LabelRow[],
  taskLabels: TaskLabelRow[],
  members: WorkspaceMemberRow[],
  profiles: ProfileRow[],
): ProjectBoardRepositoryData {
  const labelsById = new Map(labels.map((label) => [label.id, mapLabel(label)]));
  const labelIdsByTaskId = new Map<string, string[]>();

  for (const taskLabel of taskLabels) {
    const current = labelIdsByTaskId.get(taskLabel.task_id) ?? [];
    current.push(taskLabel.label_id);
    labelIdsByTaskId.set(taskLabel.task_id, current);
  }

  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const assignees = members
    .map((member) => profilesById.get(member.user_id))
    .filter((profile): profile is ProfileRow => Boolean(profile))
    .map(mapAssignee);
  const assigneesById = new Map(assignees.map((assignee) => [assignee.id, assignee]));

  return {
    tasks: tasks.map((task) => {
      const taskLabelsForTask = (labelIdsByTaskId.get(task.id) ?? [])
        .map((labelId) => labelsById.get(labelId))
        .filter((label): label is BoardLabel => Boolean(label));

      return mapTask(task, taskLabelsForTask, assigneesById.get(task.assignee_id ?? '') ?? null);
    }),
    labels: labels.map(mapLabel),
    assignees,
  };
}

function mapTask(
  task: TaskRow,
  labels: BoardLabel[],
  assignee: BoardAssignee | null,
): BoardTask {
  return {
    id: task.id,
    workspaceId: task.workspace_id,
    projectId: task.project_id,
    title: task.title,
    description: task.description,
    status: toTaskStatus(task.status),
    priority: toTaskPriority(task.priority),
    assigneeId: task.assignee_id,
    dueDate: task.due_date,
    position: task.position,
    createdBy: task.created_by,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    labels,
    assignee,
  };
}

function mapLabel(label: LabelRow): BoardLabel {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
  };
}

function mapAssignee(profile: ProfileRow): BoardAssignee {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.display_name,
  };
}

async function replaceTaskLabels(
  client: TaskRepositoryClient,
  taskId: string,
  labelIds: string[],
) {
  const deleteResponse = await client.from('task_labels').delete().eq('task_id', taskId);
  getDataOrThrow(deleteResponse);
  await insertTaskLabels(client, taskId, labelIds);
}

async function insertTaskLabels(
  client: TaskRepositoryClient,
  taskId: string,
  labelIds: string[],
) {
  if (labelIds.length === 0) {
    return;
  }

  const response = await client.from('task_labels').insert(
    labelIds.map((labelId) => ({
      task_id: taskId,
      label_id: labelId,
    })),
  );

  getDataOrThrow(response);
}

async function insertActivityEvent(
  client: TaskRepositoryClient,
  input: {
    workspaceId: string;
    projectId: string;
    userId: string;
    taskId: string;
    eventType: 'task_created' | 'task_updated' | 'task_moved';
    payload: Record<string, unknown>;
  },
) {
  const response = await client.from('activity_events').insert({
    workspace_id: input.workspaceId,
    project_id: input.projectId,
    task_id: input.taskId,
    actor_id: input.userId,
    event_type: input.eventType,
    payload: input.payload,
  });

  getDataOrThrow(response);
}

function toTaskStatus(status: string): TaskStatus {
  return TASK_STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : 'todo';
}

function toTaskPriority(priority: string): TaskPriority {
  return TASK_PRIORITIES.includes(priority as TaskPriority) ? (priority as TaskPriority) : 'medium';
}

function getDataOrThrow<T>(response: SupabaseResponse<T>) {
  if (response.error) {
    throw response.error;
  }

  return response.data;
}
