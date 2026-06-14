import { describe, expect, test } from 'vitest';
import {
  archiveProject,
  createProject,
  loadProjectDetail,
  loadProjectList,
  recordProjectVisit,
  restoreProject,
  updateProject,
} from './projectRepository';
import type { ProjectRow, ProjectTaskRow, ProjectVisitRow } from './projectTypes';

describe('projectRepository', () => {
  test('maps projects with task progress and current user visits', async () => {
    const client = createClient({
      projects: [createProjectRow({ id: 'project-1', name: 'Бизнес' })],
      tasks: [
        createTask({ id: 'task-1', project_id: 'project-1', status: 'done' }),
        createTask({ id: 'task-2', project_id: 'project-1', status: 'todo' }),
      ],
      project_visits: [
        {
          project_id: 'project-1',
          user_id: 'user-1',
          visited_at: '2026-06-12T08:30:00.000Z',
        },
      ],
    });

    const projects = await loadProjectList(client, 'workspace-1', 'user-1', {
      now: new Date('2026-06-12T12:00:00.000Z'),
    });

    expect(projects).toHaveLength(1);
    expect(projects[0]).toMatchObject({
      id: 'project-1',
      name: 'Бизнес',
      progress: 50,
      doneTaskCount: 1,
      totalTaskCount: 2,
      lastVisitedAt: '2026-06-12T08:30:00.000Z',
      lastVisitText: 'Сегодня, 08:30',
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
          table: 'project_visits',
          method: 'eq',
          args: ['user_id', 'user-1'],
        }),
      ]),
    );
  });

  test('creates a project with workspace and creator ids and writes activity', async () => {
    const client = createClient();

    await createProject(client, {
      workspaceId: 'workspace-1',
      userId: 'user-1',
      name: 'Новый проект',
      description: 'Описание',
      iconName: 'briefcase',
      color: '#42a5ff',
      deadline: '2026-06-20',
    });

    expect(findCall(client.calls, 'projects', 'insert')?.args[0]).toMatchObject({
      workspace_id: 'workspace-1',
      created_by: 'user-1',
      name: 'Новый проект',
      description: 'Описание',
      icon_name: 'briefcase',
      color: '#42a5ff',
      deadline: '2026-06-20',
    });
    expect(findCall(client.calls, 'activity_events', 'insert')?.args[0]).toMatchObject({
      workspace_id: 'workspace-1',
      actor_id: 'user-1',
      project_id: 'generated-project-id',
      event_type: 'project_created',
    });
  });

  test('loads one project detail with computed progress', async () => {
    const client = createClient({
      projects: [createProjectRow({ id: 'project-1', name: 'Детальный проект' })],
      tasks: [
        createTask({ id: 'task-1', project_id: 'project-1', status: 'done' }),
        createTask({ id: 'task-2', project_id: 'project-1', status: 'review' }),
      ],
    });

    await expect(
      loadProjectDetail(client, 'workspace-1', 'project-1', {
        now: new Date('2026-06-12T12:00:00.000Z'),
      }),
    ).resolves.toMatchObject({
      id: 'project-1',
      name: 'Детальный проект',
      progress: 50,
      doneTaskCount: 1,
      totalTaskCount: 2,
    });
  });

  test('updates, archives, and restores projects without issuing hard delete calls', async () => {
    const client = createClient({
      projects: [createProjectRow({ id: 'project-1' })],
    });

    await updateProject(client, {
      projectId: 'project-1',
      workspaceId: 'workspace-1',
      userId: 'user-1',
      name: 'Обновленный проект',
      description: null,
      iconName: 'heart',
      color: '#ff9f32',
      deadline: null,
    });
    await archiveProject(client, {
      projectId: 'project-1',
      workspaceId: 'workspace-1',
      userId: 'user-1',
    }, {
      now: new Date('2026-06-12T12:00:00.000Z'),
    });
    await restoreProject(client, {
      projectId: 'project-1',
      workspaceId: 'workspace-1',
      userId: 'user-1',
    });

    const updateCalls = client.calls.filter(
      (call) => call.table === 'projects' && call.method === 'update',
    );

    expect(updateCalls[0].args[0]).toEqual({
      name: 'Обновленный проект',
      description: null,
      icon_name: 'heart',
      color: '#ff9f32',
      deadline: null,
    });
    expect(updateCalls[1].args[0]).toEqual({
      archived_at: '2026-06-12T12:00:00.000Z',
    });
    expect(updateCalls[2].args[0]).toEqual({
      archived_at: null,
    });
    expect(client.calls.some((call) => call.method === 'delete')).toBe(false);
    expect(
      client.calls
        .filter((call) => call.table === 'activity_events' && call.method === 'insert')
        .map((call) => (call.args[0] as { event_type: string }).event_type),
    ).toEqual(['project_updated', 'project_archived', 'project_restored']);
  });

  test('upserts project visits for the current user', async () => {
    const client = createClient();

    await recordProjectVisit(client, 'project-1', 'user-1', {
      now: new Date('2026-06-12T12:00:00.000Z'),
    });

    expect(findCall(client.calls, 'project_visits', 'upsert')).toMatchObject({
      args: [
        {
          project_id: 'project-1',
          user_id: 'user-1',
          visited_at: '2026-06-12T12:00:00.000Z',
        },
        {
          onConflict: 'project_id,user_id',
        },
      ],
    });
  });
});

