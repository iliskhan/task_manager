import { describe, expect, test } from 'vitest';
import { formatTaskDueDate } from './taskFormatters';

describe('formatTaskDueDate', () => {
  const now = new Date('2026-06-12T12:00:00.000Z');

  test('returns muted copy for tasks without a due date', () => {
    expect(formatTaskDueDate(null, now)).toEqual({
      text: 'Без срока',
      tone: 'muted',
      isOverdue: false,
    });
  });

  test('formats overdue, today, and future due dates', () => {
    expect(formatTaskDueDate('2026-06-10', now)).toEqual({
      text: '10.06.2026 · просрочено',
      tone: 'danger',
      isOverdue: true,
    });
    expect(formatTaskDueDate('2026-06-12', now)).toEqual({
      text: '12.06.2026 · сегодня',
      tone: 'warning',
      isOverdue: false,
    });
    expect(formatTaskDueDate('2026-06-15', now)).toEqual({
      text: '15.06.2026',
      tone: 'default',
      isOverdue: false,
    });
  });
});
