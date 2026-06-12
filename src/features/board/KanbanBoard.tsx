import Add from '@mui/icons-material/Add';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import {
  DEFAULT_TASK_POSITION,
  TASK_POSITION_STEP,
  TASK_STATUSES,
  type TaskStatus,
} from './boardConstants';
import type { BoardTask } from './boardTypes';
import { BoardColumn } from './BoardColumn';
import { createBoardColumns, groupTasksByStatus } from './taskGrouping';
import { calculateTaskMovePosition } from './taskPositioning';
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
};

type DrawerState =
  | { mode: 'create'; task: null; defaultStatus: TaskStatus }
  | { mode: 'edit'; task: BoardTask; defaultStatus: TaskStatus };

export function KanbanBoard({
  workspaceId,
  projectId,
  currentUserId,
  projectName,
  projectColor,
}: KanbanBoardProps) {
  const boardQuery = useProjectBoardQuery(workspaceId, projectId);
  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const moveTaskMutation = useMoveTaskMutation();
  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
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
  const columns = useMemo(() => createBoardColumns(boardData.tasks), [boardData.tasks]);
  const tasksByStatus = useMemo(() => groupTasksByStatus(boardData.tasks), [boardData.tasks]);

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

    const targetTasks = tasksByStatus[values.status];
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const activeTaskId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId || activeTaskId === overId) {
      return;
    }

    const target = getTargetDropLocation(overId, tasksByStatus);

    if (!target) {
      return;
    }

    const move = calculateTaskMovePosition({
      activeTaskId,
      overTaskId: overId,
      targetStatus: target.status,
      targetIndex: target.index,
      tasksByStatus,
    });

    if (!move) {
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
      setBoardError('Не удалось переместить задачу. Доска возвращена к предыдущему состоянию.');
    }
  };

  if (boardQuery.isLoading) {
    return (
      <Stack spacing={1.5} sx={{ minHeight: 320, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={28} />
        <Typography color="text.secondary">Загружаем доску...</Typography>
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

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
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
