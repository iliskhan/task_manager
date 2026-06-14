import Add from '@mui/icons-material/Add';
import {
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_TASK_POSITION,
  TASK_POSITION_STEP,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  type TaskStatus,
} from './boardConstants';
import type { BoardTask, BoardColumnView } from './boardTypes';
import { BoardColumn } from './BoardColumn';
import { groupTasksByStatus } from './taskGrouping';
import { calculateTaskMovePosition } from './taskPositioning';
import { applyPreviewMove, groupTasksByStatusPreserveOrder } from './taskDragPreview';
import {
  useCreateTaskMutation,
  useMoveTaskMutation,
  useProjectBoardQuery,
  useUpdateTaskMutation,
} from '../tasks/taskQueries';
import { TaskDrawer, type TaskDrawerSubmitValues } from '../tasks/TaskDrawer';

type KanbanBoardProps = {
  workspaceId: string;
  projectId: string;
  currentUserId: string;
  projectName: string;
  projectColor: string;
  initialTaskId?: string;
};

type DrawerState =
  | { mode: 'create'; task: null; defaultStatus: TaskStatus }
  | { mode: 'edit'; task: BoardTask; defaultStatus: TaskStatus };

type DragTarget = {
  overId: string;
  status: TaskStatus;
  index: number;
};

export function KanbanBoard({
  workspaceId,
  projectId,
  currentUserId,
  projectName,
  projectColor,
  initialTaskId,
}: KanbanBoardProps) {
  const boardQuery = useProjectBoardQuery(workspaceId, projectId);
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const moveTaskMutation = useMoveTaskMutation();
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [openedInitialTaskId, setOpenedInitialTaskId] = useState<string | null>(null);
  const [previewTasks, setPreviewTasks] = useState<BoardTask[] | null>(null);
  const [lastDragTarget, setLastDragTarget] = useState<DragTarget | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const boardData = boardQuery.data ?? {
    tasks: [],
    labels: [],
    assignees: [],
  };
  const baseTasksByStatus = useMemo(() => groupTasksByStatus(boardData.tasks), [boardData.tasks]);
  const boardTasks = previewTasks ?? boardData.tasks;
  const tasksByStatus = useMemo(
    () =>
      previewTasks
        ? groupTasksByStatusPreserveOrder(boardTasks)
        : groupTasksByStatus(boardTasks),
    [boardTasks, previewTasks],
  );
  const columns = useMemo<BoardColumnView[]>(() => {
    return TASK_STATUSES.map((status) => ({
      status,
      label: TASK_STATUS_LABELS[status],
      tasks: tasksByStatus[status],
    }));
  }, [tasksByStatus]);

  useEffect(() => {
    if (!initialTaskId || openedInitialTaskId === initialTaskId || drawerState) {
      return;
    }

    const initialTask = boardData.tasks.find((task) => task.id === initialTaskId);

    if (!initialTask) {
      return;
    }

    setDrawerState({
      mode: 'edit',
      task: initialTask,
      defaultStatus: initialTask.status,
    });
    setOpenedInitialTaskId(initialTaskId);
  }, [boardData.tasks, drawerState, initialTaskId, openedInitialTaskId]);

  const handleCreateClick = () => {
    setBoardError(null);
    setDrawerState({ mode: 'create', task: null, defaultStatus: 'todo' });
  };

  const handleTaskClick = (task: BoardTask) => {
    setBoardError(null);
    setDrawerState({ mode: 'edit', task, defaultStatus: task.status });
  };

  const handleDrawerSubmit = async (values: TaskDrawerSubmitValues) => {
    if (drawerState?.mode === 'edit' && values.taskId) {
      await updateTaskMutation.mutateAsync({
        workspaceId,
        projectId,
        userId: currentUserId,
        taskId: values.taskId,
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        assigneeId: values.assigneeId,
        dueDate: values.dueDate,
        labelIds: values.labelIds,
      });
      setDrawerState(null);
      return;
    }

    const targetTasks = baseTasksByStatus[values.status];
    const lastTask = targetTasks[targetTasks.length - 1] ?? null;
    await createTaskMutation.mutateAsync({
      workspaceId,
      projectId,
      userId: currentUserId,
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      assigneeId: values.assigneeId,
      dueDate: values.dueDate,
      labelIds: values.labelIds,
      position: lastTask ? lastTask.position + TASK_POSITION_STEP : DEFAULT_TASK_POSITION,
    });
    setDrawerState(null);
  };

  const resetDragState = () => {
    setPreviewTasks(null);
    setLastDragTarget(null);
  };

  const handleDragStart = (_event: DragStartEvent) => {
    setBoardError(null);
    resetDragState();
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) {
      return;
    }

    const activeTaskId = String(event.active.id);
    const overId = String(event.over.id);
    const target = getTargetDropLocation(overId, tasksByStatus);

    if (!target) {
      resetDragState();
      return;
    }

    setLastDragTarget({
      overId,
      status: target.status,
      index: target.index,
    });

    const next = applyPreviewMove({
      tasks: boardTasks,
      activeTaskId,
      targetStatus: target.status,
      targetIndex: target.index,
    });

    if (next) {
      setPreviewTasks(next);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const dragTaskId = String(event.active.id);
    const eventOverId = event.over ? String(event.over.id) : null;
    const activeTask = getTaskById(baseTasksByStatus, dragTaskId);
    const target = resolveDropTarget({
      eventOverId,
      activeTask,
      baseTasksByStatus,
      lastDragTarget,
    });

    if (!target) {
      resetDragState();
      return;
    }

    const move = calculateTaskMovePosition({
      activeTaskId: dragTaskId,
      overTaskId: target.overId,
      targetStatus: target.status,
      targetIndex: target.index,
      tasksByStatus: baseTasksByStatus,
    });

    if (!move) {
      resetDragState();
      return;
    }

    try {
      setBoardError(null);
      await moveTaskMutation.mutateAsync({
        workspaceId,
        projectId,
        userId: currentUserId,
        taskId: move.taskId,
        status: move.status,
        position: move.position,
      });
    } catch {
      setBoardError('Не удалось переместить задачу. Задача пока в рабочем состоянии и должна вернуться после завершения.');
    } finally {
      resetDragState();
    }
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    resetDragState();
  };

  if (boardQuery.isLoading) {
    return (
      <Stack spacing={1.5} sx={{ minHeight: 320, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Загрузка доски...</Typography>
      </Stack>
    );
  }

  if (boardQuery.isError) {
    return <Alert severity="error">Не удалось загрузить задачи проекта.</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.4}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography component="h2" variant="h2">
            Доска задач
          </Typography>
          <Typography color="text.secondary">
            {projectName}: задачи сгруппированы по статусам.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateClick}
          sx={{
            background: `linear-gradient(135deg, ${projectColor}, #7c3aed)`,
          }}
        >
          Добавить задачу
        </Button>
      </Stack>

      {boardError ? <Alert severity="error">{boardError}</Alert> : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            overflowX: 'auto',
            pb: 1,
          }}
        >
          {columns.map((column) => (
            <BoardColumn key={column.status} column={column} onTaskClick={handleTaskClick} />
          ))}
        </Box>
      </DndContext>

      <TaskDrawer
        open={Boolean(drawerState)}
        mode={drawerState?.mode ?? 'create'}
        task={drawerState?.mode === 'edit' ? drawerState.task : null}
        defaultStatus={drawerState?.defaultStatus ?? 'todo'}
        labels={boardData.labels}
        assignees={boardData.assignees}
        isSubmitting={createTaskMutation.isPending || updateTaskMutation.isPending}
        error={(createTaskMutation.error ?? updateTaskMutation.error) as Error | null}
        onClose={() => setDrawerState(null)}
        onSubmit={handleDrawerSubmit}
      />
    </Stack>
  );
}

