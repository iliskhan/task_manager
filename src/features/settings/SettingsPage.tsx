import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { themeTokens } from '../../app/theme/theme';
import { PageHeader } from '../../shared/ui/PageHeader';

export function SettingsPage() {
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Настройки"
        subtitle="Базовый экран профиля, рабочего пространства и команды."
      />
      <Paper
        sx={{
          p: { xs: 2, sm: 3 },
          maxWidth: 720,
          backgroundColor: themeTokens.panelRaised,
        }}
      >
        <Stack spacing={2}>
          <Typography variant="h3">Профиль</Typography>
          <TextField label="Имя" value="Алексей" />
          <TextField label="Email" value="alexey@mail.ru" />
          <Typography variant="h3" sx={{ pt: 1 }}>
            Рабочее пространство
          </Typography>
          <TextField label="Название" value="Task Manager" />
          <Button variant="contained" sx={{ alignSelf: 'flex-start' }}>
            Сохранить
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
