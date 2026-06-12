import Add from '@mui/icons-material/Add';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { themeTokens } from '../../app/theme/theme';
import { PageHeader } from '../../shared/ui/PageHeader';
import { StatePanel } from '../../shared/ui/StatePanel';
import { useAuth } from '../auth/useAuth';
import { ProjectCard } from './ProjectCard';
import { ProjectFormDialog, type ProjectFormValues } from './ProjectFormDialog';
import { ProjectListControls } from './ProjectListControls';
import { filterAndSortProjects } from './projectFilters';
import {
  useArchiveProjectMutation,
  useCreateProjectMutation,
  useProjectListQuery,
  useUpdateProjectMutation,
} from './projectQueries';
import type { ProjectListItem, ProjectSortKey, ProjectStatusFilter } from './projectTypes';

export function ProjectsPage() {
  const { user, workspace, role } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('active');
  const [sortKey, setSortKey] = useState<ProjectSortKey>('deadline');
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectListItem | null>(null);
  const projectListQuery = useProjectListQuery(workspace?.id, user?.id);
  const createProjectMutation = useCreateProjectMutation();
  const updateProjectMutation = useUpdateProjectMutation();
  const archiveProjectMutation = useArchiveProjectMutation();
  const projects = projectListQuery.data ?? [];
  const visibleProjects = useMemo(
    () =>
      filterAndSortProjects(projects, {
        search,
        statusFilter,
        sortKey,
      }),
    [projects, search, sortKey, statusFilter],
  );

  const closeDialog = () => {
    setDialogMode(null);
    setEditingProject(null);
  };

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditingProject(null);
  };

  const openEditDialog = (project: ProjectListItem) => {
    setDialogMode('edit');
    setEditingProject(project);
  };

  const handleFormSubmit = async (values: ProjectFormValues) => {
    if (!workspace?.id || !user?.id) {
      return;
    }

    if (dialogMode === 'edit' && editingProject) {
      await updateProjectMutation.mutateAsync({
        ...values,
        workspaceId: workspace.id,
        userId: user.id,
        projectId: editingProject.id,
      });
    } else {
      await createProjectMutation.mutateAsync({
        ...values,
        workspaceId: workspace.id,
        userId: user.id,
      });
    }

    closeDialog();
  };

  const handleArchive = async (project: ProjectListItem) => {
    if (!workspace?.id || !user?.id) {
      return;
    }

    await archiveProjectMutation.mutateAsync({
      workspaceId: workspace.id,
      userId: user.id,
      projectId: project.id,
    });
  };

  const mutationError =
    createProjectMutation.error ?? updateProjectMutation.error ?? archiveProjectMutation.error;
  const isDialogSubmitting =
    createProjectMutation.isPending || updateProjectMutation.isPending;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Мои задачи"
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDialog}
            sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
          >
            Новый проект
          </Button>
        }
      />

      <ProjectListControls
        search={search}
        statusFilter={statusFilter}
        sortKey={sortKey}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onSortKeyChange={setSortKey}
      />

      {mutationError ? <Alert severity="error">{mutationError.message}</Alert> : null}

      <Paper
        sx={{
          p: { xs: 1.5, md: 2 },
          backgroundColor: 'rgba(22, 29, 42, 0.74)',
          borderColor: 'rgba(41, 49, 66, 0.72)',
        }}
      >
        <Box
          sx={{
            display: { xs: 'none', lg: 'grid' },
            gridTemplateColumns: 'minmax(300px, 1.35fr) 0.55fr 0.72fr 0.88fr 48px',
            px: 2.5,
            py: 1.3,
            color: 'text.secondary',
            fontWeight: 600,
          }}
        >
          <Typography>Проект</Typography>
          <Typography>Прогресс</Typography>
          <Typography>Дедлайн</Typography>
          <Typography>Последнее посещение</Typography>
          <Box />
        </Box>

        {projectListQuery.isLoading ? (
          <StatePanel state="loading" message="Загружаем проекты..." />
        ) : null}

        {projectListQuery.isError ? (
          <StatePanel state="error" message="Не удалось загрузить проекты." />
        ) : null}

        {!projectListQuery.isLoading && !projectListQuery.isError && visibleProjects.length === 0 ? (
          <StatePanel
            state="empty"
            message="Проекты не найдены"
            detail="Измените фильтры или создайте новый проект."
          />
        ) : null}

        <Stack spacing={1.4}>
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isOwner={role === 'owner'}
              onEdit={openEditDialog}
              onArchive={handleArchive}
              isArchivePending={archiveProjectMutation.isPending}
            />
          ))}
        </Stack>
      </Paper>

      <ProjectFormDialog
        open={Boolean(dialogMode)}
        mode={dialogMode ?? 'create'}
        project={editingProject}
        isSubmitting={isDialogSubmitting}
        error={mutationError}
        onClose={closeDialog}
        onSubmit={handleFormSubmit}
      />
    </Stack>
  );
}
