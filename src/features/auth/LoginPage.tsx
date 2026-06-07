import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { type FormEvent, useMemo, useState } from 'react';
import { z } from 'zod';
import { themeTokens } from '../../app/theme/theme';
import { useAuth } from './useAuth';

type LoginMode = 'sign-in' | 'sign-up';

type FieldErrors = {
  email?: string;
  password?: string;
};

const signInSchema = z.object({
  email: z.email('Введите корректный email').transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1, 'Введите пароль'),
});

const signUpSchema = z.object({
  email: z.email('Введите корректный email').transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, 'Пароль должен быть не короче 8 символов'),
});

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<LoginMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = useMemo(
    () =>
      mode === 'sign-in'
        ? {
            title: 'Вход',
            subtitle: 'Войдите в рабочее пространство команды.',
            submit: 'Войти',
            pending: 'Входим...',
            switchLead: 'Нет аккаунта?',
            switchAction: 'Зарегистрироваться',
          }
        : {
            title: 'Регистрация',
            subtitle: 'Создайте аккаунт для командного рабочего пространства.',
            submit: 'Создать аккаунт',
            pending: 'Создаем...',
            switchLead: 'Уже есть аккаунт?',
            switchAction: 'Войти',
          },
    [mode],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);

    const schema = mode === 'sign-in' ? signInSchema : signUpSchema;
    const parsed = schema.safeParse({ email, password });

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'sign-in') {
        await signIn(parsed.data);
      } else {
        await signUp(parsed.data);
        setSuccessMessage('Аккаунт создан. Если требуется подтверждение, проверьте почту.');
      }
    } catch {
      setFormError(
        mode === 'sign-in'
          ? 'Не удалось войти. Проверьте email и пароль.'
          : 'Не удалось создать аккаунт. Попробуйте позже.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleMode() {
    setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
    setFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);
  }

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
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{
          width: 'min(100%, 420px)',
          p: { xs: 3, sm: 4 },
          borderRadius: 2,
          backgroundColor: themeTokens.panel,
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h2">{copy.title}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.8 }}>
              {copy.subtitle}
            </Typography>
          </Box>

          {formError ? <Alert severity="error">{formError}</Alert> : null}
          {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

          <TextField
            autoComplete="email"
            disabled={isSubmitting}
            error={Boolean(fieldErrors.email)}
            fullWidth
            helperText={fieldErrors.email}
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="alexey@mail.ru"
            type="email"
            value={email}
          />
          <TextField
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            disabled={isSubmitting}
            error={Boolean(fieldErrors.password)}
            fullWidth
            helperText={
              fieldErrors.password ?? (mode === 'sign-up' ? 'Минимум 8 символов' : undefined)
            }
            label="Пароль"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Введите пароль"
            type="password"
            value={password}
          />
          <Button disabled={isSubmitting} type="submit" variant="contained" size="large">
            {isSubmitting ? copy.pending : copy.submit}
          </Button>
          <Typography color="text.secondary" variant="body2">
            {copy.switchLead}{' '}
            <Button
              disabled={isSubmitting}
              onClick={toggleMode}
              size="small"
              sx={{ minWidth: 0, p: 0, verticalAlign: 'baseline' }}
              type="button"
              variant="text"
            >
              {copy.switchAction}
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
