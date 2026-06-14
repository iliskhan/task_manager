import type { BoardTask, TaskStatus } from './boardTypes';
import { TASK_STATUSES } from './boardConstants';

type PreviewMoveInput = {
  tasks: BoardTask[];
  activeTaskId: string;
  targetStatus: TaskStatus;
  targetIndex: number;
};

export function applyPreviewMove({
  tasks,
  activeTaskId,
  targetStatus,
  targetIndex,
}: PreviewMoveInput): BoardTask[] | null {
  const tasksByStatus = groupTasksByStatusPreserveOrder(tasks);
  const sourceStatus = getTaskStatusById(tasksByStatus, activeTaskId);

  if (!sourceStatus) {
    return null;
  }

  const sourceTasks = [...tasksByStatus[sourceStatus]];
  const activeIndex = sourceTasks.findIndex((task) => task.id === activeTaskId);

  if (activeIndex === -1) {
    return null;
  }

  const activeTask = sourceTasks[activeIndex];
  const filteredSource = sourceTasks.filter((task) => task.id !== activeTaskId);
  tasksByStatus[sourceStatus] = filteredSource;

  const targetTasks = [...tasksByStatus[targetStatus]];
  const maxIndex = targetTasks.length;
  const boundedTargetIndex = Math.max(0, Math.min(targetIndex, maxIndex));
  const effectiveIndex =
    sourceStatus === targetStatus
      ? Math.max(
          0,
          Math.min(
            boundedTargetIndex - (activeIndex < boundedTargetIndex ? 1 : 0),
            maxIndex,
          ),
        )
      : boundedTargetIndex;

  if (sourceStatus === targetStatus && activeIndex === effectiveIndex) {
    return null;
  }

  targetTasks.splice(effectiveIndex, 0, {
    ...activeTask,
    status: targetStatus,
  });
  tasksByStatus[targetStatus] = targetTasks;

  return TASK_STATUSES.flatMap((status) => tasksByStatus[status]);
}

export function groupTasksByStatusPreserveOrder(tasks: BoardTask[]): Record<TaskStatus, BoardTask[]> {
  const grouped = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, [] as BoardTask[]]),
  ) as Record<TaskStatus, BoardTask[]>;

  for (const task of tasks) {
    grouped[task.status].push(task);
  }

  return grouped;
}

function getTaskStatusById(
  tasksByStatus: Record<TaskStatus, BoardTask[]>,
  taskId: string,
): TaskStatus | null {
  for (const status of TASK_STATUSES) {
    if (tasksByStatus[status].some((task) => task.id === taskId)) {
      return status;
    }
  }

  return null;
}
