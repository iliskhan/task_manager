import { describe, expect, test } from 'vitest';
import {
  handleAddWorkspaceMember,
  parseAddWorkspaceMemberRequest,
} from './handler';

const workspaceId = '10000000-0000-4000-8000-000000000001';
const ownerId = '00000000-0000-4000-8000-000000000001';
const memberId = '00000000-0000-4000-8000-000000000002';

describe('parseAddWorkspaceMemberRequest', () => {
  test('normalizes valid add-member input', () => {
    expect(
      parseAddWorkspaceMemberRequest({
        workspaceId,
        email: '  MEMBER@Example.COM ',
        role: 'member',
      }),
    ).toEqual({
      ok: true,
      value: {
        workspaceId,
        email: 'member@example.com',
        role: 'member',
      },
    });
  });

  test('rejects invalid email and invalid role with stable codes', () => {
    expect(
      parseAddWorkspaceMemberRequest({
        workspaceId,
        email: 'not-an-email',
        role: 'member',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'invalid_email', status: 400 },
    });

    expect(
      parseAddWorkspaceMemberRequest({
        workspaceId,
        email: 'member@example.com',
        role: 'owner',
      }),
    ).toMatchObject({
      ok: false,
      error: { code: 'invalid_role', status: 400 },
    });
  });
});

describe('handleAddWorkspaceMember', () => {
  test('rejects unauthenticated callers before privileged queries', async () => {
    const client = createClient();

    const result = await handleAddWorkspaceMember({
      callerUserId: null,
      client,
      body: {
        workspaceId,
        email: 'member@example.com',
        role: 'member',
      },
    });

    expect(result).toMatchObject({
      status: 401,
      body: { code: 'unauthenticated' },
    });
    expect(client.calls).toEqual([]);
  });

  test('rejects authenticated non-owners', async () => {
    const client = createClient({
      workspace_members: [
        createMembership({ user_id: ownerId, role: 'member' }),
      ],
    });

    const result = await handleAddWorkspaceMember({
      callerUserId: ownerId,
      client,
      body: {
        workspaceId,
        email: 'member@example.com',
        role: 'member',
      },
    });

    expect(result).toMatchObject({
      status: 403,
      body: { code: 'not_owner' },
    });
  });

  test('rejects unknown registered users by email', async () => {
    const client = createClient({
      workspace_members: [createMembership({ user_id: ownerId, role: 'owner' })],
      profiles: [],
    });

    const result = await handleAddWorkspaceMember({
      callerUserId: ownerId,
      client,
      body: {
        workspaceId,
        email: 'missing@example.com',
        role: 'member',
      },
    });

    expect(result).toMatchObject({
      status: 404,
      body: { code: 'user_not_found' },
    });
  });

  test('rejects duplicate workspace memberships', async () => {
    const client = createClient({
      workspace_members: [
        createMembership({ user_id: ownerId, role: 'owner' }),
        createMembership({ user_id: memberId, role: 'member' }),
      ],
      profiles: [createProfile()],
    });

    const result = await handleAddWorkspaceMember({
      callerUserId: ownerId,
      client,
      body: {
        workspaceId,
        email: 'member@example.com',
        role: 'member',
      },
    });

    expect(result).toMatchObject({
      status: 409,
      body: { code: 'already_member' },
    });
  });

  test('rejects duplicate visible workspace memberships before admin lookup', async () => {
    const adminClient = createClient();
    const visibleClient = createClient({
      workspace_members: [
        createMembership({ user_id: ownerId, role: 'owner' }),
        createMembership({ user_id: memberId, role: 'member' }),
      ],
      profiles: [createProfile()],
    });

    const result = await handleAddWorkspaceMember({
      callerUserId: ownerId,
      client: adminClient,
      visibleClient,
      body: {
        workspaceId,
        email: 'member@example.com',
        role: 'member',
      },
    });

    expect(result).toMatchObject({
      status: 409,
      body: { code: 'already_member' },
    });
    expect(adminClient.calls).toEqual([]);
  });

  test('adds an existing registered member and writes activity', async () => {
    const client = createClient({
      workspace_members: [createMembership({ user_id: ownerId, role: 'owner' })],
      profiles: [createProfile()],
    });

    const result = await handleAddWorkspaceMember({
      callerUserId: ownerId,
      client,
      body: {
        workspaceId,
        email: 'member@example.com',
        role: 'member',
      },
    });

    expect(result).toEqual({
      status: 200,
      body: {
        member: {
          userId: memberId,
          email: 'member@example.com',
          displayName: 'Мария',
          avatarUrl: null,
          role: 'member',
          createdAt: '2026-06-12T12:00:00.000Z',
        },
      },
    });
    expect(findCall(client.calls, 'workspace_members', 'insert')?.args[0]).toEqual({
      workspace_id: workspaceId,
      user_id: memberId,
      role: 'member',
    });
    expect(findCall(client.calls, 'activity_events', 'insert')?.args[0]).toMatchObject({
      workspace_id: workspaceId,
      actor_id: ownerId,
      event_type: 'member_added',
      payload: {
        memberUserId: memberId,
        email: 'member@example.com',
        role: 'member',
      },
    });
  });
});

