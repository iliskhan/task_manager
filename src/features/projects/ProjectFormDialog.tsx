import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { themeTokens } from '../../app/theme/theme';
import type { ProjectIconName, ProjectListItem, ProjectMutationInput } from './projectTypes';

export type ProjectFormValues = Pick<
  ProjectMutationInput,
  'name' | 'description' | 'iconName' | 'color' | 'deadline'
>;

type ProjectFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  project?: ProjectListItem | null;
  isSubmitting?: boolean;
  error?: Error | null;
  onClose: () => void;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
};

const colors = [
  { value: themeTokens.blue, label: 'Синий' },
  { value: themeTokens.green, label: 'Зеленый' },
  { value: '#a855f7', label: 'Фиолетовый' },
  { value: themeTokens.orange, label: 'Оранжевый' },
];

const icons: Array<{ value: ProjectIconName; label: string }> = [
  { value: 'briefcase', label: 'Портфель' },
  { value: 'laptop', label: 'Работа' },
  { value: 'school', label: 'Учеба' },
  { value: 'heart', label: 'Личное' },
];

const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'Название обязательно'),
  description: z.string().trim(),
  deadline: z.string(),
  color: z.string(),
  iconName: z.enum(['briefcase', 'laptop', 'school', 'heart']),
});

type ProjectFormState = z.input<typeof projectFormSchema>;

export function ProjectFormDialog({
  open,
  mode,
  project,
  isSubmitting = false,
  error,
  onClose,
  onSubmit,
}: ProjectFormDialogProps) {
  const initialState = useMemo(
    () => getInitialState(project),
    [project],
  );
  const [values, setValues] = useState<ProjectFormState>(initialState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setValues(initialState);
      setFieldErrors({});
    }
  }, [initialState, open]);

  const handleSubmit = async () => {
    const result = projectFormSchema.safeParse(values);

    if (!result.success) {
      setFieldErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }

    setFieldErrors({});
    await onSubmit({
      name: result.data.name,
      description: result.data.description || null,
      deadline: result.data.deadline || null,
      color: result.data.color,
      iconName: result.data.iconName,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mode === 'create' ? 'Новый проект' : 'Редактировать проект'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.2} sx={{ pt: 1 }}>
          {error ? <Alert severity="error">{error.message}</Alert> : null}
          <TextField
            label="Название проекта"
            value={values.name}
            error={Boolean(fieldErrors.name)}
            helperText={fieldErrors.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            autoFocus
          />
          <TextField
            label="Описание"
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            multiline
            minRows={3}
          />
          <TextField
            label="Дедлайн"
            type="date"
            value={values.deadline}
            onChange={(event) =>
              setValues((current) => ({ ...current, deadline: event.target.value }))
            }
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
            }}
          >
            <TextField
              select
              label="Иконка"
              value={values.iconName}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  iconName: event.target.value as ProjectIconName,
                }))
              }
            >
              {icons.map((icon) => (
                <MenuItem key={icon.value} value={icon.value}>
                  {icon.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Цвет"
              value={values.color}
              onChange={(event) =>
                setValues((current) => ({ ...current, color: event.target.value }))
              }
            >
              {colors.map((color) => (
                <MenuItem key={color.value} value={color.value}>
                  {color.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
          {mode === 'create' ? 'Создать' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function getInitialState(project?: ProjectListItem | null): ProjectFormState {
  return {
    name: project?.name ?? '',
    description: project?.description ?? '',
    deadline: project?.deadline ?? '',
    color: project?.displayColor ?? themeTokens.blue,
    iconName: project?.displayIconName ?? 'briefcase',
  };
}
