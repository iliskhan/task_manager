import { themeTokens } from '../../app/theme/theme';
import { daysBetween, formatDate, formatTime, isToday } from '../../shared/date/dateUtils';
import type {
  ProjectDeadlineStatus,
  ProjectIconName,
  ProjectDeadlineTone,
} from './projectTypes';

const DEFAULT_PROJECT_COLOR = themeTokens.blue;
const DEFAULT_PROJECT_ICON: ProjectIconName = 'briefcase';
const PROJECT_ICONS = new Set<ProjectIconName>(['briefcase', 'laptop', 'school', 'heart']);

export function formatDeadlineStatus(
  deadline: string | null,
  now = new Date(),
): ProjectDeadlineStatus {
  if (!deadline) {
    return {
      dateText: 'Без дедлайна',
      statusText: 'Срок не задан',
      tone: 'muted',
      daysUntilDeadline: null,
    };
  }

  const daysUntilDeadline = daysBetween(deadline, now);

  if (daysUntilDeadline < 0) {
    return createDeadlineStatus(
      deadline,
      `Просрочено на ${formatDayCount(Math.abs(daysUntilDeadline))}`,
      'danger',
      daysUntilDeadline,
    );
  }

  if (daysUntilDeadline === 0) {
    return createDeadlineStatus(
      deadline,
      'Сегодня дедлайн',
      'warning',
      daysUntilDeadline,
    );
  }

  return createDeadlineStatus(
    deadline,
    `Осталось ${formatDayCount(daysUntilDeadline)}`,
    'success',
    daysUntilDeadline,
  );
}

export function formatLastVisit(visitedAt: string | null, now = new Date()) {
  if (!visitedAt) {
    return 'Еще не открывали';
  }

  if (isToday(new Date(visitedAt), now)) {
    return `Сегодня, ${formatTime(visitedAt)}`;
  }

  return `${formatDate(new Date(visitedAt))}, ${formatTime(visitedAt)}`;
}

export function getProjectColor(color: string | null) {
  return color?.trim() || DEFAULT_PROJECT_COLOR;
}

export function getProjectIconName(iconName: string | null): ProjectIconName {
  return PROJECT_ICONS.has(iconName as ProjectIconName)
    ? (iconName as ProjectIconName)
    : DEFAULT_PROJECT_ICON;
}

function createDeadlineStatus(
  deadline: string,
  statusText: string,
  tone: ProjectDeadlineTone,
  daysUntilDeadline: number,
): ProjectDeadlineStatus {
  return {
    dateText: formatDate(deadline),
    statusText,
    tone,
    daysUntilDeadline,
  };
}

function formatDayCount(count: number) {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${count} дней`;
  }

  if (lastDigit === 1) {
    return `${count} день`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} дня`;
  }

  return `${count} дней`;
}
