import { type ReactNode } from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { themeTokens } from '../../app/theme/theme';
import { useAuth } from './useAuth';

type RouteGuardProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: RouteGuardProps) {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return <AuthRouteState message="Загрузка рабочего пространства" />;
  }

  if (auth.status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (auth.status === 'error') {
    return (
      <AuthRouteState
        message="Не удалось загрузить рабочее пространство"
        variant="error"
      />
    );
  }

  return children;
}

export function GuestRoute({ children }: RouteGuardProps) {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return <AuthRouteState message="Проверяем сессию" />;
  }

  if (auth.status === 'authenticated') {
    return <Navigate to="/app/projects" replace />;
  }

  return children;
}

function AuthRouteState({
  message,
  variant = 'loading',
}: {
  message: string;
  variant?: 'loading' | 'error';
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        backgroundColor: themeTokens.appBackground,
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        {variant === 'loading' ? (
          <>
            <CircularProgress size={28} />
            <Typography color="text.secondary">{message}</Typography>
          </>
        ) : (
          <Alert severity="error">{message}</Alert>
        )}
      </Stack>
    </Box>
  );
}
