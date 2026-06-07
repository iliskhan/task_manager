import { Box, Paper, Stack, Typography } from '@mui/material';
import { PageHeader } from '../../shared/ui/PageHeader';
import { themeTokens } from '../../app/theme/theme';

const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const days = Array.from({ length: 35 }, (_, index) => index + 1);

export function CalendarPage() {
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Календарь"
        subtitle="Месячный обзор сроков появится после подключения задач."
      />
      <Paper sx={{ p: { xs: 1.5, md: 2.5 }, backgroundColor: themeTokens.panel }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 1,
          }}
        >
          {weekdays.map((day) => (
            <Typography
              key={day}
              color="text.secondary"
              align="center"
              variant="body2"
              sx={{ fontWeight: 700 }}
            >
              {day}
            </Typography>
          ))}
          {days.map((day) => (
            <Box
              key={day}
              sx={{
                minHeight: { xs: 58, md: 92 },
                p: 1,
                borderRadius: 1,
                border: `1px solid ${themeTokens.border}`,
                backgroundColor:
                  day === 15 ? 'rgba(124, 58, 237, 0.18)' : themeTokens.panelSoft,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {day <= 30 ? day : ''}
              </Typography>
              {day === 15 ? (
                <Typography color={themeTokens.red} variant="body2" sx={{ mt: 1 }}>
                  Бизнес
                </Typography>
              ) : null}
            </Box>
          ))}
        </Box>
      </Paper>
    </Stack>
  );
}
