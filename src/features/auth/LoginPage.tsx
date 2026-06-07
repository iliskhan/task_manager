import {
  Box,
  Button,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { themeTokens } from '../../app/theme/theme';

export function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background:
          'radial-gradient(circle at 50% 18%, rgba(124,58,237,0.18), transparent 28%), #0b0f17',
      }}
    >
      <Paper
        sx={{
          width: 'min(100%, 420px)',
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
          backgroundColor: themeTokens.panel,
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h2">Вход</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.8 }}>
              Войдите в рабочее пространство команды.
            </Typography>
          </Box>
          <TextField label="Email" placeholder="alexey@mail.ru" fullWidth />
          <TextField
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            fullWidth
          />
          <Button variant="contained" size="large">
            Войти
          </Button>
          <Typography color="text.secondary" variant="body2">
            Нет аккаунта?{' '}
            <Link href="#" underline="hover">
              Зарегистрироваться
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
