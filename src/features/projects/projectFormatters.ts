import { themeTokens } from '../../app/theme/theme';
import type {
  ProjectDeadlineStatus,
  ProjectIconName,
  ProjectDeadlineTone,
} from './projectTypes';

const DEFAULT_PROJECT_COLOR = themeTokens.blue;
const DEFAULT_PROJECT_ICON: ProjectIconName = 'briefcase';
const DAY_MS = 24 * 60 * 60 * 1000;
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

  const deadlineDate = parseDateOnly(deadline);
  const today = getUtcDateOnly(now);
  const daysUntilDeadline = Math.round(
    (deadlineDate.getTime() - today.getTime()) / DAY_MS,
  );

  if (daysUntilDeadline < 0) {
    return createDeadlineStatus(
      deadlineDate,
      `Просрочено на ${formatDayCount(Math.abs(daysUntilDeadline))}`,
      'danger',
      daysUntilDeadline,
    );
  }

  if (daysUntilDeadline === 0) {
    return createDeadlineStatus(
      deadlineDate,
      'Сегодня дедлайн',
      'warning',
      daysUntilDeadline,
    );
  }

  return createDeadlineStatus(
    deadlineDate,
    `Осталось ${formatDayCount(daysUntilDeadline)}`,
    'success',
    daysUntilDeadline,
  );
}

export function formatLastVisit(visitedAt: string | null, now = new Date()) {
  if (!visitedAt) {
    return 'Еще не открывали';
  }

  const visitDate = new Date(visitedAt);
  const today = getUtcDateOnly(now);
  const visitDay = getUtcDateOnly(visitDate);

  if (today.getTime() === visitDay.getTime()) {
    return `Сегодня, ${formatUtcTime(visitDate)}`;
  }

  return `${formatUtcDate(visitDate)}, ${formatUtcTime(visitDate)}`;
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
  deadlineDate: Date,
  statusText: string,
  tone: ProjectDeadlineTone,
  daysUntilDeadline: number,
): ProjectDeadlineStatus {
  return {
    dateText: formatUtcDate(deadlineDate),
    statusText,
    tone,
    daysUntilDeadline,
  };
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

function formatUtcTime(date: Date) {
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
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

function pad(value: number) {
  return String(value).padStart(2, '0');
}
