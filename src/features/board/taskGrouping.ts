import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from './boardConstants';
import type { BoardColumnView, BoardTask } from './boardTypes';

export function groupTasksByStatus(tasks: BoardTask[]): Record<TaskStatus, BoardTask[]> {
  const grouped = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, [] as BoardTask[]]),
  ) as Record<TaskStatus, BoardTask[]>;

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  for (const status of TASK_STATUSES) {
    grouped[status].sort((first, second) => first.position - second.position);
  }

  return grouped;
}

export function createBoardColumns(tasks: BoardTask[]): BoardColumnView[] {
  const grouped = groupTasksByStatus(tasks);

  return TASK_STATUSES.map((status) => ({
    status,
    label: TASK_STATUS_LABELS[status],
    tasks: grouped[status],
  }));
}
