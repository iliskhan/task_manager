import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { themeTokens } from '../../app/theme/theme';
import { TASK_STATUS_COLORS } from './boardConstants';
import type { BoardColumnView, BoardTask } from './boardTypes';
import { TaskCard } from '../tasks/TaskCard';

type BoardColumnProps = {
  column: BoardColumnView;
  onTaskClick: (task: BoardTask) => void;
};

export function BoardColumn({ column, onTaskClick }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status });

  return (
    <Paper
      ref={setNodeRef}
      sx={{
        minWidth: 280,
        width: 300,
        minHeight: 440,
        p: 1.5,
        backgroundColor: isOver ? 'rgba(124, 58, 237, 0.13)' : 'rgba(18, 25, 37, 0.92)',
      }}
    >
      <Stack spacing={1.5} sx={{ height: '100%' }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: '50%',
                backgroundColor: TASK_STATUS_COLORS[column.status],
              }}
            />
            <Typography component="h3" variant="h3" noWrap>
              {column.label}
            </Typography>
          </Stack>
          <Typography
            aria-label={`${column.label}: ${column.tasks.length}`}
            color="text.secondary"
            variant="body2"
            sx={{ fontWeight: 800 }}
          >
            {column.tasks.length}
          </Typography>
        </Stack>

        <SortableContext
          items={column.tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={1.2} sx={{ flex: 1 }}>
            {column.tasks.length ? (
              column.tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={onTaskClick} />
              ))
            ) : (
              <Box
                sx={{
                  minHeight: 120,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 1,
                  border: `1px dashed ${themeTokens.border}`,
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">Нет задач</Typography>
              </Box>
            )}
          </Stack>
        </SortableContext>
      </Stack>
    </Paper>
  );
}
