import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, type TaskPriority } from '../board/boardConstants';
import type { BoardAssignee, BoardLabel } from '../board/boardTypes';

const DAY_MS = 24 * 60 * 60 * 1000;

export type TaskDueDateTone = 'muted' | 'default' | 'warning' | 'danger';

export function formatTaskPriority(priority: TaskPriority) {
  return {
    label: TASK_PRIORITY_LABELS[priority],
    color: TASK_PRIORITY_COLORS[priority],
  };
}

export function formatTaskDueDate(dueDate: string | null, now = new Date()) {
  if (!dueDate) {
    return {
      text: 'Без срока',
      tone: 'muted' as TaskDueDateTone,
      isOverdue: false,
    };
  }

  const date = parseDateOnly(dueDate);
  const today = getUtcDateOnly(now);
  const daysUntilDue = Math.round((date.getTime() - today.getTime()) / DAY_MS);

  if (daysUntilDue < 0) {
    return {
      text: `${formatUtcDate(date)} · просрочено`,
      tone: 'danger' as TaskDueDateTone,
      isOverdue: true,
    };
  }

  if (daysUntilDue === 0) {
    return {
      text: `${formatUtcDate(date)} · сегодня`,
      tone: 'warning' as TaskDueDateTone,
      isOverdue: false,
    };
  }

  return {
    text: formatUtcDate(date),
    tone: 'default' as TaskDueDateTone,
    isOverdue: false,
  };
}

export function formatAssignee(assignee: BoardAssignee | null) {
  if (!assignee) {
    return 'Без исполнителя';
  }

  return assignee.displayName || assignee.email;
}

export function formatLabelSummary(labels: BoardLabel[]) {
  if (labels.length === 0) {
    return 'Без меток';
  }

  return labels.map((label) => label.name).join(', ');
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function getUtcDateOnly(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function formatUtcDate(date: Date) {
  return `${pad(date.getUTCDate())}.${pad(date.getUTCMonth() + 1)}.${date.getUTCFullYear()}`;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
