import { describe, expect, test } from 'vitest';
import type { TaskMoveInput } from '../board/boardTypes';
import {
  createTask,
  loadProjectBoard,
  moveTask,
  updateTask,
} from './taskRepository';
import type {
  CreateTaskInput,
  LabelRow,
  ProfileRow,
  TaskLabelRow,
  TaskRow,
  UpdateTaskInput,
  WorkspaceMemberRow,
} from './taskTypes';

describe('taskRepository', () => {
  test('maps board data with task labels and assignees', async () => {
    const client = createClient({
      tasks: [
        createTaskRow({
          id: 'task-1',
          title: 'Подготовить отчет',
          assignee_id: 'member-1',
        }),
      ],
      labels: [createLabel({ id: 'label-1', name: 'Финансы' })],
      task_labels: [{ task_id: 'task-1', label_id: 'label-1' }],
      workspace_members: [createMember({ user_id: 'member-1' })],
      profiles: [
        createProfile({
          id: 'member-1',
          email: 'member@example.com',
          display_name: 'Мария',
        }),
      ],
    });

    const board = await loadProjectBoard(client, 'workspace-1', 'project-1');

    expect(board.tasks).toHaveLength(1);
    expect(board.tasks[0]).toMatchObject({
      id: 'task-1',
      title: 'Подготовить отчет',
      labels: [{ id: 'label-1', name: 'Финансы' }],
      assignee: {
        id: 'member-1',
        email: 'member@example.com',
        displayName: 'Мария',
      },
    });
    expect(board.assignees).toEqual([
      {
        id: 'member-1',
        email: 'member@example.com',
        displayName: 'Мария',
      },
    ]);
  });

  test('creates a task with workspace/project/creator ids, labels, and activity', async () => {
    const client = createClient();

    await createTask(client, createTaskInput({ labelIds: ['label-1', 'label-2'] }));

    expect(findCall(client.calls, 'tasks', 'insert')?.args[0]).toMatchObject({
      workspace_id: 'workspace-1',
      project_id: 'project-1',
      created_by: 'user-1',
      title: 'Новая задача',
      position: 2000,
    });
    expect(findCall(client.calls, 'task_labels', 'insert')?.args[0]).toEqual([
      { task_id: 'generated-task-id', label_id: 'label-1' },
      { task_id: 'generated-task-id', label_id: 'label-2' },
    ]);
    expect(findCall(client.calls, 'activity_events', 'insert')?.args[0]).toMatchObject({
      workspace_id: 'workspace-1',
      project_id: 'project-1',
      task_id: 'generated-task-id',
      actor_id: 'user-1',
      event_type: 'task_created',
    });
  });

  test('updates editable task fields without immutable ids and replaces labels', async () => {
    const client = createClient({
      tasks: [createTaskRow({ id: 'task-1' })],
    });

    await updateTask(client, updateTaskInput({ labelIds: ['label-3'] }));

    expect(findCall(client.calls, 'tasks', 'update')?.args[0]).toEqual({
      title: 'Обновленная задача',
      description: null,
      status: 'review',
      priority: 'high',
      assignee_id: null,
      due_date: null,
    });
    expect(findCall(client.calls, 'task_labels', 'delete')).toBeTruthy();
    expect(findCall(client.calls, 'task_labels', 'insert')?.args[0]).toEqual([
      { task_id: 'task-1', label_id: 'label-3' },
    ]);
    expect(findCall(client.calls, 'activity_events', 'insert')?.args[0]).toMatchObject({
      event_type: 'task_updated',
      task_id: 'task-1',
    });
  });

  test('moves a task by updating only status and position and writes activity', async () => {
    const client = createClient({
      tasks: [createTaskRow({ id: 'task-1' })],
    });

    await moveTask(client, {
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      userId: 'user-1',
      taskId: 'task-1',
      status: 'done',
      position: 5000,
    });

    expect(findCall(client.calls, 'tasks', 'update')?.args[0]).toEqual({
      status: 'done',
      position: 5000,
    });
    expect(findCall(client.calls, 'activity_events', 'insert')?.args[0]).toMatchObject({
      event_type: 'task_moved',
      task_id: 'task-1',
      payload: {
        status: 'done',
        position: 5000,
      },
    });
  });
});

