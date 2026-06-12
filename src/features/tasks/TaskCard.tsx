import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import {
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { themeTokens } from '../../app/theme/theme';
import type { BoardTask } from '../board/boardTypes';
import {
  formatAssignee,
  formatTaskDueDate,
  formatTaskPriority,
} from './taskFormatters';

type TaskCardProps = {
  task: BoardTask;
  onClick: (task: BoardTask) => void;
};

const dueDateColorByTone = {
  muted: themeTokens.textMuted,
  default: themeTokens.textSecondary,
  warning: themeTokens.yellow,
  danger: themeTokens.red,
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const priority = formatTaskPriority(task.priority);
  const dueDate = formatTaskDueDate(task.dueDate);

  return (
    <Paper
      ref={setNodeRef}
      component="button"
      type="button"
      onClick={() => onClick(task)}
      {...attributes}
      {...listeners}
      sx={{
        width: '100%',
        minHeight: 168,
        p: 1.6,
        border: `1px solid ${task.status === 'done' ? 'rgba(102, 216, 97, 0.35)' : themeTokens.border}`,
        backgroundColor: task.status === 'done' ? 'rgba(102, 216, 97, 0.08)' : themeTokens.panelRaised,
        color: 'text.primary',
        textAlign: 'left',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.62 : task.status === 'done' ? 0.82 : 1,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <Stack spacing={1.2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Chip
            label={priority.label}
            size="small"
            sx={{
              color: priority.color,
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              fontWeight: 700,
            }}
          />
        </Stack>

        <Typography sx={{ fontWeight: 800, wordBreak: 'break-word' }}>
          {task.title}
        </Typography>

        {task.labels.length ? (
          <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
            {task.labels.map((label) => (
              <Chip
                key={label.id}
                label={label.name}
                size="small"
                sx={{
                  color: label.color ?? themeTokens.blue,
                  backgroundColor: 'rgba(66, 165, 255, 0.1)',
                }}
              />
            ))}
          </Stack>
        ) : null}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 0.7,
            color: 'text.secondary',
          }}
        >
          <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', minWidth: 0 }}>
            <AssignmentIndOutlined fontSize="small" />
            <Typography variant="body2" noWrap>
              {formatAssignee(task.assignee)}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={0.8}
            sx={{
              alignItems: 'center',
              minWidth: 0,
              color: dueDateColorByTone[dueDate.tone],
            }}
          >
            <CalendarMonthOutlined fontSize="small" />
            <Typography variant="body2" noWrap>
              {dueDate.text}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
