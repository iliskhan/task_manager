import { getProjectColor, getProjectIconName } from '../projects/projectFormatters';
import type { ProjectRow } from '../projects/projectTypes';
import type { TaskRow } from '../tasks/taskTypes';
import type { CalendarTaskDeadline } from './calendarTypes';

type CalendarRepositoryClient = {
  from: (tableName: 'projects' | 'tasks') => any;
};

type SupabaseResponse<T> = {
  data: T;
  error: Error | null;
};

export async function loadCalendarDeadlines(
  client: CalendarRepositoryClient,
  workspaceId: string,
): Promise<CalendarTaskDeadline[]> {
  const [projectsResponse, tasksResponse] = await Promise.all([
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
  ]);

  const projects = getDataOrThrow<ProjectRow[]>(projectsResponse);
  const tasks = getDataOrThrow<TaskRow[]>(tasksResponse);
  const activeProjectsById = new Map(
    projects
      .filter((project) => !project.archived_at)
      .map((project) => [project.id, project]),
  );

  return tasks
    .filter((task) => Boolean(task.due_date))
    .map((task) => mapCalendarDeadline(task, activeProjectsById.get(task.project_id)))
    .filter((task): task is CalendarTaskDeadline => Boolean(task))
    .sort(compareCalendarDeadlines);
}

function mapCalendarDeadline(
  task: TaskRow,
  project: ProjectRow | undefined,
): CalendarTaskDeadline | null {
  if (!project || !task.due_date) {
    return null;
  }

  return {
    id: task.id,
    title: task.title,
    status: toTaskStatus(task.status),
    priority: toTaskPriority(task.priority),
    dueDate: task.due_date,
    project: {
      id: project.id,
      name: project.name,
      color: getProjectColor(project.color),
      iconName: getProjectIconName(project.icon_name),
    },
  };
}

function compareCalendarDeadlines(
  first: CalendarTaskDeadline,
  second: CalendarTaskDeadline,
) {
  return (
    first.dueDate.localeCompare(second.dueDate) ||
    first.project.name.localeCompare(second.project.name, 'ru') ||
    first.title.localeCompare(second.title, 'ru')
  );
}

function toTaskStatus(status: string): CalendarTaskDeadline['status'] {
  if (
    status === 'backlog' ||
    status === 'todo' ||
    status === 'in_progress' ||
    status === 'review' ||
    status === 'done'
  ) {
    return status;
  }

  return 'todo';
}

function toTaskPriority(priority: string): CalendarTaskDeadline['priority'] {
  if (
    priority === 'low' ||
    priority === 'medium' ||
    priority === 'high' ||
    priority === 'urgent'
  ) {
    return priority;
  }

  return 'medium';
}

function getDataOrThrow<T>(response: SupabaseResponse<T>) {
  if (response.error) {
    throw response.error;
  }

  return response.data;
}
