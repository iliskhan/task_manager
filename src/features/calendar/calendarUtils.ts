import {
  addDays,
  addMonths,
  formatMonthName,
  isDateBeforeToday,
  startOfMonth,
  startOfWeek,
  toDateIso,
} from '../../shared/date/dateUtils';
import type { CalendarMonth, CalendarTaskDeadline } from './calendarTypes';

const GRID_DAY_COUNT = 42;

type BuildCalendarOptions = {
  now?: Date;
};

export function buildCalendarMonth(
  monthDate: Date,
  tasks: CalendarTaskDeadline[],
  options: BuildCalendarOptions = {},
): CalendarMonth {
  const monthStart = startOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart);
  const todayIso = toDateIso(options.now ?? new Date());
  const tasksByDate = groupCalendarTasksByDate(tasks);
  const days = Array.from({ length: GRID_DAY_COUNT }, (_, index) => {
    const date = addDays(gridStart, index);
    const dateIso = toDateIso(date);

    return {
      date: dateIso,
      dayOfMonth: date.getDate(),
      isCurrentMonth: date.getMonth() === monthStart.getMonth(),
      isToday: dateIso === todayIso,
      tasks: tasksByDate.get(dateIso) ?? [],
    };
  });

  return {
    title: `${formatMonthName(monthStart)} ${monthStart.getFullYear()}`,
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
  return task.status !== 'done' && isDateBeforeToday(task.dueDate, now);
}

export function shiftCalendarMonth(monthDate: Date, direction: -1 | 1) {
  return startOfMonth(addMonths(monthDate, direction));
}

export function getCurrentMonthStart(now = new Date()) {
  return startOfMonth(now);
}

function compareCalendarTasks(first: CalendarTaskDeadline, second: CalendarTaskDeadline) {
  return (
    first.dueDate.localeCompare(second.dueDate) ||
    first.project.name.localeCompare(second.project.name, 'ru') ||
    first.title.localeCompare(second.title, 'ru')
  );
}