type TableName =
  | 'tasks'
  | 'labels'
  | 'task_labels'
  | 'workspace_members'
  | 'profiles'
  | 'activity_events';

type ClientCall = {
  table: TableName;
  method: string;
  args: unknown[];
};

type FakeRows = Partial<{
  tasks: TaskRow[];
  labels: LabelRow[];
  task_labels: TaskLabelRow[];
  workspace_members: WorkspaceMemberRow[];
  profiles: ProfileRow[];
  activity_events: unknown[];
}>;

type FakeClient = {
  calls: ClientCall[];
  from: (table: TableName) => FakeQuery;
};

class FakeQuery {
  private filters: Array<{ column: string; value: unknown; type: 'eq' | 'in' }> = [];
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: unknown;
  private shouldReturnSingle = false;

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
    this.filters.push({ column: args[0], value: args[1], type: 'eq' });
    return this;
  }

  in(...args: [string, unknown[]]) {
    this.calls.push({ table: this.table, method: 'in', args });
    this.filters.push({ column: args[0], value: args[1], type: 'in' });
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

  delete() {
    this.calls.push({ table: this.table, method: 'delete', args: [] });
    this.operation = 'delete';
    return this;
  }

  single() {
    this.shouldReturnSingle = true;
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

    if (this.operation === 'delete') {
      return Promise.resolve({ data: null, error: null });
    }

    const rows = this.getFilteredRows();

    if (this.shouldReturnSingle) {
      return Promise.resolve({ data: rows[0] ?? this.createInsertedRow(), error: null });
    }

    return Promise.resolve({ data: rows, error: null });
  }

  private createInsertedRow() {
    if (this.table === 'tasks') {
      return createTaskRow({
        ...(this.payload as Partial<TaskRow>),
        id: 'generated-task-id',
      });
    }

    return this.payload;
  }

  private createUpdatedRow() {
    if (this.table === 'tasks') {
      return {
        ...createTaskRow({ id: this.getFilterValue('id') ?? 'task-1' }),
        ...(this.payload as Partial<TaskRow>),
      };
    }

    return this.payload;
  }

  private getFilteredRows() {
    return this.getRows().filter((row) =>
      this.filters.every((filter) => {
        const value = row[filter.column as keyof typeof row];

        if (filter.type === 'in') {
          return (filter.value as unknown[]).includes(value);
        }

        return value === filter.value;
      }),
    );
  }

  private getRows() {
    return (this.rows[this.table] ?? []) as Array<Record<string, unknown>>;
  }

  private getFilterValue(column: string) {
    return this.filters.find((filter) => filter.column === column)?.value as string | undefined;
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

function createTaskInput(overrides: Partial<CreateTaskInput> = {}): CreateTaskInput {
  return {
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    userId: 'user-1',
    title: 'Новая задача',
    description: 'Описание',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'member-1',
    dueDate: '2026-06-20',
    labelIds: [],
    position: 2000,
    ...overrides,
  };
}

function updateTaskInput(overrides: Partial<UpdateTaskInput> = {}): UpdateTaskInput {
  return {
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    userId: 'user-1',
    taskId: 'task-1',
    title: 'Обновленная задача',
    description: null,
    status: 'review',
    priority: 'high',
    assigneeId: null,
    dueDate: null,
    labelIds: [],
    ...overrides,
  };
}

function createTaskRow(overrides: Partial<TaskRow> = {}): TaskRow {
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

function createLabel(overrides: Partial<LabelRow> = {}): LabelRow {
  return {
    id: 'label-1',
    workspace_id: 'workspace-1',
    name: 'Метка',
    color: '#42a5ff',
    created_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}

function createMember(overrides: Partial<WorkspaceMemberRow> = {}): WorkspaceMemberRow {
  return {
    workspace_id: 'workspace-1',
    user_id: 'member-1',
    role: 'member',
    created_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}

function createProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: 'member-1',
    email: 'member@example.com',
    display_name: null,
    avatar_url: null,
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}
