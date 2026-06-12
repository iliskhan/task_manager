import { describe, expect, test } from 'vitest';
import { loadCalendarDeadlines } from './calendarRepository';
import type { ProjectRow } from '../projects/projectTypes';
import type { TaskRow } from '../tasks/taskTypes';

describe('calendarRepository', () => {
  test('maps active project task deadlines with project display context', async () => {
    const client = createClient({
      projects: [
        createProject({ id: 'active-project', name: 'Бизнес', color: '#42a5ff' }),
        createProject({
          id: 'archived-project',
          name: 'Архив',
          archived_at: '2026-06-11T00:00:00.000Z',
        }),
      ],
      tasks: [
        createTask({
          id: 'task-1',
          project_id: 'active-project',
          title: 'Подготовить отчет',
          due_date: '2026-06-15',
          status: 'review',
        }),
        createTask({
          id: 'task-no-date',
          project_id: 'active-project',
          title: 'Без срока',
          due_date: null,
        }),
        createTask({
          id: 'task-archived',
          project_id: 'archived-project',
          title: 'Архивная задача',
          due_date: '2026-06-16',
        }),
      ],
    });

    const deadlines = await loadCalendarDeadlines(client, 'workspace-1');

    expect(deadlines).toEqual([
      {
        id: 'task-1',
        title: 'Подготовить отчет',
        dueDate: '2026-06-15',
        priority: 'medium',
        status: 'review',
        project: {
          id: 'active-project',
          name: 'Бизнес',
          color: '#42a5ff',
          iconName: 'briefcase',
        },
      },
    ]);
    expect(client.calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: 'projects',
          method: 'eq',
          args: ['workspace_id', 'workspace-1'],
        }),
        expect.objectContaining({
          table: 'tasks',
          method: 'eq',
          args: ['workspace_id', 'workspace-1'],
        }),
      ]),
    );
  });
});

type TableName = 'projects' | 'tasks';
type ClientCall = {
  table: TableName;
  method: string;
  args: unknown[];
};

type FakeClient = {
  calls: ClientCall[];
  from: (table: TableName) => FakeQuery;
};

type FakeRows = {
  projects: ProjectRow[];
  tasks: TaskRow[];
};

class FakeQuery {
  private filters: Array<{ column: string; value: unknown }> = [];

  constructor(
    private readonly table: TableName,
    private readonly rows: FakeRows,
    private readonly calls: ClientCall[],
  ) {}

  select(...args: unknown[]) {
    this.calls.push({ table: this.table, method: 'select', args });
    return this;
  }

  eq(...args: [string, unknown]) {
    this.calls.push({ table: this.table, method: 'eq', args });
    this.filters.push({ column: args[0], value: args[1] });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ table: this.table, method: 'order', args });
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute() {
    return Promise.resolve({
      data: this.getRows().filter((row) =>
        this.filters.every((filter) => row[filter.column as keyof typeof row] === filter.value),
      ),
      error: null,
    });
  }

  private getRows() {
    return this.rows[this.table] as Array<Record<string, unknown>>;
  }
}

function createClient(rows: FakeRows): FakeClient {
  const calls: ClientCall[] = [];

  return {
    calls,
    from: (table) => new FakeQuery(table, rows, calls),
  };
}

function createProject(overrides: Partial<ProjectRow> = {}): ProjectRow {
  return {
    id: 'project-1',
    workspace_id: 'workspace-1',
    name: 'Проект',
    description: null,
    icon_name: 'briefcase',
    color: '#42a5ff',
    deadline: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}

function createTask(overrides: Partial<TaskRow> = {}): TaskRow {
  return {
    id: 'task-1',
    workspace_id: 'workspace-1',
    project_id: 'project-1',
    title: 'Задача',
    description: null,
    status: 'todo',
    priority: 'medium',
    assignee_id: null,
    due_date: '2026-06-15',
    position: 1000,
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}