type TableName = 'workspace_members' | 'profiles' | 'activity_events';

type ClientCall = {
  table: TableName;
  method: string;
  args: unknown[];
};

type WorkspaceMemberRow = {
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'member';
  created_at: string;
};

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
};

type FakeRows = Partial<{
  workspace_members: WorkspaceMemberRow[];
  profiles: ProfileRow[];
  activity_events: unknown[];
}>;

type FakeClient = {
  calls: ClientCall[];
  from: (table: TableName) => FakeQuery;
};

class FakeQuery {
  private filters: Array<{
    column: string;
    value: unknown;
    type: 'eq' | 'ilike';
  }> = [];
  private operation: 'select' | 'insert' = 'select';
  private payload: unknown;

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

  ilike(...args: [string, string]) {
    this.calls.push({ table: this.table, method: 'ilike', args });
    this.filters.push({ column: args[0], value: args[1].toLowerCase(), type: 'ilike' });
    return this;
  }

  insert(payload: unknown) {
    this.calls.push({ table: this.table, method: 'insert', args: [payload] });
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }

  single() {
    return this.execute(true);
  }

  maybeSingle() {
    return this.execute(true);
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute(false).then(onfulfilled, onrejected);
  }

  private execute(single: boolean) {
    if (this.operation === 'insert') {
      return Promise.resolve({ data: this.createInsertedRow(), error: null });
    }

    const rows = this.getFilteredRows();

    if (single) {
      return Promise.resolve({ data: rows[0] ?? null, error: null });
    }

    return Promise.resolve({ data: rows, error: null });
  }

  private createInsertedRow() {
    if (this.table === 'workspace_members') {
      return createMembership({
        ...(this.payload as Partial<WorkspaceMemberRow>),
        created_at: '2026-06-12T12:00:00.000Z',
      });
    }

    return this.payload;
  }

  private getFilteredRows() {
    return this.getRows().filter((row) =>
      this.filters.every((filter) => {
        const value = row[filter.column as keyof typeof row];

        if (filter.type === 'ilike') {
          return String(value).toLowerCase() === filter.value;
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

  return {
    calls,
    from: (table) => new FakeQuery(table, rows, calls),
  };
}

function createMembership(
  overrides: Partial<WorkspaceMemberRow> = {},
): WorkspaceMemberRow {
  return {
    workspace_id: workspaceId,
    user_id: memberId,
    role: 'member',
    created_at: '2026-06-07T00:00:00.000Z',
    ...overrides,
  };
}

function createProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: memberId,
    email: 'member@example.com',
    display_name: 'Мария',
    avatar_url: null,
    ...overrides,
  };
}

function findCall(calls: ClientCall[], table: TableName, method: string) {
  return calls.find((call) => call.table === table && call.method === method);
}
