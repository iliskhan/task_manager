import ArrowBack from '@mui/icons-material/ArrowBack';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import MoreVert from '@mui/icons-material/MoreVert';
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useEffect, useRef } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { themeTokens } from '../../app/theme/theme';
import { useAuth } from '../auth/useAuth';
import { KanbanBoard } from '../board/KanbanBoard';
import { useProjectDetailQuery, useRecordProjectVisitMutation } from './projectQueries';
import type { ProjectDeadlineTone } from './projectTypes';

const deadlineColorByTone: Record<ProjectDeadlineTone, string> = {
  muted: themeTokens.textMuted,
  success: themeTokens.green,
  warning: themeTokens.yellow,
  danger: themeTokens.red,
};

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const { user, workspace } = useAuth();
  const projectQuery = useProjectDetailQuery(workspace?.id, projectId);
  const recordVisitMutation = useRecordProjectVisitMutation();
  const recordedProjectIdRef = useRef<string | null>(null);
  const project = projectQuery.data ?? null;
  const initialTaskId = searchParams.get('taskId') ?? undefined;

  useEffect(() => {
    if (!project?.id || !workspace?.id || !user?.id) {
      return;
    }

    if (recordedProjectIdRef.current === project.id) {
      return;
    }

    recordedProjectIdRef.current = project.id;
    recordVisitMutation.mutate({
      workspaceId: workspace.id,
      userId: user.id,
      projectId: project.id,
    });
  }, [project?.id, recordVisitMutation, user?.id, workspace?.id]);

  if (projectQuery.isLoading) {
    return (
      <Stack spacing={1.5} sx={{ minHeight: 360, alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={30} />
        <Typography color="text.secondary">Загружаем проект...</Typography>
      </Stack>
    );
  }

  if (projectQuery.isError) {
    return (
      <Stack spacing={3}>
        <BackButton />
        <Alert severity="error">Не удалось загрузить проект.</Alert>
      </Stack>
    );
  }

  if (!project) {
    return (
      <Stack spacing={3}>
        <BackButton />
        <Box>
          <Typography component="h1" variant="h1">
            Проект не найден
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.7 }}>
            Он мог быть архивирован или недоступен для текущего рабочего пространства.
          </Typography>
        </Box>
      </Stack>
    );
  }

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
        <BackButton />

        <Box>
          <Typography component="h1" variant="h1">
            {project.name}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.7 }}>
            {project.description || 'Без описания'}
          </Typography>
        </Box>

        <InfoCard label="Прогресс">
          <Typography
            color={project.displayColor}
            sx={{ fontSize: '1.05rem', fontWeight: 800 }}
          >
            {project.progress}%
          </Typography>
          <LinearProgress
            aria-label={`Прогресс проекта ${project.name}`}
            variant="determinate"
            value={project.progress}
            sx={{
              mt: 0.7,
              width: 210,
              height: 9,
              borderRadius: 999,
              backgroundColor: '#31394b',
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                backgroundColor: project.displayColor,
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
            <Typography sx={{ mt: 0.3 }}>{project.deadlineStatus.dateText}</Typography>
            <Typography
              color={deadlineColorByTone[project.deadlineStatus.tone]}
              variant="body2"
              sx={{ mt: 0.3 }}
            >
              {project.deadlineStatus.statusText}
            </Typography>
          </Box>
          <IconButton sx={{ ml: 'auto' }} aria-label={`Действия проекта ${project.name}`}>
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

      {workspace?.id && user?.id ? (
        <KanbanBoard
          workspaceId={workspace.id}
          projectId={project.id}
          currentUserId={user.id}
          projectName={project.name}
          projectColor={project.displayColor}
          initialTaskId={initialTaskId}
        />
      ) : (
        <Alert severity="error">Не удалось определить текущую рабочую область.</Alert>
      )}
    </Stack>
  );
}

function BackButton() {
  return (
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
