import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { themeTokens } from '../../app/theme/theme';
import { PageHeader } from '../../shared/ui/PageHeader';
import { StatePanel } from '../../shared/ui/StatePanel';
import { useAuth } from '../auth/useAuth';
import { useCalendarDeadlinesQuery } from './calendarQueries';
import type { CalendarTaskDeadline } from './calendarTypes';
import {
  buildCalendarMonth,
  getCurrentMonthStart,
  isCalendarTaskOverdue,
  shiftCalendarMonth,
} from './calendarUtils';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function CalendarPage() {
  const { workspace } = useAuth();
  const deadlinesQuery = useCalendarDeadlinesQuery(workspace?.id);
  const [visibleMonth, setVisibleMonth] = useState(() => getCurrentMonthStart());
  const deadlines = deadlinesQuery.data ?? [];
  const month = useMemo(
    () => buildCalendarMonth(visibleMonth, deadlines),
    [deadlines, visibleMonth],
  );

  const goToPreviousMonth = () =>
    setVisibleMonth((currentMonth) => shiftCalendarMonth(currentMonth, -1));
  const goToNextMonth = () =>
    setVisibleMonth((currentMonth) => shiftCalendarMonth(currentMonth, 1));

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Календарь"
        subtitle="Месячный обзор дедлайнов по задачам текущего рабочего пространства."
      />

      <Paper sx={{ p: { xs: 1.5, md: 2.5 }, backgroundColor: themeTokens.panel }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <IconButton aria-label="Предыдущий месяц" onClick={goToPreviousMonth}>
              <ChevronLeft />
            </IconButton>
            <Typography component="h2" variant="h2" sx={{ textAlign: 'center' }}>
              {month.title}
            </Typography>
            <IconButton aria-label="Следующий месяц" onClick={goToNextMonth}>
              <ChevronRight />
            </IconButton>
          </Stack>

          {deadlinesQuery.isLoading ? (
            <StatePanel state="loading" message="Загружаем календарь..." />
          ) : null}

          {deadlinesQuery.isError ? (
            <StatePanel state="error" message="Не удалось загрузить календарь." />
          ) : null}

          {!deadlinesQuery.isLoading && !deadlinesQuery.isError ? (
            <Box sx={{ overflowX: 'auto', pb: 0.5 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(112px, 1fr))',
                  gap: 1,
                  minWidth: { xs: 820, md: 0 },
                }}
              >
                {weekdays.map((day) => (
                  <Typography
                    key={day}
                    color="text.secondary"
                    align="center"
                    variant="body2"
                    sx={{ fontWeight: 700 }}
                  >
                    {day}
                  </Typography>
                ))}
                {month.days.map((day) => (
                  <Box
                    key={day.date}
                    sx={{
                      minHeight: { xs: 112, md: 132 },
                      p: 1,
                      borderRadius: 1,
                      border: `1px solid ${day.isToday ? themeTokens.purple : themeTokens.border}`,
                      backgroundColor: day.isCurrentMonth
                        ? themeTokens.panelSoft
                        : 'rgba(18, 25, 37, 0.44)',
                      opacity: day.isCurrentMonth ? 1 : 0.62,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color={day.isToday ? themeTokens.purple : 'text.primary'}
                      sx={{ fontWeight: 800 }}
                    >
                      {day.dayOfMonth}
                    </Typography>
                    <Stack spacing={0.7} sx={{ mt: 1 }}>
                      {day.tasks.map((task) => (
                        <CalendarTaskLink key={task.id} task={task} />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : null}

          {!deadlinesQuery.isLoading && !deadlinesQuery.isError && deadlines.length === 0 ? (
            <StatePanel state="empty" message="В задачах пока нет дедлайнов." />
          ) : null}
        </Stack>
      </Paper>
    </Stack>
  );
}

function CalendarTaskLink({ task }: { task: CalendarTaskDeadline }) {
  const isOverdue = isCalendarTaskOverdue(task);

  return (
    <Box
      component={RouterLink}
      to={`/app/projects/${task.project.id}?taskId=${task.id}`}
      sx={{
        display: 'block',
        p: 0.85,
        borderRadius: 1,
        border: `1px solid ${isOverdue ? themeTokens.red : task.project.color}`,
        backgroundColor: isOverdue ? 'rgba(255, 107, 122, 0.12)' : 'rgba(66, 165, 255, 0.1)',
        color: 'text.primary',
        textDecoration: 'none',
        '&:hover': {
          backgroundColor: 'rgba(124, 58, 237, 0.18)',
        },
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
        {task.title}
      </Typography>
      <Typography color="text.secondary" variant="body2" sx={{ overflowWrap: 'anywhere' }}>
        {task.project.name}
      </Typography>
      {isOverdue ? (
        <Typography color={themeTokens.red} variant="body2" sx={{ fontWeight: 800 }}>
          Просрочено
        </Typography>
      ) : null}
    </Box>
  );
}
