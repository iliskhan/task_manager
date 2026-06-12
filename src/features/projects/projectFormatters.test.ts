import { describe, expect, test } from 'vitest';
import {
  formatDeadlineStatus,
  formatLastVisit,
  getProjectColor,
  getProjectIconName,
} from './projectFormatters';

describe('formatDeadlineStatus', () => {
  test('returns neutral copy for projects without a deadline', () => {
    expect(formatDeadlineStatus(null, new Date('2026-06-12T12:00:00.000Z'))).toEqual({
      dateText: 'Без дедлайна',
      statusText: 'Срок не задан',
      tone: 'muted',
      daysUntilDeadline: null,
    });
  });

  test('formats a future deadline', () => {
    expect(formatDeadlineStatus('2026-06-15', new Date('2026-06-12T12:00:00.000Z'))).toMatchObject({
      dateText: '15.06.2026',
      statusText: 'Осталось 3 дня',
      tone: 'success',
      daysUntilDeadline: 3,
    });
  });

  test('formats today as an urgent deadline', () => {
    expect(formatDeadlineStatus('2026-06-12', new Date('2026-06-12T12:00:00.000Z'))).toMatchObject({
      statusText: 'Сегодня дедлайн',
      tone: 'warning',
      daysUntilDeadline: 0,
    });
  });

  test('formats overdue deadlines', () => {
    expect(formatDeadlineStatus('2026-06-10', new Date('2026-06-12T12:00:00.000Z'))).toMatchObject({
      statusText: 'Просрочено на 2 дня',
      tone: 'danger',
      daysUntilDeadline: -2,
    });
  });
});

describe('formatLastVisit', () => {
  test('returns muted copy for missing visits', () => {
    expect(formatLastVisit(null, new Date('2026-06-12T12:00:00.000Z'))).toBe('Еще не открывали');
  });

  test('formats same-day visits with time', () => {
    expect(formatLastVisit('2026-06-12T08:30:00.000Z', new Date('2026-06-12T12:00:00.000Z'))).toBe(
      'Сегодня, 08:30',
    );
  });

  test('formats older visits with a date', () => {
    expect(formatLastVisit('2026-06-08T08:30:00.000Z', new Date('2026-06-12T12:00:00.000Z'))).toBe(
      '08.06.2026, 08:30',
    );
  });
});

describe('project visual defaults', () => {
  test('falls back to stable project color and icon names', () => {
    expect(getProjectColor(null)).toBe('#42a5ff');
    expect(getProjectIconName(null)).toBe('briefcase');
  });
});
