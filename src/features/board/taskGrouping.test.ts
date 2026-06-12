import { describe, expect, test } from 'vitest';
import { TASK_STATUSES } from './boardConstants';
import { createBoardColumns, groupTasksByStatus } from './taskGrouping';
import type { BoardTask } from './boardTypes';

describe('taskGrouping', () => {
  test('keeps all empty status columns visible', () => {
    const grouped = groupTasksByStatus([]);
    const columns = createBoardColumns([]);

    expect(Object.keys(grouped)).toEqual([...TASK_STATUSES]);
    expect(columns.map((column) => column.status)).toEqual([...TASK_STATUSES]);
    expect(columns.every((column) => column.tasks.length === 0)).toBe(true);
  });

  test('sorts tasks by position inside their status', () => {
    const grouped = groupTasksByStatus([
      createBoardTask({ id: 'third', status: 'todo', position: 3000 }),
      createBoardTask({ id: 'first', status: 'todo', position: 1000 }),
      createBoardTask({ id: 'second', status: 'todo', position: 2000 }),
      createBoardTask({ id: 'done', status: 'done', position: 1000 }),
    ]);

    expect(grouped.todo.map((task) => task.id)).toEqual(['first', 'second', 'third']);
    expect(grouped.done.map((task) => task.id)).toEqual(['done']);
  });
});

function createBoardTask(overrides: Partial<BoardTask>): BoardTask {
  return {
    id: 'task-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    title: 'Task',
    description: null,
    status: 'todo',
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
