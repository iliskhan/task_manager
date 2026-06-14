import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { type ReactNode, useState } from 'react';
import { z } from 'zod';
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
import {
  updateCurrentWorkspaceName,
  updateOwnProfileName,
} from './settingsRepository';

const profileNameSchema = z
  .string()
  .trim()
  .min(2, 'Имя должно быть от 2 до 50 символов.')
  .max(50, 'Имя должно быть не длиннее 50 символов.');

const workspaceNameSchema = z
  .string()
  .trim()
  .min(2, 'Название должно быть от 2 до 60 символов.')
  .max(60, 'Название должно быть не длиннее 60 символов.');

export function SettingsPage() {
  const { profile, refreshWorkspace, role, user, workspace } = useAuth();
  const membersQuery = useWorkspaceMembersQuery(workspace?.id);
  const addMemberMutation = useAddWorkspaceMemberMutation();
  const [memberSuccessMessage, setMemberSuccessMessage] = useState<string | null>(null);

  const [nameSuccessMessage, setNameSuccessMessage] = useState<string | null>(null);
  const [nameFieldError, setNameFieldError] = useState<string | null>(null);
  const [nameSubmitError, setNameSubmitError] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState(
    profile?.display_name || user?.email?.split('@')[0] || '',
  );
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  const [workspaceSuccessMessage, setWorkspaceSuccessMessage] = useState<string | null>(null);
  const [workspaceFieldError, setWorkspaceFieldError] = useState<string | null>(null);
  const [workspaceSubmitError, setWorkspaceSubmitError] = useState<string | null>(null);
  const [workspaceInput, setWorkspaceInput] = useState(workspace?.name ?? '');
  const [isEditingWorkspace, setIsEditingWorkspace] = useState(false);
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);

  const displayNameValue = profile?.display_name || user?.email || '-';
  const editableNameValue = profile?.display_name || user?.email?.split('@')[0] || '';
  const workspaceNameValue = workspace?.name ?? '-';
  const canEditWorkspace = role === 'owner';

  const handleAddMember = async (email: string) => {
    if (!workspace) {
      return;
    }

    setMemberSuccessMessage(null);
    await addMemberMutation.mutateAsync({
      workspaceId: workspace.id,
      email,
    });
    setMemberSuccessMessage('Участник добавлен.');
  };

  const startNameEdit = () => {
    setNameInput(editableNameValue);
    setNameFieldError(null);
    setNameSubmitError(null);
    setNameSuccessMessage(null);
    setIsEditingName(true);
  };

  const cancelNameEdit = () => {
    setNameInput(editableNameValue);
    setNameFieldError(null);
    setNameSubmitError(null);
    setIsEditingName(false);
  };

  const saveDisplayName = async () => {
    const result = profileNameSchema.safeParse(nameInput);

    if (!result.success) {
      setNameFieldError(result.error.issues[0]?.message ?? 'Введите корректное имя.');
      return;
    }

    if (!profile?.id) {
      setNameSubmitError('Не удалось определить профиль текущего пользователя.');
      return;
    }

    setNameFieldError(null);
    setNameSubmitError(null);
    setIsSavingName(true);

    try {
      await updateOwnProfileName(profile.id, result.data);
      await refreshWorkspace();
      setNameSuccessMessage('Имя обновлено.');
      setIsEditingName(false);
    } catch (error) {
      setNameSubmitError(
        error instanceof Error
          ? error.message
          : 'Не удалось сохранить имя пользователя.',
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const startWorkspaceEdit = () => {
    setWorkspaceInput(workspace?.name ?? '');
    setWorkspaceFieldError(null);
    setWorkspaceSubmitError(null);
    setWorkspaceSuccessMessage(null);
    setIsEditingWorkspace(true);
  };

  const cancelWorkspaceEdit = () => {
    setWorkspaceInput(workspace?.name ?? '');
    setWorkspaceFieldError(null);
    setWorkspaceSubmitError(null);
    setIsEditingWorkspace(false);
  };

  const saveWorkspaceName = async () => {
    const result = workspaceNameSchema.safeParse(workspaceInput);

    if (!result.success) {
      setWorkspaceFieldError(
        result.error.issues[0]?.message ?? 'Введите корректное название.',
      );
      return;
    }

    if (!workspace?.id) {
      setWorkspaceSubmitError('Не удалось определить рабочую область.');
      return;
    }

    setWorkspaceFieldError(null);
    setWorkspaceSubmitError(null);
    setIsSavingWorkspace(true);

    try {
      await updateCurrentWorkspaceName(workspace.id, result.data);
      await refreshWorkspace();
      setWorkspaceSuccessMessage('Название рабочей области обновлено.');
      setIsEditingWorkspace(false);
    } catch (error) {
      setWorkspaceSubmitError(
        error instanceof Error
          ? error.message
          : 'Не удалось сохранить название рабочей области.',
      );
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Настройки"
        subtitle="Профиль, настройки проекта и управление командой."
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
            {isEditingName ? (
              <EditableField
                label="Имя"
                value={nameInput}
                fieldError={nameFieldError}
                submitError={nameSubmitError}
                isSaving={isSavingName}
                onChange={(value) => {
                  setNameInput(value);
                  setNameFieldError(null);
                  setNameSubmitError(null);
                }}
                onSave={saveDisplayName}
                onCancel={cancelNameEdit}
              />
            ) : (
              <ReadOnlyField
                label="Имя"
                value={displayNameValue}
                actionLabel="Изменить"
                onAction={startNameEdit}
              />
            )}
            <ReadOnlyField label="Email" value={profile?.email || user?.email || '-'} />
            {nameSuccessMessage ? <Alert severity="success">{nameSuccessMessage}</Alert> : null}
          </SettingsPanel>
          <SettingsPanel title="Параметры аккаунта">
            {isEditingWorkspace ? (
              <EditableField
                label="Название рабочей области"
                value={workspaceInput}
                fieldError={workspaceFieldError}
                submitError={workspaceSubmitError}
                isSaving={isSavingWorkspace}
                onChange={(value) => {
                  setWorkspaceInput(value);
                  setWorkspaceFieldError(null);
                  setWorkspaceSubmitError(null);
                }}
                onSave={saveWorkspaceName}
                onCancel={cancelWorkspaceEdit}
              />
            ) : (
              <ReadOnlyField
                label="Название рабочей области"
                value={workspaceNameValue}
                actionLabel={canEditWorkspace ? 'Изменить' : undefined}
                onAction={canEditWorkspace ? startWorkspaceEdit : undefined}
              />
            )}
            <ReadOnlyField label="Роль" value={role ? formatTeamRole(role) : '-'} />
            {workspaceSuccessMessage ? (
              <Alert severity="success">{workspaceSuccessMessage}</Alert>
            ) : null}
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
              {memberSuccessMessage ? <Alert severity="success">{memberSuccessMessage}</Alert> : null}
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

type EditableFieldProps = {
  label: string;
  value: string;
  fieldError: string | null;
  submitError: string | null;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
};

function EditableField({
  label,
  value,
  fieldError,
  submitError,
  isSaving,
  onChange,
  onSave,
  onCancel,
}: EditableFieldProps) {
  return (
    <Stack spacing={1.5}>
      <TextField
        label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={Boolean(fieldError)}
        helperText={fieldError || ' '}
        disabled={isSaving}
        autoComplete="off"
      />
      <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={isSaving}
          sx={{ alignSelf: 'flex-start' }}
        >
          Сохранить
        </Button>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={isSaving}
          sx={{ alignSelf: 'flex-start' }}
        >
          Отменить
        </Button>
      </Stack>
      {submitError ? <Alert severity="error">{submitError}</Alert> : null}
    </Stack>
  );
}

type ReadOnlyFieldProps = {
  label: string;
  value: string;
  actionLabel?: string;
  onAction?: () => void;
};

function ReadOnlyField({ label, value, actionLabel, onAction }: ReadOnlyFieldProps) {
  return (
    <Box
      sx={{
        p: 1.5,
        border: `1px solid ${themeTokens.border}`,
        borderRadius: 2,
        backgroundColor: themeTokens.panelSoft,
        display: 'grid',
        gridTemplateColumns: actionLabel ? { xs: '1fr', sm: 'minmax(0, 1fr) auto' } : '1fr',
        gap: 1.5,
        alignItems: 'center',
        minHeight: 76,
      }}
    >
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{value}</Typography>
      </Stack>
      {actionLabel ? (
        <Button
          size="small"
          onClick={onAction}
          sx={{
            justifySelf: { xs: 'flex-start', sm: 'end' },
            minHeight: 32,
            px: 1.5,
          }}
        >
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
}
