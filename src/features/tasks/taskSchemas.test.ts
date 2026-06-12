import { describe, expect, test } from 'vitest';
import { taskFormSchema } from './taskSchemas';

describe('taskFormSchema', () => {
  test('accepts valid task values and trims text fields', () => {
    const result = taskFormSchema.parse({
      title: '  Подготовить отчет  ',
      description: '  Проверить цифры  ',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'user-1',
      dueDate: '2026-06-20',
      labelIds: ['label-1'],
    });

    expect(result).toEqual({
      title: 'Подготовить отчет',
      description: 'Проверить цифры',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'user-1',
      dueDate: '2026-06-20',
      labelIds: ['label-1'],
    });
  });

  test('rejects a missing title', () => {
    const result = taskFormSchema.safeParse(createValues({ title: '   ' }));

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Название обязательно');
  });

  test('rejects invalid status and priority values', () => {
    expect(
      taskFormSchema.safeParse(createValues({ status: 'blocked' })).success,
    ).toBe(false);
    expect(
      taskFormSchema.safeParse(createValues({ priority: 'critical' })).success,
    ).toBe(false);
  });

  test('rejects duplicate labels', () => {
    const result = taskFormSchema.safeParse(
      createValues({ labelIds: ['label-1', 'label-1'] }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Метки не должны повторяться');
  });

  test('normalizes clearable optional fields', () => {
    const result = taskFormSchema.parse(
      createValues({
        description: '',
        assigneeId: '',
        dueDate: '',
        labelIds: [],
      }),
    );

    expect(result.description).toBeNull();
    expect(result.assigneeId).toBeNull();
    expect(result.dueDate).toBeNull();
    expect(result.labelIds).toEqual([]);
  });
});

function createValues(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Задача',
    description: 'Описание',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'user-1',
    dueDate: '2026-06-20',
    labelIds: ['label-1'],
    ...overrides,
  };
}
