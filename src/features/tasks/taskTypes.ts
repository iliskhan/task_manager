import type { TaskPriority, TaskStatus } from '../board/boardConstants';
import type { BoardAssignee, BoardLabel, BoardTask } from '../board/boardTypes';
import type { Tables } from '../../lib/supabase/database.types';

export type TaskRow = Tables<'tasks'>;
export type LabelRow = Tables<'labels'>;
export type TaskLabelRow = Tables<'task_labels'>;
export type WorkspaceMemberRow = Tables<'workspace_members'>;
export type ProfileRow = Tables<'profiles'>;

export type TaskFormValues = {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null;
  labelIds: string[];
};

export type CreateTaskInput = TaskFormValues & {
  workspaceId: string;
  projectId: string;
  userId: string;
  position: number;
};

export type UpdateTaskInput = TaskFormValues & {
  workspaceId: string;
  projectId: string;
  userId: string;
  taskId: string;
};

export type ProjectBoardRepositoryData = {
  tasks: BoardTask[];
  labels: BoardLabel[];
  assignees: BoardAssignee[];
};
