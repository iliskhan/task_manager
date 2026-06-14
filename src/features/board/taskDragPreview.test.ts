import { describe, expect, test } from 'vitest';
import type { TaskStatus } from './boardConstants';
import type { BoardTask } from './boardTypes';
import { applyPreviewMove } from './taskDragPreview';

describe('applyPreviewMove', () => {
  test('moves a task to another status at the target index', () => {
    const tasks = [
      createBoardTask({ id: 'task-1', status: 'todo', position: 1000 }),
      createBoardTask({ id: 'task-2', status: 'todo', position: 2000 }),
      createBoardTask({ id: 'task-3', status: 'done', position: 1000 }),
    ];

    const next = applyPreviewMove({
      tasks,
      activeTaskId: 'task-1',
      targetStatus: 'done',
      targetIndex: 1,
    });

    expect(next?.map((task) => `${task.status}:${task.id}`)).toEqual([
      'todo:task-2',
      'done:task-1',
      'done:task-3',
    ]);
  });

  test('moves within same status when hovered at another task index', () => {
    const tasks = [
      createBoardTask({ id: 'task-1', status: 'todo', position: 1000 }),
      createBoardTask({ id: 'task-2', status: 'todo', position: 2000 }),
      createBoardTask({ id: 'task-3', status: 'todo', position: 3000 }),
    ];

    const next = applyPreviewMove({
      tasks,
      activeTaskId: 'task-1',
      targetStatus: 'todo',
      targetIndex: 2,
    });

    expect(next?.map((task) => task.id)).toEqual(['task-2', 'task-1', 'task-3']);
  });

  test('returns null when same-column move keeps effective index', () => {
    const tasks = [
      createBoardTask({ id: 'task-1', status: 'todo', position: 1000 }),
      createBoardTask({ id: 'task-2', status: 'todo', position: 2000 }),
    ];

    const next = applyPreviewMove({
      tasks,
      activeTaskId: 'task-1',
      targetStatus: 'todo',
      targetIndex: 0,
    });

    expect(next).toBeNull();
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
