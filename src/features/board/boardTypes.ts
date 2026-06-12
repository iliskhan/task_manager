import type { TaskPriority, TaskStatus } from './boardConstants';

export type BoardLabel = {
  id: string;
  name: string;
  color: string | null;
};

export type BoardAssignee = {
  id: string;
  email: string;
  displayName: string | null;
};

export type BoardTask = {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  dueDate: string | null;
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  labels: BoardLabel[];
  assignee: BoardAssignee | null;
};

export type BoardColumnView = {
  status: TaskStatus;
  label: string;
  tasks: BoardTask[];
};

export type ProjectBoardData = {
  tasks: BoardTask[];
  labels: BoardLabel[];
  assignees: BoardAssignee[];
};

export type TaskMoveInput = {
  workspaceId: string;
  projectId: string;
  userId: string;
  taskId: string;
  status: TaskStatus;
  position: number;
};

export type TaskMoveCalculationInput = {
  activeTaskId: string;
  overTaskId: string | null;
  targetStatus: TaskStatus;
  targetIndex: number;
  tasksByStatus: Record<TaskStatus, BoardTask[]>;
};

export type TaskMoveCalculationResult = {
  taskId: string;
  status: TaskStatus;
  position: number;
} | null;
