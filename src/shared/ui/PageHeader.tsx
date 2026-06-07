import { Box, type SxProps, type Theme, Typography } from '@mui/material';
import { type ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  sx?: SxProps<Theme>;
};

export function PageHeader({ title, subtitle, action, sx }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        ...sx,
      }}
    >
      <Box>
        <Typography component="h1" variant="h1">
          {title}
        </Typography>
        {subtitle ? (
          <Typography color="text.secondary" sx={{ mt: 0.8 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {action}
    </Box>
  );
}
