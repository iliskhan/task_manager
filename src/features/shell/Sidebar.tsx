import ArchiveOutlined from '@mui/icons-material/ArchiveOutlined';
import BarChartOutlined from '@mui/icons-material/BarChartOutlined';
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined';
import CheckBoxOutlined from '@mui/icons-material/CheckBoxOutlined';
import FlagOutlined from '@mui/icons-material/FlagOutlined';
import LabelOutlined from '@mui/icons-material/LabelOutlined';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import TaskAltOutlined from '@mui/icons-material/TaskAltOutlined';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import { themeTokens } from '../../app/theme/theme';
import { useAuth } from '../auth/useAuth';

type SidebarProps = {
  width: number;
};

const primaryNavigation = [
  { label: 'Мои задачи', href: '/app/projects', icon: CheckBoxOutlined },
  { label: 'Календарь', href: '/app/calendar', icon: CalendarMonthOutlined },
  { label: 'Статистика', href: '/app/stats', icon: BarChartOutlined },
  { label: 'Настройки', href: '/app/settings', icon: SettingsOutlined },
];

const secondaryNavigation = [
  { label: 'Приоритеты', icon: FlagOutlined },
  { label: 'Метки', icon: LabelOutlined },
  { label: 'Архив', icon: ArchiveOutlined },
];

export function Sidebar({ width }: SidebarProps) {
  const { profile, signOut, user } = useAuth();
  const profileEmail = profile?.email ?? user?.email ?? '';
  const profileName =
    profile?.display_name?.trim() || profileEmail.split('@')[0] || 'Пользователь';
  const avatarInitial = profileName.trim().charAt(0).toUpperCase() || 'П';

  return (
    <Box
      component="nav"
      aria-label="Основная навигация"
      sx={{
        position: { xs: 'static', md: 'fixed' },
        inset: { md: '0 auto 0 0' },
        width: { xs: '100%', md: width },
        height: { xs: 'auto', md: '100vh' },
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: themeTokens.sidebar,
        borderRight: `1px solid ${themeTokens.border}`,
        zIndex: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          height: { xs: 76, md: 116 },
          px: { xs: 2, md: 4 },
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 1.2,
            display: 'grid',
            placeItems: 'center',
            color: '#a985ff',
            border: '2px solid currentColor',
            boxShadow: '0 0 0 4px rgba(124, 58, 237, 0.12)',
          }}
        >
          <TaskAltOutlined fontSize="small" />
        </Box>
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: '1.1rem', md: '1.45rem' },
            whiteSpace: 'nowrap',
          }}
        >
          Task Manager
        </Typography>
      </Box>

      <Divider />

      <List
        sx={{
          px: { xs: 1.5, md: 3 },
          py: { xs: 1, md: 2 },
          display: { xs: 'grid', sm: 'flex' },
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 0.7,
          flexDirection: 'column',
        }}
      >
        {primaryNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <ListItemButton
              key={item.href}
              component={NavLink}
              to={item.href}
              selected={false}
              sx={{
                '&.active': {
                  color: themeTokens.textPrimary,
                  background:
                    'linear-gradient(135deg, rgba(124, 58, 237, 0.68), rgba(76, 29, 149, 0.72))',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 42, color: 'inherit' }}>
                <Icon />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    noWrap: true,
                    sx: {
                      fontSize: '1rem',
                      fontWeight: 600,
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}

        {secondaryNavigation.map((item) => {
          const Icon = item.icon;

          return (
            <ListItemButton
              key={item.label}
              disabled
              sx={{
                opacity: 0.78,
                display: { xs: 'none', md: 'flex' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 42, color: 'inherit' }}>
                <Icon />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                slotProps={{
                  primary: {
                    noWrap: true,
                    sx: {
                      fontSize: '1rem',
                      fontWeight: 600,
                    },
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          gap: 1.4,
          mx: 2,
          mb: 2,
          p: 1.4,
          borderRadius: 2,
          border: `1px solid ${themeTokens.border}`,
          backgroundColor: themeTokens.panelSoft,
          minWidth: 0,
        }}
      >
        <Avatar
          sx={{
            width: 38,
            height: 38,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6d35d1, #8b5cf6)',
          }}
        >
          {avatarInitial}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontWeight: 700 }}>
            {profileName}
          </Typography>
          <Typography color="text.secondary" variant="body2" noWrap>
            {profileEmail}
          </Typography>
        </Box>
        <IconButton
          aria-label="Выйти из мобильного профиля"
          color="inherit"
          onClick={() => void signOut()}
        >
          <LogoutOutlined fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }} />

      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          gap: 1.5,
          px: 3.5,
          py: 3,
          borderTop: `1px solid ${themeTokens.border}`,
        }}
      >
        <Avatar
          sx={{
            width: 54,
            height: 54,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6d35d1, #8b5cf6)',
          }}
        >
          {avatarInitial}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap sx={{ fontWeight: 700 }}>
            {profileName}
          </Typography>
          <Typography color="text.secondary" variant="body2" noWrap>
            {profileEmail}
          </Typography>
        </Box>
        <IconButton aria-label="Выйти" color="inherit" onClick={() => void signOut()}>
          <LogoutOutlined fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
