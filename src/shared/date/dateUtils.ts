import {
  addDays as addDaysDateFns,
  addMonths as addMonthsDateFns,
  differenceInCalendarDays,
  format,
  isSameDay,
  parse,
  startOfMonth as startOfMonthDateFns,
  startOfDay,
  startOfWeek as startOfWeekDateFns,
} from 'date-fns';
import { ru } from 'date-fns/locale';

const DATE_LOCALE = { locale: ru };

const DATE_FORMAT = 'dd.MM.yyyy';
const DATE_TIME_FORMAT = 'dd.MM.yyyy HH:mm';
const TIME_FORMAT = 'HH:mm';
const DATE_ONLY_KEY_FORMAT = 'yyyy-MM-dd';
const CALENDAR_MONTH_FORMAT = 'LLLL';

const WEEK_OPTIONS = { weekStartsOn: 1 } as const;

export function parseDateOnly(value: string): Date {
  return parse(value, DATE_ONLY_KEY_FORMAT, startOfDay(new Date(0)));
}

export function toDateIso(date: Date): string {
  return format(date, DATE_ONLY_KEY_FORMAT);
}

export function formatDate(value: string | Date): string {
  const date = value instanceof Date ? toUtcDateOnly(value) : parseDateOnly(value);

  return format(date, DATE_FORMAT, DATE_LOCALE);
}

export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  return format(toUtcWallClockDate(date), DATE_TIME_FORMAT, DATE_LOCALE);
}

export function formatTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  return format(toUtcWallClockDate(date), TIME_FORMAT, DATE_LOCALE);
}

export function daysBetween(date: string, now = new Date()): number {
  return differenceInCalendarDays(parseDateOnly(date), toUtcDateOnly(now));
}

export function isToday(value: string | Date, now = new Date()): boolean {
  const date = value instanceof Date ? toUtcDateOnly(value) : parseDateOnly(value);

  return isSameDay(date, toUtcDateOnly(now));
}

export function addDays(date: Date, count: number): Date {
  return addDaysDateFns(date, count);
}

export function startOfMonth(date: Date): Date {
  return startOfMonthDateFns(date);
}

export function startOfWeek(date: Date): Date {
  return startOfWeekDateFns(date, WEEK_OPTIONS);
}

export function addMonths(date: Date, count: number): Date {
  return addMonthsDateFns(date, count);
}

export function isDateBeforeToday(value: string, now = new Date()): boolean {
  return daysBetween(value, now) < 0;
}

export function isDateOnOrAfterToday(value: string, now = new Date()): boolean {
  return daysBetween(value, now) >= 0;
}

export function formatMonthName(date: Date): string {
  const monthName = format(date, CALENDAR_MONTH_FORMAT, DATE_LOCALE);

  return `${monthName[0].toUpperCase()}${monthName.slice(1)}`;
}

function toUtcDateOnly(date: Date) {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function toUtcWallClockDate(date: Date) {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  );
}
