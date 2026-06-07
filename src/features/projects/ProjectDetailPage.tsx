import Add from '@mui/icons-material/Add';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import Check from '@mui/icons-material/Check';
import CircleOutlined from '@mui/icons-material/CircleOutlined';
import MoreVert from '@mui/icons-material/MoreVert';
import {
  Box,
  ButtonBase,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { themeTokens } from '../../app/theme/theme';

const tasks = [
  { title: 'Заказать товар', date: '10.06.2024', done: false },
  { title: 'Оформить документы', date: '11.06.2024', done: false },
  { title: 'Встретиться с курьером', date: '12.06.2024', done: false },
  { title: 'Проверить накладные', date: '13.06.2024', done: true },
  { title: 'Оплатить поставку', date: '14.06.2024', done: true },
];

export function ProjectDetailPage() {
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'auto minmax(250px, 1fr) auto auto' },
          gap: 2,
          alignItems: 'center',
        }}
      >
        <IconButton
          component={RouterLink}
          to="/app/projects"
          aria-label="Назад к проектам"
          sx={{
            width: 60,
            height: 60,
            borderRadius: 2,
            backgroundColor: themeTokens.panel,
            border: `1px solid ${themeTokens.border}`,
            justifySelf: { xs: 'start', lg: 'center' },
          }}
        >
          <ArrowBack />
        </IconButton>

        <Box>
          <Typography component="h1" variant="h1">
            Бизнес
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.7 }}>
            Развитие и рост проекта
          </Typography>
        </Box>

        <InfoCard label="Прогресс">
          <Typography
            color={themeTokens.blue}
            sx={{ fontSize: '1.05rem', fontWeight: 800 }}
          >
            75%
          </Typography>
          <LinearProgress
            variant="determinate"
            value={75}
            sx={{
              mt: 0.7,
              width: 210,
              height: 9,
              borderRadius: 999,
              backgroundColor: '#31394b',
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                backgroundColor: themeTokens.blue,
              },
            }}
          />
        </InfoCard>

        <Paper
          sx={{
            minWidth: 252,
            p: 2,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.4,
            backgroundColor: 'rgba(22, 29, 42, 0.7)',
          }}
        >
          <CalendarMonthOutlined color="disabled" />
          <Box>
            <Typography color="text.secondary">Дедлайн</Typography>
            <Typography sx={{ mt: 0.3 }}>15.06.2024</Typography>
            <Typography color={themeTokens.red} variant="body2" sx={{ mt: 0.3 }}>
              Осталось 5 дней
            </Typography>
          </Box>
          <IconButton sx={{ ml: 'auto' }} aria-label="Действия проекта">
            <MoreVert />
          </IconButton>
        </Paper>
      </Box>

      <Tabs
        value="tasks"
        aria-label="Вкладки проекта"
        sx={{
          '& .MuiTabs-flexContainer': {
            justifyContent: { xs: 'space-between', sm: 'flex-start' },
          },
          '& .MuiTab-root': {
            minWidth: { xs: 0, sm: 120 },
            flex: { xs: '1 1 0', sm: '0 0 auto' },
            px: { xs: 1, sm: 3.5 },
          },
        }}
      >
        <Tab label="Задачи" value="tasks" />
        <Tab label="Обзор" value="overview" />
        <Tab label="Статистика" value="stats" />
      </Tabs>

      <ButtonBase
        sx={{
          minHeight: 72,
          justifyContent: 'flex-start',
          gap: 2,
          px: 2.5,
          borderRadius: 1,
          border: `1px solid ${themeTokens.border}`,
          backgroundColor: 'rgba(22, 29, 42, 0.72)',
          color: 'text.secondary',
          textAlign: 'left',
        }}
      >
        <Add />
        <Typography sx={{ fontSize: '1rem' }}>Добавить задачу</Typography>
      </ButtonBase>

      <Stack direction="row" spacing={1.4} sx={{ flexWrap: 'wrap', gap: 1.2 }}>
        {['Все', 'Не выполненные', 'Выполненные'].map((filter, index) => (
          <Chip
            key={filter}
            label={filter}
            color={index === 0 ? 'primary' : 'default'}
            sx={{
              height: 44,
              px: 1,
              fontSize: '0.92rem',
              backgroundColor:
                index === 0 ? themeTokens.purple : themeTokens.panelRaised,
            }}
          />
        ))}
      </Stack>

      <Stack spacing={1.2}>
        {tasks.map((task) => (
          <TaskRow key={task.title} task={task} />
        ))}
      </Stack>
    </Stack>
  );
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      sx={{
        minWidth: 270,
        p: 2,
        backgroundColor: 'rgba(22, 29, 42, 0.7)',
      }}
    >
      <Typography color="text.secondary">{label}</Typography>
      {children}
    </Paper>
  );
}

function TaskRow({
  task,
}: {
  task: {
    title: string;
    date: string;
    done: boolean;
  };
}) {
  return (
    <Paper
      sx={{
        minHeight: 88,
        display: 'grid',
        gridTemplateColumns: {
          xs: 'auto auto minmax(0, 1fr)',
          md: '32px 48px minmax(220px, 1fr) auto auto',
        },
        gap: { xs: 1.3, md: 2 },
        alignItems: 'center',
        p: { xs: 1.6, md: 2.2 },
        backgroundColor: themeTokens.panelRaised,
        opacity: task.done ? 0.72 : 1,
      }}
    >
      <MoreVert color="disabled" />
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          color: task.done ? '#111722' : themeTokens.textMuted,
          backgroundColor: task.done ? themeTokens.green : 'transparent',
          border: task.done ? 'none' : `2px solid ${themeTokens.textMuted}`,
        }}
      >
        {task.done ? <Check fontSize="small" /> : <CircleOutlined fontSize="small" />}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        <Typography
          color={task.done ? 'text.secondary' : 'text.primary'}
          noWrap
          sx={{ fontWeight: task.done ? 500 : 800 }}
        >
          {task.title}
        </Typography>
        <Chip
          label="Бизнес"
          size="small"
          sx={{
            color: '#82b8ff',
            backgroundColor: 'rgba(66, 165, 255, 0.12)',
          }}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'text.secondary',
          gridColumn: { xs: '2 / 4', md: 'auto' },
        }}
      >
        <CalendarMonthOutlined fontSize="small" />
        <Typography>{task.date}</Typography>
      </Box>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1,
          display: { xs: 'none', md: 'grid' },
          placeItems: 'center',
          color: task.done ? '#111722' : themeTokens.textMuted,
          backgroundColor: task.done ? themeTokens.green : 'transparent',
          border: task.done ? 'none' : `2px solid ${themeTokens.textMuted}`,
        }}
      >
        {task.done ? <Check fontSize="small" /> : null}
      </Box>
    </Paper>
  );
}
