import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  InputLabel,
  MenuItem,
  NativeSelect,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from '../board/boardConstants';
import type { BoardAssignee, BoardLabel } from '../board/boardTypes';
import { formatAssignee } from './taskFormatters';
import type { TaskFormSchemaInput } from './taskSchemas';

type TaskFormProps = {
  values: TaskFormSchemaInput;
  fieldErrors: Record<string, string>;
  labels: BoardLabel[];
  assignees: BoardAssignee[];
  onChange: (values: TaskFormSchemaInput) => void;
};

export function TaskForm({
  values,
  fieldErrors,
  labels,
  assignees,
  onChange,
}: TaskFormProps) {
  const updateValue = <Key extends keyof TaskFormSchemaInput>(
    key: Key,
    value: TaskFormSchemaInput[Key],
  ) => {
    onChange({ ...values, [key]: value });
  };

  const toggleLabel = (labelId: string) => {
    const nextLabelIds = values.labelIds.includes(labelId)
      ? values.labelIds.filter((currentLabelId) => currentLabelId !== labelId)
      : [...values.labelIds, labelId];

    updateValue('labelIds', nextLabelIds);
  };

  return (
    <Stack spacing={2.2}>
      <TextField
        label="Название задачи"
        value={values.title}
        error={Boolean(fieldErrors.title)}
        helperText={fieldErrors.title}
        onChange={(event) => updateValue('title', event.target.value)}
        autoFocus
      />
      <TextField
        label="Описание"
        value={values.description}
        onChange={(event) => updateValue('description', event.target.value)}
        multiline
        minRows={3}
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
          label="Статус"
          value={values.status}
          onChange={(event) => updateValue('status', event.target.value as TaskStatus)}
        >
          {TASK_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {TASK_STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Приоритет"
          value={values.priority}
          onChange={(event) => updateValue('priority', event.target.value as TaskPriority)}
        >
          {TASK_PRIORITIES.map((priority) => (
            <MenuItem key={priority} value={priority}>
              {TASK_PRIORITY_LABELS[priority]}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <FormControl fullWidth sx={{ minWidth: 0 }}>
        <InputLabel
          shrink
          variant="standard"
          htmlFor="task-assignee"
          sx={{ maxWidth: '100%' }}
        >
          Исполнитель
        </InputLabel>
        <NativeSelect
          sx={{
            mt: 1.1,
            '& .MuiNativeSelect-select': {
              boxSizing: 'border-box',
              minHeight: 34,
              overflow: 'hidden',
              pr: 4,
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
          }}
          inputProps={{
            id: 'task-assignee',
          }}
          value={values.assigneeId}
          onChange={(event) => updateValue('assigneeId', event.target.value)}
        >
          <option value="">Без исполнителя</option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {formatAssignee(assignee)}
            </option>
          ))}
        </NativeSelect>
      </FormControl>

      <TextField
        label="Срок"
        type="date"
        value={values.dueDate}
        onChange={(event) => updateValue('dueDate', event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <FormControl error={Boolean(fieldErrors.labelIds)} component="fieldset">
        <Typography component="legend" color="text.secondary" variant="body2" sx={{ mb: 0.8 }}>
          Метки
        </Typography>
        <FormGroup row>
          {labels.length ? (
            labels.map((label) => (
              <FormControlLabel
                key={label.id}
                control={
                  <Checkbox
                    checked={values.labelIds.includes(label.id)}
                    onChange={() => toggleLabel(label.id)}
                  />
                }
                label={label.name}
              />
            ))
          ) : (
            <Typography color="text.secondary" variant="body2">
              Метки пока не созданы
            </Typography>
          )}
        </FormGroup>
        {fieldErrors.labelIds ? <FormHelperText>{fieldErrors.labelIds}</FormHelperText> : null}
      </FormControl>
    </Stack>
  );
}