type TableName = 'projects' | 'tasks' | 'project_visits' | 'activity_events';
type ClientCall = {
  table: TableName;
  method: string;
  args: unknown[];
};

type FakeClient = {
  calls: ClientCall[];
  from: (table: TableName) => FakeQuery;
};

type FakeRows = Partial<{
  projects: ProjectRow[];
  tasks: ProjectTaskRow[];
  project_visits: ProjectVisitRow[];
  activity_events: unknown[];
}>;

class FakeQuery {
  private filters: Array<{ column: string; value: unknown }> = [];
  private operation: 'select' | 'insert' | 'update' | 'upsert' = 'select';
  private payload: unknown;
  private shouldReturnSingle = false;
  private shouldReturnMaybeSingle = false;

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

  insert(payload: unknown) {
    this.calls.push({ table: this.table, method: 'insert', args: [payload] });
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  update(payload: unknown) {
    this.calls.push({ table: this.table, method: 'update', args: [payload] });
    this.operation = 'update';
    this.payload = payload;
    return this;
  }

  upsert(...args: unknown[]) {
    this.calls.push({ table: this.table, method: 'upsert', args });
    this.operation = 'upsert';
    this.payload = args[0];
    return this;
  }

  single() {
    this.shouldReturnSingle = true;
    return this.execute();
  }

  maybeSingle() {
    this.shouldReturnMaybeSingle = true;
    return this.execute();
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute() {
    if (this.operation === 'insert') {
      return Promise.resolve({ data: this.createInsertedRow(), error: null });
    }

    if (this.operation === 'update') {
      return Promise.resolve({ data: this.createUpdatedRow(), error: null });
    }

    if (this.operation === 'upsert') {
      return Promise.resolve({ data: this.payload, error: null });
    }

    const rows = this.getFilteredRows();

    if (this.shouldReturnSingle || this.shouldReturnMaybeSingle) {
      return Promise.resolve({ data: rows[0] ?? null, error: null });
    }

    return Promise.resolve({ data: rows, error: null });
  }

  private createInsertedRow() {
    if (this.table !== 'projects') {
      return this.payload;
    }

    return createProjectRow({
      ...(this.payload as Partial<ProjectRow>),
      id: 'generated-project-id',
    });
  }

  private createUpdatedRow() {
    if (this.table !== 'projects') {
      return this.payload;
    }

    return {
      ...createProjectRow({ id: this.getProjectIdFilter() ?? 'project-1' }),
      ...(this.payload as Partial<ProjectRow>),
    };
  }

  private getFilteredRows() {
    return this.getRows().filter((row) =>
      this.filters.every((filter) => row[filter.column as keyof typeof row] === filter.value),
    );
  }

  private getRows() {
    return (this.rows[this.table] ?? []) as Array<Record<string, unknown>>;
  }

  private getProjectIdFilter() {
    return this.filters.find((filter) => filter.column === 'id')?.value as string | undefined;
  }
}

function createClient(rows: FakeRows = {}): FakeClient {
  const calls: ClientCall[] = [];

  return {
    calls,
    from: (table) => new FakeQuery(table, rows, calls),
  };
}

function findCall(calls: ClientCall[], table: TableName, method: string) {
  return calls.find((call) => call.table === table && call.method === method);
}

function createProjectRow(overrides: Partial<ProjectRow> = {}): ProjectRow {
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

function createTask(overrides: Partial<ProjectTaskRow>): ProjectTaskRow {
  return {
    id: 'task',
    workspace_id: 'workspace-1',
    project_id: 'project-1',
    title: 'Task',
    description: null,
    status: 'todo',
    priority: 'medium',
    assignee_id: null,
    due_date: null,
    position: 100,
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}
