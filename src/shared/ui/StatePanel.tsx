import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { themeTokens } from '../../app/theme/theme';

type StatePanelProps = {
  state: 'loading' | 'empty' | 'error';
  message: string;
  detail?: string;
};

export function StatePanel({ detail, message, state }: StatePanelProps) {
  if (state === 'error') {
    return (
      <Alert severity="error" sx={{ borderRadius: 1.5 }}>
        {message}
      </Alert>
    );
  }

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        py: { xs: 5, md: 7 },
        px: 2,
        textAlign: 'center',
        backgroundColor: themeTokens.panelSoft,
        border: `1px solid ${themeTokens.border}`,
        borderRadius: 1.5,
        borderColor: themeTokens.border,
      }}
    >
      <Stack spacing={1.2} sx={{ alignItems: 'center' }}>
        {state === 'loading' ? <CircularProgress size={28} /> : null}
        <Typography sx={{ fontWeight: 800 }}>{message}</Typography>
        {detail ? (
          <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
            {detail}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
