import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import { type ReactNode, useState } from 'react';
import { themeTokens } from '../../app/theme/theme';
import { PageHeader } from '../../shared/ui/PageHeader';
import { useAuth } from '../auth/useAuth';
import { AddMemberForm } from '../team/AddMemberForm';
import { TeamMemberList } from '../team/TeamMemberList';
import { formatTeamRole } from '../team/teamFormatters';
import {
  useAddWorkspaceMemberMutation,
  useWorkspaceMembersQuery,
} from '../team/teamQueries';

export function SettingsPage() {
  const { profile, role, user, workspace } = useAuth();
  const membersQuery = useWorkspaceMembersQuery(workspace?.id);
  const addMemberMutation = useAddWorkspaceMemberMutation();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddMember = async (email: string) => {
    if (!workspace) {
      return;
    }

    setSuccessMessage(null);
    await addMemberMutation.mutateAsync({
      workspaceId: workspace.id,
      email,
    });
    setSuccessMessage('Участник добавлен.');
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Настройки"
        subtitle="Профиль, рабочее пространство и состав команды."
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 0.9fr) minmax(0, 1.1fr)' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Stack spacing={3}>
          <SettingsPanel title="Профиль">
            <ReadOnlyField label="Имя" value={profile?.display_name || user?.email || '-'} />
            <ReadOnlyField label="Email" value={profile?.email || user?.email || '-'} />
          </SettingsPanel>
          <SettingsPanel title="Рабочее пространство">
            <ReadOnlyField label="Название" value={workspace?.name ?? '-'} />
            <ReadOnlyField label="Ваша роль" value={role ? formatTeamRole(role) : '-'} />
          </SettingsPanel>
        </Stack>
        <SettingsPanel title="Команда">
          {membersQuery.isLoading ? (
            <Typography color="text.secondary">Загрузка команды...</Typography>
          ) : null}
          {membersQuery.isError ? (
            <Alert severity="error">Не удалось загрузить команду.</Alert>
          ) : null}
          {membersQuery.data ? <TeamMemberList members={membersQuery.data} /> : null}
          {role === 'owner' ? (
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <Typography variant="h3">Добавить участника</Typography>
              {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}
              <AddMemberForm
                isSubmitting={addMemberMutation.isPending}
                error={(addMemberMutation.error as Error | null) ?? null}
                onSubmit={handleAddMember}
              />
            </Stack>
          ) : (
            <Alert severity="info">Добавление участников доступно владельцу.</Alert>
          )}
        </SettingsPanel>
      </Box>
    </Stack>
  );
}

type SettingsPanelProps = {
  title: string;
  children: ReactNode;
};

function SettingsPanel({ children, title }: SettingsPanelProps) {
  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        backgroundColor: themeTokens.panelRaised,
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h3">{title}</Typography>
        {children}
      </Stack>
    </Paper>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      spacing={0.5}
      sx={{
        p: 1.5,
        border: `1px solid ${themeTokens.border}`,
        borderRadius: 2,
        backgroundColor: themeTokens.panelSoft,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Stack>
  );
}