function getTargetDropLocation(
  overId: string,
  tasksByStatus: Record<TaskStatus, BoardTask[]>,
): { status: TaskStatus; index: number } | null {
  if (TASK_STATUSES.includes(overId as TaskStatus)) {
    const status = overId as TaskStatus;

    return {
      status,
      index: tasksByStatus[status].length,
    };
  }

  for (const status of TASK_STATUSES) {
    const index = tasksByStatus[status].findIndex((task) => task.id === overId);

    if (index >= 0) {
      return { status, index };
    }
  }

  return null;
}

function getTaskById(
  tasksByStatus: Record<TaskStatus, BoardTask[]>,
  taskId: string,
): BoardTask | null {
  for (const status of TASK_STATUSES) {
    const task = tasksByStatus[status].find((candidate) => candidate.id === taskId);

    if (task) {
      return task;
    }
  }

  return null;
}

export function resolveDropTarget(input: {
  eventOverId: string | null;
  activeTask: BoardTask | null;
  baseTasksByStatus: Record<TaskStatus, BoardTask[]>;
  lastDragTarget: DragTarget | null;
}): DragTarget | null {
  if (!input.eventOverId) {
    return null;
  }

  const eventTarget = getTargetDropLocation(input.eventOverId, input.baseTasksByStatus);

  if (!eventTarget) {
    return null;
  }

  const shouldUseLastTarget =
    !!input.activeTask &&
    input.activeTask.status === eventTarget.status &&
    !!input.lastDragTarget &&
    input.lastDragTarget.status !== eventTarget.status;

  if (shouldUseLastTarget) {
    return input.lastDragTarget;
  }

  return {
    overId: input.eventOverId,
    ...eventTarget,
  };
}
