import type { CalendarMonth, CalendarTaskDeadline } from './calendarTypes';

const GRID_DAY_COUNT = 42;
const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

type BuildCalendarOptions = {
  now?: Date;
};

export function buildCalendarMonth(
  monthDate: Date,
  tasks: CalendarTaskDeadline[],
  options: BuildCalendarOptions = {},
): CalendarMonth {
  const monthStart = getUtcMonthStart(monthDate);
  const gridStart = addDays(monthStart, -getMondayOffset(monthStart));
  const todayIso = toDateIso(options.now ?? new Date());
  const tasksByDate = groupCalendarTasksByDate(tasks);
  const days = Array.from({ length: GRID_DAY_COUNT }, (_, index) => {
    const date = addDays(gridStart, index);
    const dateIso = toDateIso(date);

    return {
      date: dateIso,
      dayOfMonth: date.getUTCDate(),
      isCurrentMonth: date.getUTCMonth() === monthStart.getUTCMonth(),
      isToday: dateIso === todayIso,
      tasks: tasksByDate.get(dateIso) ?? [],
    };
  });

  return {
    title: `${MONTH_NAMES[monthStart.getUTCMonth()]} ${monthStart.getUTCFullYear()}`,
    monthStart: toDateIso(monthStart),
    days,
  };
}

export function groupCalendarTasksByDate(tasks: CalendarTaskDeadline[]) {
  const grouped = new Map<string, CalendarTaskDeadline[]>();
  const sortedTasks = [...tasks].sort(compareCalendarTasks);

  for (const task of sortedTasks) {
    const current = grouped.get(task.dueDate) ?? [];
    current.push(task);
    grouped.set(task.dueDate, current);
  }

  return grouped;
}

export function isCalendarTaskOverdue(task: CalendarTaskDeadline, now = new Date()) {
  return task.status !== 'done' && task.dueDate < toDateIso(now);
}

export function shiftCalendarMonth(monthDate: Date, direction: -1 | 1) {
  return new Date(Date.UTC(
    monthDate.getUTCFullYear(),
    monthDate.getUTCMonth() + direction,
    1,
  ));
}

export function getCurrentMonthStart(now = new Date()) {
  return getUtcMonthStart(now);
}

function compareCalendarTasks(first: CalendarTaskDeadline, second: CalendarTaskDeadline) {
  return (
    first.dueDate.localeCompare(second.dueDate) ||
    first.project.name.localeCompare(second.project.name, 'ru') ||
    first.title.localeCompare(second.title, 'ru')
  );
}

function getUtcMonthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getMondayOffset(date: Date) {
  return (date.getUTCDay() + 6) % 7;
}

function addDays(date: Date, count: number) {
  return new Date(date.getTime() + count * DAY_MS);
}

function toDateIso(date: Date) {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
