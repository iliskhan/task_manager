import {
  Alert,
  Button,
  Drawer,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import type { TaskStatus } from '../board/boardConstants';
import type { BoardAssignee, BoardLabel, BoardTask } from '../board/boardTypes';
import { TaskForm } from './TaskForm';
import { taskFormSchema, type TaskFormSchemaInput, type TaskFormSchemaOutput } from './taskSchemas';

export type TaskDrawerSubmitValues = TaskFormSchemaOutput & {
  taskId?: string;
};

type TaskDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  task?: BoardTask | null;
  defaultStatus: TaskStatus;
  labels: BoardLabel[];
  assignees: BoardAssignee[];
  isSubmitting?: boolean;
  error?: Error | null;
  onClose: () => void;
  onSubmit: (values: TaskDrawerSubmitValues) => Promise<void> | void;
};

export function TaskDrawer({
  open,
  mode,
  task = null,
  defaultStatus,
  labels,
  assignees,
  isSubmitting = false,
  error = null,
  onClose,
  onSubmit,
}: TaskDrawerProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const initialValues = useMemo(
    () => getInitialValues(mode, defaultStatus, task),
    [defaultStatus, mode, task],
  );
  const [values, setValues] = useState<TaskFormSchemaInput>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setFieldErrors({});
    }
  }, [initialValues, open]);

  const handleSubmit = async () => {
    const result = taskFormSchema.safeParse(values);

    if (!result.success) {
      setFieldErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }

    setFieldErrors({});
    await onSubmit(
      mode === 'edit' && task?.id
        ? { taskId: task.id, ...result.data }
        : result.data,
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: fullScreen ? '100vw' : 460,
            maxWidth: '100vw',
            p: { xs: 2, sm: 3 },
            backgroundColor: 'background.paper',
          },
        },
      }}
    >
      <Stack spacing={2.4} sx={{ minHeight: '100%' }}>
        <Stack spacing={0.6}>
          <Typography component="h2" variant="h2">
            {mode === 'create' ? 'Новая задача' : 'Редактировать задачу'}
          </Typography>
          <Typography color="text.secondary">
            {mode === 'create'
              ? 'Добавьте задачу в доску проекта.'
              : 'Обновите поля задачи без смены контекста доски.'}
          </Typography>
        </Stack>

        {error ? <Alert severity="error">{error.message}</Alert> : null}

        <TaskForm
          values={values}
          fieldErrors={fieldErrors}
          labels={labels}
          assignees={assignees}
          onChange={setValues}
        />

        <Stack direction="row" spacing={1.2} sx={{ mt: 'auto', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
            {mode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}

function getInitialValues(
  mode: 'create' | 'edit',
  defaultStatus: TaskStatus,
  task: BoardTask | null,
): TaskFormSchemaInput {
  if (mode === 'edit' && task) {
    return {
      title: task.title,
      description: task.description ?? '',
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ?? '',
      dueDate: task.dueDate ?? '',
      labelIds: task.labels.map((label) => label.id),
    };
  }

  return {
    title: '',
    description: '',
    status: defaultStatus,
    priority: 'medium',
    assigneeId: '',
    dueDate: '',
    labelIds: [],
  };
}
