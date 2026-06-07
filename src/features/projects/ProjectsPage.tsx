import AccessTimeOutlined from '@mui/icons-material/AccessTimeOutlined';
import Add from '@mui/icons-material/Add';
import BusinessCenterOutlined from '@mui/icons-material/BusinessCenterOutlined';
import FavoriteRounded from '@mui/icons-material/FavoriteRounded';
import FilterListOutlined from '@mui/icons-material/FilterListOutlined';
import LaptopMacOutlined from '@mui/icons-material/LaptopMacOutlined';
import MoreVert from '@mui/icons-material/MoreVert';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import Search from '@mui/icons-material/Search';
import SortOutlined from '@mui/icons-material/SortOutlined';
import TodayOutlined from '@mui/icons-material/TodayOutlined';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { themeTokens } from '../../app/theme/theme';
import { PageHeader } from '../../shared/ui/PageHeader';

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  progress: number;
  deadline: string;
  dueText: string;
  lastVisit: string;
  color: string;
  statusColor: string;
  icon: typeof BusinessCenterOutlined;
};

const projects: ProjectRow[] = [
  {
    id: 'demo',
    name: 'Бизнес',
    description: 'Развитие и рост проекта',
    progress: 75,
    deadline: '15.06.2024',
    dueText: 'Осталось 5 дней',
    lastVisit: 'Сегодня, 14:30',
    color: themeTokens.blue,
    statusColor: themeTokens.red,
    icon: BusinessCenterOutlined,
  },
  {
    id: 'work',
    name: 'Работа',
    description: 'Рабочие задачи и проекты',
    progress: 60,
    deadline: '20.06.2024',
    dueText: 'Осталось 10 дней',
    lastVisit: 'Вчера, 18:45',
    color: themeTokens.green,
    statusColor: themeTokens.yellow,
    icon: LaptopMacOutlined,
  },
  {
    id: 'study',
    name: 'Учеба',
    description: 'Учебные задания и экзамены',
    progress: 40,
    deadline: '30.06.2024',
    dueText: 'Осталось 20 дней',
    lastVisit: '2 дня назад, 16:20',
    color: '#a855f7',
    statusColor: themeTokens.yellow,
    icon: SchoolOutlined,
  },
  {
    id: 'life',
    name: 'Личная жизнь',
    description: 'Личные цели и отношения',
    progress: 30,
    deadline: '10.07.2024',
    dueText: 'Осталось 30 дней',
    lastVisit: '3 дня назад, 20:15',
    color: themeTokens.orange,
    statusColor: themeTokens.green,
    icon: FavoriteRounded,
  },
];

export function ProjectsPage() {
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Мои задачи"
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
          >
            Новая задача
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'minmax(280px, 330px) 1fr auto auto',
          },
          gap: 2,
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Поиск задач..."
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box />
        <Select
          value="all"
          startAdornment={<FilterListOutlined sx={{ mr: 1.2 }} />}
          sx={{ minWidth: { xs: '100%', md: 232 } }}
        >
          <MenuItem value="all">Все категории</MenuItem>
        </Select>
        <Select
          value="deadline"
          startAdornment={<SortOutlined sx={{ mr: 1.2 }} />}
          sx={{ minWidth: { xs: '100%', md: 206 } }}
        >
          <MenuItem value="deadline">Сортировка</MenuItem>
        </Select>
      </Box>

      <Paper
        sx={{
          p: { xs: 1.5, md: 2 },
          backgroundColor: 'rgba(22, 29, 42, 0.74)',
          borderColor: 'rgba(41, 49, 66, 0.72)',
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', lg: 'grid' },
            gridTemplateColumns: 'minmax(300px, 1.35fr) 0.55fr 0.72fr 0.88fr 48px',
            px: 2.5,
            py: 1.3,
            color: 'text.secondary',
            fontWeight: 600,
          }}
        >
          <Typography>Задача</Typography>
          <Typography>Прогресс</Typography>
          <Typography>Дедлайн</Typography>
          <Typography>Последнее посещение</Typography>
          <Box />
        </Box>

        <Stack spacing={1.4}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}

function ProjectCard({ project }: { project: ProjectRow }) {
  const Icon = project.icon;

  return (
    <Paper
      component={RouterLink}
      to={`/app/projects/${project.id}`}
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          lg: 'minmax(300px, 1.35fr) 0.55fr 0.72fr 0.88fr 48px',
        },
        gap: { xs: 2, lg: 3 },
        alignItems: 'center',
        p: { xs: 2, sm: 2.3 },
        minHeight: 112,
        color: 'inherit',
        textDecoration: 'none',
        backgroundColor: themeTokens.panelRaised,
        borderColor: 'rgba(41, 49, 66, 0.72)',
        transition: 'border-color 160ms ease, transform 160ms ease',
        '&:hover': {
          borderColor: 'rgba(124, 58, 237, 0.55)',
          transform: 'translateY(-1px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 62,
            height: 62,
            borderRadius: 3,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#ffffff',
            background: `linear-gradient(135deg, ${project.color}, ${project.color}aa)`,
            boxShadow: `0 14px 28px ${project.color}33`,
          }}
        >
          <Icon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: '1.08rem', fontWeight: 800 }}>
            {project.name}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }} noWrap>
            {project.description}
          </Typography>
        </Box>
      </Box>

      <Stack spacing={0.7} sx={{ minWidth: 150 }}>
        <Typography color={project.color} sx={{ fontSize: '1.08rem', fontWeight: 800 }}>
          {project.progress}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={project.progress}
          sx={{
            height: 10,
            borderRadius: 999,
            backgroundColor: '#31394b',
            '& .MuiLinearProgress-bar': {
              borderRadius: 999,
              backgroundColor: project.color,
            },
          }}
        />
      </Stack>

      <Stack spacing={0.4}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TodayOutlined fontSize="small" color="disabled" />
          <Typography>{project.deadline}</Typography>
        </Box>
        <Typography color={project.statusColor} variant="body2">
          {project.dueText}
        </Typography>
      </Stack>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTimeOutlined color="disabled" />
        <Typography color="text.secondary">{project.lastVisit}</Typography>
      </Box>

      <IconButton
        aria-label={`Действия проекта ${project.name}`}
        sx={{
          justifySelf: { xs: 'start', lg: 'end' },
          mt: { xs: -1, lg: 0 },
        }}
      >
        <MoreVert />
      </IconButton>
    </Paper>
  );
}
