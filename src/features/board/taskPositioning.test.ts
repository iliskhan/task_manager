import { describe, expect, test } from 'vitest';
import { TASK_STATUSES, type TaskStatus } from './boardConstants';
import { groupTasksByStatus } from './taskGrouping';
import { calculateTaskMovePosition } from './taskPositioning';
import type { BoardTask } from './boardTypes';

describe('taskPositioning', () => {
  test('returns the default position for an empty target column', () => {
    const result = calculateTaskMovePosition({
      activeTaskId: 'active',
      overTaskId: null,
      targetStatus: 'done',
      targetIndex: 0,
      tasksByStatus: groupTasksByStatus([
        createBoardTask({ id: 'active', status: 'todo', position: 1000 }),
      ]),
    });

    expect(result).toEqual({
      taskId: 'active',
      status: 'done',
      position: 1000,
    });
  });

  test('appending after the last task adds the position step', () => {
    const result = calculateTaskMovePosition({
      activeTaskId: 'active',
      overTaskId: null,
      targetStatus: 'done',
      targetIndex: 2,
      tasksByStatus: groupTasksByStatus([
        createBoardTask({ id: 'active', status: 'todo', position: 1000 }),
        createBoardTask({ id: 'done-1', status: 'done', position: 1000 }),
        createBoardTask({ id: 'done-2', status: 'done', position: 2000 }),
      ]),
    });

    expect(result?.position).toBe(3000);
  });

  test('inserting between neighbors returns the midpoint', () => {
    const result = calculateTaskMovePosition({
      activeTaskId: 'active',
      overTaskId: 'done-2',
      targetStatus: 'done',
      targetIndex: 1,
      tasksByStatus: groupTasksByStatus([
        createBoardTask({ id: 'active', status: 'todo', position: 1000 }),
        createBoardTask({ id: 'done-1', status: 'done', position: 1000 }),
        createBoardTask({ id: 'done-2', status: 'done', position: 3000 }),
      ]),
    });

    expect(result?.position).toBe(2000);
  });

  test('same-column reorder to the effective same index returns null', () => {
    const result = calculateTaskMovePosition({
      activeTaskId: 'active',
      overTaskId: 'active',
      targetStatus: 'todo',
      targetIndex: 0,
      tasksByStatus: groupTasksByStatus([
        createBoardTask({ id: 'active', status: 'todo', position: 1000 }),
        createBoardTask({ id: 'second', status: 'todo', position: 2000 }),
      ]),
    });

    expect(result).toBeNull();
  });
});

function createBoardTask(overrides: Partial<BoardTask>): BoardTask {
  return {
    id: 'task-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    title: 'Task',
    description: null,
    status: 'todo' as TaskStatus,
    priority: 'medium',
    assigneeId: null,
    dueDate: null,
    position: 1000,
    createdBy: 'user-1',
    createdAt: '2026-06-07T00:00:00.000Z',
    updatedAt: '2026-06-07T00:00:00.000Z',
    labels: [],
    assignee: null,
    ...overrides,
  };
}
