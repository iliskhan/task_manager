import { describe, expect, test } from 'vitest';
import {
  buildCalendarMonth,
  groupCalendarTasksByDate,
  isCalendarTaskOverdue,
} from './calendarUtils';
import type { CalendarTaskDeadline } from './calendarTypes';

describe('calendarUtils', () => {
  test('builds a six-week month grid starting on Monday', () => {
    const month = buildCalendarMonth(new Date('2026-06-12T12:00:00.000Z'), [], {
      now: new Date('2026-06-12T12:00:00.000Z'),
    });

    expect(month.title).toBe('Июнь 2026');
    expect(month.days).toHaveLength(42);
    expect(month.days[0]).toMatchObject({
      date: '2026-06-01',
      dayOfMonth: 1,
      isCurrentMonth: true,
      isToday: false,
    });
    expect(month.days[11]).toMatchObject({
      date: '2026-06-12',
      dayOfMonth: 12,
      isCurrentMonth: true,
      isToday: true,
    });
    expect(month.days[41]).toMatchObject({
      date: '2026-07-12',
      dayOfMonth: 12,
      isCurrentMonth: false,
    });
  });

  test('groups deadline tasks by due date inside the month view', () => {
    const first = createDeadline({ id: 'task-1', dueDate: '2026-06-15', title: 'Дизайн' });
    const second = createDeadline({ id: 'task-2', dueDate: '2026-06-15', title: 'Текст' });
    const outside = createDeadline({ id: 'task-3', dueDate: '2026-07-01', title: 'Релиз' });

    const grouped = groupCalendarTasksByDate([second, outside, first]);
    const month = buildCalendarMonth(
      new Date('2026-06-12T12:00:00.000Z'),
      [second, outside, first],
      { now: new Date('2026-06-12T12:00:00.000Z') },
    );

    expect(grouped.get('2026-06-15')?.map((task) => task.title)).toEqual(['Дизайн', 'Текст']);
    expect(month.days.find((day) => day.date === '2026-06-15')?.tasks).toHaveLength(2);
    expect(month.days.find((day) => day.date === '2026-07-01')?.tasks).toHaveLength(1);
  });

  test('marks only unfinished past due tasks as overdue', () => {
    expect(
      isCalendarTaskOverdue(
        createDeadline({ dueDate: '2026-06-11', status: 'todo' }),
        new Date('2026-06-12T12:00:00.000Z'),
      ),
    ).toBe(true);
    expect(
      isCalendarTaskOverdue(
        createDeadline({ dueDate: '2026-06-11', status: 'done' }),
        new Date('2026-06-12T12:00:00.000Z'),
      ),
    ).toBe(false);
    expect(
      isCalendarTaskOverdue(
        createDeadline({ dueDate: '2026-06-12', status: 'review' }),
        new Date('2026-06-12T12:00:00.000Z'),
      ),
    ).toBe(false);
  });
});

function createDeadline(
  overrides: Partial<CalendarTaskDeadline> = {},
): CalendarTaskDeadline {
  return {
    id: 'task-1',
    title: 'Задача',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-06-15',
    project: {
      id: 'project-1',
      name: 'Бизнес',
      color: '#42a5ff',
      iconName: 'briefcase',
    },
    ...overrides,
  };
}
