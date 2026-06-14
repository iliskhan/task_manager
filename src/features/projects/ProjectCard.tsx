import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import BusinessCenterOutlined from '@mui/icons-material/BusinessCenterOutlined';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import LaptopMacOutlined from '@mui/icons-material/LaptopMacOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import TodayOutlined from '@mui/icons-material/TodayOutlined';
import {
  Box,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { ComponentType } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { themeTokens } from '../../app/theme/theme';
import { ProjectActionsMenu } from './ProjectActionsMenu';
import type { ProjectDeadlineTone, ProjectIconName, ProjectListItem } from './projectTypes';

type ProjectCardProps = {
  project: ProjectListItem;
  isOwner: boolean;
  onEdit: (project: ProjectListItem) => void;
  onArchive: (project: ProjectListItem) => void;
  onRestore: (project: ProjectListItem) => void;
  isArchivePending?: boolean;
  isRestorePending?: boolean;
};

const iconByName: Record<ProjectIconName, ComponentType<SvgIconProps>> = {
  briefcase: BusinessCenterOutlined,
  laptop: LaptopMacOutlined,
  school: SchoolOutlined,
  heart: FavoriteRounded,
};

const deadlineColorByTone: Record<ProjectDeadlineTone, string> = {
  muted: themeTokens.textMuted,
  success: themeTokens.green,
  warning: themeTokens.yellow,
  danger: themeTokens.red,
};

export function ProjectCard({
  project,
  isOwner,
  onEdit,
  onArchive,
  onRestore,
  isArchivePending,
  isRestorePending,
}: ProjectCardProps) {
  const Icon = iconByName[project.displayIconName];

  return (
    <Paper
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          lg: 'minmax(0, 1fr) 48px',
        },
        gap: { xs: 2, lg: 1.5 },
        alignItems: 'center',
        p: { xs: 2, sm: 2.3 },
        minHeight: 112,
        backgroundColor: themeTokens.panelRaised,
        borderColor: 'rgba(41, 49, 66, 0.72)',
        transition: 'border-color 160ms ease, transform 160ms ease',
        '&:hover': {
          borderColor: 'rgba(124, 58, 237, 0.55)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box
        component={RouterLink}
        to={`/app/projects/${project.id}`}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(300px, 1.35fr) 0.55fr 0.72fr 0.88fr',
          },
          gap: { xs: 2, lg: 3 },
          alignItems: 'center',
          color: 'inherit',
          textDecoration: 'none',
          minWidth: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Box
            sx={{
              width: 62,
              height: 62,
              borderRadius: 3,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              color: '#ffffff',
              background: `linear-gradient(135deg, ${project.displayColor}, ${project.displayColor}aa)`,
              boxShadow: `0 14px 28px ${project.displayColor}33`,
            }}
          >
            <Icon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography noWrap sx={{ fontSize: '1.08rem', fontWeight: 800 }}>
              {project.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }} noWrap>
              {project.description || 'Без описания'}
            </Typography>
          </Box>
        </Box>

        <Stack spacing={0.7} sx={{ minWidth: 150 }}>
          <Typography color={project.displayColor} sx={{ fontSize: '1.08rem', fontWeight: 800 }}>
            {project.progress}%
          </Typography>
          <LinearProgress
            aria-label={`Прогресс проекта ${project.name}`}
            variant="determinate"
            value={project.progress}
            sx={{
              height: 10,
              borderRadius: 999,
              backgroundColor: '#31394b',
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                backgroundColor: project.displayColor,
              },
            }}
          />
        </Stack>

        <Stack spacing={0.4}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TodayOutlined fontSize="small" color="disabled" />
            <Typography>{project.deadlineStatus.dateText}</Typography>
          </Box>
          <Typography
            color={deadlineColorByTone[project.deadlineStatus.tone]}
            variant="body2"
          >
            {project.deadlineStatus.statusText}
          </Typography>
        </Stack>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeOutlined color="disabled" />
          <Typography color="text.secondary">{project.lastVisitText}</Typography>
        </Box>
      </Box>

      <ProjectActionsMenu
        project={project}
        isOwner={isOwner}
        onEdit={onEdit}
        onArchive={onArchive}
        onRestore={onRestore}
        isArchivePending={isArchivePending}
        isRestorePending={isRestorePending}
      />
    </Paper>
  );
}
