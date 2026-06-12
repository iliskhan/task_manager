import { describe, expect, test } from 'vitest';
import { calculateWorkspaceStats } from './statsMetrics';
import type { StatsActivityEventRow, StatsProfileRow, StatsProjectRow, StatsTaskRow } from './statsTypes';

describe('statsMetrics', () => {
  test('calculates workspace progress, status counts, deadlines, and recent activity', () => {
    const stats = calculateWorkspaceStats({
      projects: [
        createProject({ id: 'project-1', name: 'Бизнес', color: '#42a5ff' }),
        createProject({ id: 'project-2', name: 'Работа', color: '#66d861' }),
        createProject({
          id: 'archived-project',
          name: 'Архив',
          archived_at: '2026-06-10T00:00:00.000Z',
        }),
      ],
      tasks: [
        createTask({
          id: 'done-task',
          project_id: 'project-1',
          title: 'Готовая задача',
          status: 'done',
          due_date: '2026-06-10',
        }),
        createTask({
          id: 'overdue-task',
          project_id: 'project-1',
          title: 'Просроченная задача',
          status: 'todo',
          due_date: '2026-06-11',
        }),
        createTask({
          id: 'upcoming-task',
          project_id: 'project-2',
          title: 'Ближайший дедлайн',
          status: 'review',
          due_date: '2026-06-15',
        }),
        createTask({
          id: 'archived-task',
          project_id: 'archived-project',
          title: 'Архивная задача',
          status: 'todo',
          due_date: '2026-06-16',
        }),
      ],
      activityEvents: [
        createActivity({
          id: 'event-older',
          event_type: 'project_created',
          project_id: 'project-1',
          payload: { name: 'Бизнес' },
          created_at: '2026-06-10T09:00:00.000Z',
        }),
        createActivity({
          id: 'event-newer',
          event_type: 'task_moved',
          project_id: 'project-1',
          task_id: 'overdue-task',
          payload: { title: 'Просроченная задача' },
          created_at: '2026-06-11T09:00:00.000Z',
        }),
      ],
      profiles: [createProfile({ id: 'user-1', display_name: 'Мария' })],
      now: new Date('2026-06-12T12:00:00.000Z'),
    });

    expect(stats.summary).toEqual({
      activeProjectCount: 2,
      totalTaskCount: 3,
      completedTaskCount: 1,
      completionPercent: 33,
      overdueTaskCount: 1,
      upcomingDeadlineCount: 1,
    });
    expect(stats.statusCounts.map((item) => [item.status, item.count])).toEqual([
      ['backlog', 0],
      ['todo', 1],
      ['in_progress', 0],
      ['review', 1],
      ['done', 1],
    ]);
    expect(stats.projectProgress).toEqual([
      expect.objectContaining({
        projectId: 'project-1',
        name: 'Бизнес',
        progress: 50,
        totalTaskCount: 2,
      }),
      expect.objectContaining({
        projectId: 'project-2',
        name: 'Работа',
        progress: 0,
        totalTaskCount: 1,
      }),
    ]);
    expect(stats.overdueTasks.map((task) => task.title)).toEqual(['Просроченная задача']);
    expect(stats.upcomingDeadlines.map((task) => task.title)).toEqual(['Ближайший дедлайн']);
    expect(stats.recentActivity[0]).toMatchObject({
      id: 'event-newer',
      label: 'Задача перемещена',
      description: 'Просроченная задача',
      actorName: 'Мария',
      projectName: 'Бизнес',
    });
  });
});

function createProject(overrides: Partial<StatsProjectRow> = {}): StatsProjectRow {
  return {
    id: 'project-1',
    workspace_id: 'workspace-1',
    name: 'Проект',
    description: null,
    icon_name: 'briefcase',
    color: '#42a5ff',
    deadline: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}

function createTask(overrides: Partial<StatsTaskRow> = {}): StatsTaskRow {
  return {
    id: 'task-1',
    workspace_id: 'workspace-1',
    project_id: 'project-1',
    title: 'Задача',
    description: null,
    status: 'todo',
    priority: 'medium',
    assignee_id: null,
    due_date: null,
    position: 1000,
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}

function createActivity(overrides: Partial<StatsActivityEventRow> = {}): StatsActivityEventRow {
  return {
    id: 'event-1',
    workspace_id: 'workspace-1',
    project_id: 'project-1',
    task_id: null,
    actor_id: 'user-1',
    event_type: 'task_created',
    payload: {},
    created_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}

function createProfile(overrides: Partial<StatsProfileRow> = {}): StatsProfileRow {
  return {
    id: 'user-1',
    email: 'member@example.com',
    display_name: null,
    avatar_url: null,
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}
