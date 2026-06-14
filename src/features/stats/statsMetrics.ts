import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type TaskStatus,
} from '../board/boardConstants';
import { toDateIso } from '../../shared/date/dateUtils';
import { calculateProjectMetrics } from '../projects/projectMetrics';
import { getProjectColor } from '../projects/projectFormatters';
import type {
  StatsActivityEventRow,
  StatsActivityItem,
  StatsDeadlineTask,
  StatsProfileRow,
  StatsProjectProgress,
  StatsProjectRow,
  StatsTaskRow,
  WorkspaceStats,
  WorkspaceStatsInput,
} from './statsTypes';

export function calculateWorkspaceStats(input: WorkspaceStatsInput): WorkspaceStats {
  const now = input.now ?? new Date();
  const today = toDateIso(now);
  const activeProjects = input.projects.filter((project) => !project.archived_at);
  const activeProjectsById = new Map(activeProjects.map((project) => [project.id, project]));
  const activeTasks = input.tasks.filter((task) => activeProjectsById.has(task.project_id));
  const completedTasks = activeTasks.filter((task) => task.status === 'done');
  const overdueTasks = activeTasks
    .filter((task) => isOverdueTask(task, today))
    .map((task) => mapDeadlineTask(task, activeProjectsById.get(task.project_id)!))
    .sort(compareDeadlineTasks);
  const upcomingDeadlines = activeTasks
    .filter((task) => isUpcomingTask(task, today))
    .map((task) => mapDeadlineTask(task, activeProjectsById.get(task.project_id)!))
    .sort(compareDeadlineTasks);

  return {
    summary: {
      activeProjectCount: activeProjects.length,
      totalTaskCount: activeTasks.length,
      completedTaskCount: completedTasks.length,
      completionPercent: calculatePercent(completedTasks.length, activeTasks.length),
      overdueTaskCount: overdueTasks.length,
      upcomingDeadlineCount: upcomingDeadlines.length,
    },
    statusCounts: TASK_STATUSES.map((status) => {
      const count = activeTasks.filter((task) => task.status === status).length;

      return {
        status,
        label: TASK_STATUS_LABELS[status],
        color: TASK_STATUS_COLORS[status],
        count,
        percent: calculatePercent(count, activeTasks.length),
      };
    }),
    projectProgress: activeProjects
      .map((project) => mapProjectProgress(project, activeTasks))
      .sort((first, second) => first.name.localeCompare(second.name, 'ru')),
    overdueTasks,
    upcomingDeadlines,
    recentActivity: mapRecentActivity(
      input.activityEvents,
      activeProjectsById,
      input.profiles ?? [],
    ),
  };
}

function mapProjectProgress(
  project: StatsProjectRow,
  tasks: StatsTaskRow[],
): StatsProjectProgress {
  const metrics = calculateProjectMetrics(project.id, tasks);

  return {
    projectId: project.id,
    name: project.name,
    color: getProjectColor(project.color),
    doneTaskCount: metrics.doneTaskCount,
    totalTaskCount: metrics.totalTaskCount,
    progress: metrics.progress,
  };
}

function mapDeadlineTask(
  task: StatsTaskRow,
  project: StatsProjectRow,
): StatsDeadlineTask {
  return {
    id: task.id,
    title: task.title,
    dueDate: task.due_date!,
    status: toTaskStatus(task.status),
    projectId: project.id,
    projectName: project.name,
    projectColor: getProjectColor(project.color),
  };
}

function mapRecentActivity(
  events: StatsActivityEventRow[],
  projectsById: Map<string, StatsProjectRow>,
  profiles: StatsProfileRow[],
): StatsActivityItem[] {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return [...events]
    .filter((event) => !event.project_id || projectsById.has(event.project_id))
    .sort((first, second) => second.created_at.localeCompare(first.created_at))
    .slice(0, 8)
    .map((event) => {
      const project = event.project_id ? projectsById.get(event.project_id) ?? null : null;
      const profile = event.actor_id ? profilesById.get(event.actor_id) : null;

      return {
        id: event.id,
        label: getActivityLabel(event.event_type),
        description: getActivityDescription(event, project),
        actorName: getActorName(profile),
        projectName: project?.name ?? null,
        createdAt: event.created_at,
      };
    });
}

function getActivityLabel(eventType: string) {
  const labels: Record<string, string> = {
    project_created: 'Создан проект',
    project_updated: 'Обновлен проект',
    project_archived: 'Проект архивирован',
    task_created: 'Создана задача',
    task_updated: 'Обновлена задача',
    task_moved: 'Задача перемещена',
    member_added: 'Добавлен участник',
  };

  return labels[eventType] ?? 'Событие';
}

function getActivityDescription(
  event: StatsActivityEventRow,
  project: StatsProjectRow | null,
) {
  const payload = isRecord(event.payload) ? event.payload : {};
  const value = payload.title ?? payload.name ?? payload.email;

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return project?.name ?? 'Без описания';
}

function getActorName(profile: StatsProfileRow | null | undefined) {
  if (!profile) {
    return 'Система';
  }

  return profile.display_name || profile.email;
}

function isOverdueTask(task: StatsTaskRow, today: string) {
  return Boolean(task.due_date) && task.status !== 'done' && task.due_date! < today;
}

function isUpcomingTask(task: StatsTaskRow, today: string) {
  return Boolean(task.due_date) && task.status !== 'done' && task.due_date! >= today;
}

function compareDeadlineTasks(first: StatsDeadlineTask, second: StatsDeadlineTask) {
  return (
    first.dueDate.localeCompare(second.dueDate) ||
    first.projectName.localeCompare(second.projectName, 'ru') ||
    first.title.localeCompare(second.title, 'ru')
  );
}

function calculatePercent(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function toTaskStatus(status: string): TaskStatus {
  return TASK_STATUSES.includes(status as TaskStatus) ? (status as TaskStatus) : 'todo';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
