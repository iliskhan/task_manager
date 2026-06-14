import type { Tables } from '../../lib/supabase/database.types';

export type ProjectRow = Tables<'projects'>;
export type ProjectTaskRow = Tables<'tasks'>;
export type ProjectVisitRow = Tables<'project_visits'>;

export type ProjectStatusFilter = 'active' | 'archived' | 'all';
export type ProjectSortKey = 'deadline' | 'progress' | 'lastVisit' | 'createdAt';
export type ProjectIconName = 'briefcase' | 'laptop' | 'school' | 'heart';
export type ProjectDeadlineTone = 'muted' | 'success' | 'warning' | 'danger';

export type ProjectMetrics = {
  doneTaskCount: number;
  totalTaskCount: number;
  progress: number;
};

export type ProjectDeadlineStatus = {
  dateText: string;
  statusText: string;
  tone: ProjectDeadlineTone;
  daysUntilDeadline: number | null;
};

export type ProjectListItem = ProjectRow &
  ProjectMetrics & {
    lastVisitedAt: string | null;
    deadlineStatus: ProjectDeadlineStatus;
    lastVisitText: string;
    displayColor: string;
    displayIconName: ProjectIconName;
  };

export type ProjectMutationInput = {
  workspaceId: string;
  userId: string;
  name: string;
  description: string | null;
  iconName: ProjectIconName;
  color: string;
  deadline: string | null;
};

export type UpdateProjectInput = ProjectMutationInput & {
  projectId: string;
};

export type ArchiveProjectInput = {
  workspaceId: string;
  userId: string;
  projectId: string;
};

export type RestoreProjectInput = ArchiveProjectInput;
