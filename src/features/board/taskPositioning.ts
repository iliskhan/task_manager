import {
  DEFAULT_TASK_POSITION,
  TASK_POSITION_STEP,
  type TaskStatus,
} from './boardConstants';
import type {
  BoardTask,
  TaskMoveCalculationInput,
  TaskMoveCalculationResult,
} from './boardTypes';

export function calculateTaskMovePosition({
  activeTaskId,
  targetStatus,
  targetIndex,
  tasksByStatus,
}: TaskMoveCalculationInput): TaskMoveCalculationResult {
  const activeTask = findTaskById(tasksByStatus, activeTaskId);

  if (!activeTask) {
    return null;
  }

  const originalColumn = tasksByStatus[activeTask.status];
  const originalIndex = originalColumn.findIndex((task) => task.id === activeTaskId);
  const targetColumnWithoutActive = tasksByStatus[targetStatus].filter(
    (task) => task.id !== activeTaskId,
  );
  const boundedIndex = Math.max(0, Math.min(targetIndex, targetColumnWithoutActive.length));

  if (activeTask.status === targetStatus && originalIndex === boundedIndex) {
    return null;
  }

  const previousTask = targetColumnWithoutActive[boundedIndex - 1] ?? null;
  const nextTask = targetColumnWithoutActive[boundedIndex] ?? null;
  const position = calculatePositionBetween(previousTask, nextTask);

  if (activeTask.status === targetStatus && activeTask.position === position) {
    return null;
  }

  return {
    taskId: activeTask.id,
    status: targetStatus,
    position,
  };
}

function calculatePositionBetween(previousTask: BoardTask | null, nextTask: BoardTask | null) {
  if (!previousTask && !nextTask) {
    return DEFAULT_TASK_POSITION;
  }

  if (!previousTask) {
    return nextTask!.position / 2;
  }

  if (!nextTask) {
    return previousTask.position + TASK_POSITION_STEP;
  }

  return (previousTask.position + nextTask.position) / 2;
}

function findTaskById(
  tasksByStatus: Record<TaskStatus, BoardTask[]>,
  taskId: string,
): BoardTask | null {
  for (const columnTasks of Object.values(tasksByStatus)) {
    const task = columnTasks.find((candidate) => candidate.id === taskId);

    if (task) {
      return task;
    }
  }

  return null;
}
