import { describe, expect, test } from 'vitest';
import { calculateProjectMetrics } from './projectMetrics';
import type { ProjectTaskRow } from './projectTypes';

describe('calculateProjectMetrics', () => {
  test('returns zero progress for a project without tasks', () => {
    expect(calculateProjectMetrics('project-1', [])).toEqual({
      doneTaskCount: 0,
      totalTaskCount: 0,
      progress: 0,
    });
  });

  test('rounds progress for mixed task statuses in the target project', () => {
    const tasks = [
      createTask({ id: 'task-1', project_id: 'project-1', status: 'done' }),
      createTask({ id: 'task-2', project_id: 'project-1', status: 'in_progress' }),
      createTask({ id: 'task-3', project_id: 'project-1', status: 'todo' }),
      createTask({ id: 'task-4', project_id: 'project-2', status: 'done' }),
    ];

    expect(calculateProjectMetrics('project-1', tasks)).toEqual({
      doneTaskCount: 1,
      totalTaskCount: 3,
      progress: 33,
    });
  });

  test('returns full progress when every target project task is done', () => {
    const tasks = [
      createTask({ id: 'task-1', project_id: 'project-1', status: 'done' }),
      createTask({ id: 'task-2', project_id: 'project-1', status: 'done' }),
    ];

    expect(calculateProjectMetrics('project-1', tasks).progress).toBe(100);
  });
});

function createTask(overrides: Partial<ProjectTaskRow>): ProjectTaskRow {
  return {
    id: 'task',
    workspace_id: 'workspace-1',
    project_id: 'project-1',
    title: 'Task',
    description: null,
    status: 'todo',
    priority: 'medium',
    assignee_id: null,
    due_date: null,
    position: 100,
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}
