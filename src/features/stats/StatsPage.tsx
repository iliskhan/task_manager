import {
  Box,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { type ReactNode } from 'react';
import { themeTokens } from '../../app/theme/theme';
import { PageHeader } from '../../shared/ui/PageHeader';
import { StatePanel } from '../../shared/ui/StatePanel';
import { useAuth } from '../auth/useAuth';
import { useWorkspaceStatsQuery } from './statsQueries';
import type {
  StatsActivityItem,
  StatsDeadlineTask,
  StatsProjectProgress,
  StatsStatusCount,
  WorkspaceStats,
} from './statsTypes';

export function StatsPage() {
  const { workspace } = useAuth();
  const statsQuery = useWorkspaceStatsQuery(workspace?.id);
  const stats = statsQuery.data ?? null;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Статистика"
        subtitle="Прогресс, статусы, просрочки и активность по текущему рабочему пространству."
      />

      {statsQuery.isLoading ? (
        <StatePanel state="loading" message="Загружаем статистику..." />
      ) : null}

      {statsQuery.isError ? (
        <StatePanel state="error" message="Не удалось загрузить статистику." />
      ) : null}

      {!statsQuery.isLoading && !statsQuery.isError && stats ? (
        <StatsDashboard stats={stats} />
      ) : null}

      {!statsQuery.isLoading && !statsQuery.isError && !stats ? (
        <StatePanel state="empty" message="Данных для статистики пока нет." />
      ) : null}
    </Stack>
  );
}

function StatsDashboard({ stats }: { stats: WorkspaceStats }) {
  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <SummaryTile label="Готовность" value={`${stats.summary.completionPercent}%`} tone={themeTokens.green} />
        <SummaryTile label="Активные проекты" value={String(stats.summary.activeProjectCount)} tone={themeTokens.blue} />
        <SummaryTile label="Просрочено" value={String(stats.summary.overdueTaskCount)} tone={themeTokens.red} />
        <SummaryTile label="Ближайшие сроки" value={String(stats.summary.upcomingDeadlineCount)} tone={themeTokens.yellow} />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 0.9fr)' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Panel title="Прогресс проектов">
          <Stack spacing={1.6}>
            {stats.projectProgress.length ? (
              stats.projectProgress.map((project) => (
                <ProjectProgressRow key={project.projectId} project={project} />
              ))
            ) : (
              <EmptyText>Активных проектов пока нет.</EmptyText>
            )}
          </Stack>
        </Panel>

        <Panel title="Статусы задач">
          <Stack spacing={1.5}>
            {stats.statusCounts.map((status) => (
              <StatusCountRow key={status.status} status={status} />
            ))}
          </Stack>
        </Panel>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Panel title="Ближайшие дедлайны">
          <DeadlineList
            tasks={stats.upcomingDeadlines}
            emptyText="Ближайших дедлайнов нет."
          />
        </Panel>

        <Panel title="Просроченные задачи">
          <DeadlineList
            tasks={stats.overdueTasks}
            emptyText="Просроченных задач нет."
            danger
          />
        </Panel>
      </Box>

      <Panel title="Последняя активность">
        <ActivityList items={stats.recentActivity} />
      </Panel>
    </Stack>
  );
}

function SummaryTile({ label, tone, value }: { label: string; tone: string; value: string }) {
  return (
    <Paper sx={{ p: 2.2, backgroundColor: themeTokens.panelRaised }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography color={tone} sx={{ mt: 0.7, fontSize: '1.8rem', fontWeight: 900 }}>
        {value}
      </Typography>
    </Paper>
  );
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 }, backgroundColor: themeTokens.panelRaised }}>
      <Stack spacing={2}>
        <Typography variant="h3">{title}</Typography>
        {children}
      </Stack>
    </Paper>
  );
}

function ProjectProgressRow({ project }: { project: StatsProjectProgress }) {
  return (
    <Stack spacing={0.8}>
      <Stack direction="row" spacing={1.2} sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>{project.name}</Typography>
          <Typography color="text.secondary" variant="body2">
            {project.doneTaskCount} из {project.totalTaskCount} задач
          </Typography>
        </Box>
        <Typography color={project.color} sx={{ fontWeight: 900 }}>
          {project.progress}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={project.progress}
        sx={{
          height: 8,
          borderRadius: 999,
          backgroundColor: '#31394b',
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            backgroundColor: project.color,
          },
        }}
      />
    </Stack>
  );
}

function StatusCountRow({ status }: { status: StatsStatusCount }) {
  return (
    <Stack spacing={0.7}>
      <Stack direction="row" spacing={1.2} sx={{ justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 800 }}>{status.label}</Typography>
        <Typography color="text.secondary" variant="body2">
          {status.count}
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={status.percent}
        sx={{
          height: 8,
          borderRadius: 999,
          backgroundColor: '#31394b',
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            backgroundColor: status.color,
          },
        }}
      />
    </Stack>
  );
}

function DeadlineList({
  danger = false,
  emptyText,
  tasks,
}: {
  danger?: boolean;
  emptyText: string;
  tasks: StatsDeadlineTask[];
}) {
  if (tasks.length === 0) {
    return <EmptyText>{emptyText}</EmptyText>;
  }

  return (
    <Stack spacing={1.1}>
      {tasks.slice(0, 6).map((task) => (
        <Stack
          key={task.id}
          spacing={0.4}
          sx={{
            p: 1.3,
            borderRadius: 1,
            border: `1px solid ${danger ? themeTokens.red : task.projectColor}`,
            backgroundColor: danger ? 'rgba(255, 107, 122, 0.1)' : themeTokens.panelSoft,
          }}
        >
          <Typography sx={{ fontWeight: 800, overflowWrap: 'anywhere' }}>
            {task.title}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {task.projectName} · {formatDate(task.dueDate)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function ActivityList({ items }: { items: StatsActivityItem[] }) {
  if (items.length === 0) {
    return <EmptyText>Активности пока нет.</EmptyText>;
  }

  return (
    <Stack spacing={1.2}>
      {items.map((item) => (
        <Stack
          key={item.id}
          spacing={0.3}
          sx={{
            p: 1.3,
            borderRadius: 1,
            border: `1px solid ${themeTokens.border}`,
            backgroundColor: themeTokens.panelSoft,
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.8} sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 800 }}>{item.label}</Typography>
            <Typography color="text.secondary" variant="body2">
              {formatDateTime(item.createdAt)}
            </Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2">
            {item.description}
            {item.projectName ? ` · ${item.projectName}` : ''}
          </Typography>
          <Typography color={themeTokens.purple} variant="body2" sx={{ fontWeight: 800 }}>
            {item.actorName}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <Typography color="text.secondary">{children}</Typography>;
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-');

  return `${day}.${month}.${year}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
