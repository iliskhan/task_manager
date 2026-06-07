import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { themeTokens } from '../../app/theme/theme';
import { PageHeader } from '../../shared/ui/PageHeader';

const stats = [
  { label: 'Бизнес', value: 75, color: themeTokens.blue },
  { label: 'Работа', value: 60, color: themeTokens.green },
  { label: 'Учеба', value: 40, color: '#a855f7' },
  { label: 'Личная жизнь', value: 30, color: themeTokens.orange },
];

export function StatsPage() {
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Статистика"
        subtitle="Статические показатели подготовлены как место для будущих данных."
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        {stats.map((item) => (
          <Paper
            key={item.label}
            sx={{ p: 2.4, backgroundColor: themeTokens.panelRaised }}
          >
            <Typography sx={{ fontWeight: 800 }}>{item.label}</Typography>
            <Typography
              color={item.color}
              sx={{ fontSize: '1.8rem', fontWeight: 800 }}
            >
              {item.value}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={item.value}
              sx={{
                height: 10,
                borderRadius: 999,
                backgroundColor: '#31394b',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                  backgroundColor: item.color,
                },
              }}
            />
          </Paper>
        ))}
      </Box>
    </Stack>
  );
}
