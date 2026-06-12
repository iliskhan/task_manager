export const TASK_STATUSES = [
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
] as const;

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Бэклог',
  todo: 'К выполнению',
  in_progress: 'В работе',
  review: 'Проверка',
  done: 'Готово',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: '#7f8798',
  todo: '#42a5ff',
  in_progress: '#7c3aed',
  review: '#f7c948',
  done: '#66d861',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  urgent: 'Срочный',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#7f8798',
  medium: '#42a5ff',
  high: '#f7c948',
  urgent: '#ff6b7a',
};

export const DEFAULT_TASK_POSITION = 1000;
export const TASK_POSITION_STEP = 1000;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
