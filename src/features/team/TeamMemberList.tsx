import { Avatar, Chip, Divider, Stack, Typography } from '@mui/material';
import { themeTokens } from '../../app/theme/theme';
import {
  formatMemberJoinedAt,
  formatMemberName,
  formatTeamRole,
} from './teamFormatters';
import type { TeamMember } from './teamTypes';

type TeamMemberListProps = {
  members: TeamMember[];
};

export function TeamMemberList({ members }: TeamMemberListProps) {
  if (members.length === 0) {
    return (
      <Typography color="text.secondary">В команде пока нет участников.</Typography>
    );
  }

  return (
    <Stack
      divider={<Divider flexItem />}
      sx={{
        border: `1px solid ${themeTokens.border}`,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {members.map((member) => (
        <Stack
          key={member.userId}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            p: 1.5,
            backgroundColor: themeTokens.panelSoft,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Avatar
              src={member.avatarUrl ?? undefined}
              sx={{
                width: 38,
                height: 38,
                bgcolor: member.role === 'owner' ? themeTokens.purple : themeTokens.blue,
                fontSize: '0.95rem',
                fontWeight: 800,
              }}
            >
              {formatMemberName(member).slice(0, 1).toUpperCase()}
            </Avatar>
            <Stack sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }}>{formatMemberName(member)}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {member.email}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip label={formatTeamRole(member.role)} size="small" color="primary" />
            <Typography variant="body2" color="text.secondary">
              с {formatMemberJoinedAt(member.createdAt)}
            </Typography>
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
