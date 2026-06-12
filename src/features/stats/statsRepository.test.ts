import { describe, expect, test } from 'vitest';
import { loadWorkspaceStats } from './statsRepository';
import type {
  StatsActivityEventRow,
  StatsProfileRow,
  StatsProjectRow,
  StatsTaskRow,
} from './statsTypes';

describe('statsRepository', () => {
  test('loads workspace analytics and actor profiles from Supabase rows', async () => {
    const client = createClient({
      projects: [createProject({ id: 'project-1', name: 'Бизнес' })],
      tasks: [
        createTask({ id: 'task-1', project_id: 'project-1', status: 'done' }),
        createTask({
          id: 'task-2',
          project_id: 'project-1',
          status: 'todo',
          due_date: '2026-06-11',
        }),
      ],
      activity_events: [
        createActivity({
          id: 'event-1',
          actor_id: 'user-1',
          project_id: 'project-1',
          payload: { title: 'Закрыть отчет' },
        }),
      ],
      profiles: [createProfile({ id: 'user-1', display_name: 'Мария' })],
    });

    const stats = await loadWorkspaceStats(client, 'workspace-1', {
      now: new Date('2026-06-12T12:00:00.000Z'),
    });

    expect(stats.summary).toMatchObject({
      activeProjectCount: 1,
      totalTaskCount: 2,
      completedTaskCount: 1,
      overdueTaskCount: 1,
    });
    expect(stats.recentActivity[0]).toMatchObject({
      actorName: 'Мария',
      description: 'Закрыть отчет',
      projectName: 'Бизнес',
    });
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
        expect.objectContaining({
          table: 'activity_events',
          method: 'eq',
          args: ['workspace_id', 'workspace-1'],
        }),
        expect.objectContaining({
          table: 'profiles',
          method: 'in',
          args: ['id', ['user-1']],
        }),
      ]),
    );
  });
});

type TableName = 'projects' | 'tasks' | 'activity_events' | 'profiles';
type ClientCall = {
  table: TableName;
  method: string;
  args: unknown[];
};

type FakeRows = {
  projects: StatsProjectRow[];
  tasks: StatsTaskRow[];
  activity_events: StatsActivityEventRow[];
  profiles: StatsProfileRow[];
};

class FakeQuery {
  private filters: Array<{ column: string; value: unknown }> = [];
  private inFilters: Array<{ column: string; values: unknown[] }> = [];
  private rowLimit: number | null = null;

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

  in(...args: [string, unknown[]]) {
    this.calls.push({ table: this.table, method: 'in', args });
    this.inFilters.push({ column: args[0], values: args[1] });
    return this;
  }

  order(...args: unknown[]) {
    this.calls.push({ table: this.table, method: 'order', args });
    return this;
  }

  limit(...args: [number]) {
    this.calls.push({ table: this.table, method: 'limit', args });
    this.rowLimit = args[0];
    return this;
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute() {
    const rows = this.getRows()
      .filter((row) =>
        this.filters.every((filter) => row[filter.column as keyof typeof row] === filter.value),
      )
      .filter((row) =>
        this.inFilters.every((filter) =>
          filter.values.includes(row[filter.column as keyof typeof row]),
        ),
      );

    return Promise.resolve({
      data: this.rowLimit ? rows.slice(0, this.rowLimit) : rows,
      error: null,
    });
  }

  private getRows() {
    return this.rows[this.table] as Array<Record<string, unknown>>;
  }
}

function createClient(rows: FakeRows) {
  const calls: ClientCall[] = [];

  return {
    calls,
    from: (table: TableName) => new FakeQuery(table, rows, calls),
  };
}

function createProject(overrides: Partial<StatsProjectRow> = {}): StatsProjectRow {
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

function createTask(overrides: Partial<StatsTaskRow> = {}): StatsTaskRow {
  return {
    id: 'task-1',
    workspace_id: 'workspace-1',
    project_id: 'project-1',
    title: 'Задача',
    description: null,
    status: 'todo',
    priority: 'medium',
    assignee_id: null,
    due_date: null,
    position: 1000,
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}

function createActivity(overrides: Partial<StatsActivityEventRow> = {}): StatsActivityEventRow {
  return {
    id: 'event-1',
    workspace_id: 'workspace-1',
    project_id: 'project-1',
    task_id: null,
    actor_id: 'user-1',
    event_type: 'task_updated',
    payload: {},
    created_at: '2026-06-11T09:00:00.000Z',
    ...overrides,
  };
}

function createProfile(overrides: Partial<StatsProfileRow> = {}): StatsProfileRow {
  return {
    id: 'user-1',
    email: 'member@example.com',
    display_name: null,
    avatar_url: null,
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}
