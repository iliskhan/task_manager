import { TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS, type TaskPriority } from '../board/boardConstants';
import type { BoardAssignee, BoardLabel } from '../board/boardTypes';
import { daysBetween, formatDate } from '../../shared/date/dateUtils';

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

  const daysUntilDue = daysBetween(dueDate, now);

  if (daysUntilDue < 0) {
    return {
      text: `${formatDate(dueDate)} · просрочено`,
      tone: 'danger' as TaskDueDateTone,
      isOverdue: true,
    };
  }

  if (daysUntilDue === 0) {
    return {
      text: `${formatDate(dueDate)} · сегодня`,
      tone: 'warning' as TaskDueDateTone,
      isOverdue: false,
    };
  }

  return {
    text: formatDate(dueDate),
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
