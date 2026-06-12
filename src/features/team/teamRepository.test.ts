import { describe, expect, test } from 'vitest';
import {
  addWorkspaceMember,
  loadWorkspaceMembers,
} from './teamRepository';
import type {
  AddWorkspaceMemberFunctionResponse,
  ProfileRow,
  WorkspaceMemberRow,
} from './teamTypes';

describe('teamRepository', () => {
  test('maps workspace members with profile data', async () => {
    const client = createClient({
      workspace_members: [
        createMembership({ user_id: 'owner-1', role: 'owner' }),
        createMembership({ user_id: 'member-1', role: 'member' }),
      ],
      profiles: [
        createProfile({ id: 'owner-1', display_name: 'Алексей' }),
        createProfile({ id: 'member-1', email: 'member@example.com', display_name: null }),
      ],
    });

    const members = await loadWorkspaceMembers(client, 'workspace-1');

    expect(members).toEqual([
      {
        userId: 'owner-1',
        email: 'owner@example.com',
        displayName: 'Алексей',
        avatarUrl: null,
        role: 'owner',
        createdAt: '2026-06-07T00:00:00.000Z',
      },
      {
        userId: 'member-1',
        email: 'member@example.com',
        displayName: null,
        avatarUrl: null,
        role: 'member',
        createdAt: '2026-06-07T00:00:00.000Z',
      },
    ]);
    expect(findCall(client.calls, 'workspace_members', 'eq')?.args).toEqual([
      'workspace_id',
      'workspace-1',
    ]);
    expect(findCall(client.calls, 'profiles', 'in')?.args).toEqual([
      'id',
      ['owner-1', 'member-1'],
    ]);
  });

  test('invokes add-workspace-member with normalized email and member role', async () => {
    const client = createClient({
      invokeResult: {
        data: {
          member: {
            userId: 'member-1',
            email: 'member@example.com',
            displayName: 'Мария',
            avatarUrl: null,
            role: 'member',
            createdAt: '2026-06-12T12:00:00.000Z',
          },
        },
        error: null,
      },
    });

    await expect(
      addWorkspaceMember(client, {
        workspaceId: 'workspace-1',
        email: '  MEMBER@Example.COM ',
      }),
    ).resolves.toMatchObject({
      userId: 'member-1',
      email: 'member@example.com',
      role: 'member',
    });
    expect(client.invokeCalls).toEqual([
      {
        functionName: 'add-workspace-member',
        options: {
          body: {
            workspaceId: 'workspace-1',
            email: 'member@example.com',
            role: 'member',
          },
        },
      },
    ]);
  });

  test('maps Edge Function JSON errors to stable Russian messages', async () => {
    const client = createClient({
      invokeResult: {
        data: null,
        error: {
          context: {
            json: async () => ({
              code: 'already_member',
              message: 'Already added',
            }),
          },
        },
      },
    });

    await expect(
      addWorkspaceMember(client, {
        workspaceId: 'workspace-1',
        email: 'member@example.com',
      }),
    ).rejects.toMatchObject({
      code: 'already_member',
      message: 'Пользователь уже состоит в команде.',
    });
  });
});

type TableName = 'workspace_members' | 'profiles';

type ClientCall = {
  table: TableName;
  method: string;
  args: unknown[];
};

type InvokeCall = {
  functionName: string;
  options: { body: unknown };
};

type FakeRows = Partial<{
  workspace_members: WorkspaceMemberRow[];
  profiles: ProfileRow[];
  invokeResult: {
    data: AddWorkspaceMemberFunctionResponse | null;
    error: unknown;
  };
}>;

type FakeClient = {
  calls: ClientCall[];
  invokeCalls: InvokeCall[];
  from: (table: TableName) => FakeQuery;
  functions: {
    invoke: (
      functionName: string,
      options: { body: unknown },
    ) => Promise<{ data: AddWorkspaceMemberFunctionResponse | null; error: unknown }>;
  };
};

class FakeQuery {
  private filters: Array<{ column: string; value: unknown; type: 'eq' | 'in' }> = [];

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

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve({ data: this.getFilteredRows(), error: null }).then(
      onfulfilled,
      onrejected,
    );
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
}

function createClient(rows: FakeRows = {}): FakeClient {
  const calls: ClientCall[] = [];
  const invokeCalls: InvokeCall[] = [];

  return {
    calls,
    invokeCalls,
    from: (table) => new FakeQuery(table, rows, calls),
    functions: {
      invoke: async (functionName, options) => {
        invokeCalls.push({ functionName, options });

        return rows.invokeResult ?? { data: null, error: null };
      },
    },
  };
}

function createMembership(
  overrides: Partial<WorkspaceMemberRow> = {},
): WorkspaceMemberRow {
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
    id: 'owner-1',
    email: 'owner@example.com',
    display_name: null,
    avatar_url: null,
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}

function findCall(calls: ClientCall[], table: TableName, method: string) {
  return calls.find((call) => call.table === table && call.method === method);
}
