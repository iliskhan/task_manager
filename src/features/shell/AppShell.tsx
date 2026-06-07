import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { themeTokens } from '../../app/theme/theme';
import { Sidebar } from './Sidebar';

const SIDEBAR_WIDTH = 296;

export function AppShell() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        background:
          'radial-gradient(circle at 82% 12%, rgba(124,58,237,0.08), transparent 26%), #0b0f17',
        color: 'text.primary',
      }}
    >
      <Sidebar width={SIDEBAR_WIDTH} />
      <Box
        component="main"
        sx={{
          width: { xs: '100%', md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          minWidth: 0,
          minHeight: '100vh',
          px: { xs: 2, sm: 3, lg: 5 },
          py: { xs: 2, sm: 3, lg: 4 },
          borderLeft: { md: `1px solid ${themeTokens.border}` },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
