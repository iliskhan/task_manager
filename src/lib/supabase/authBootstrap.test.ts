import type { User } from '@supabase/supabase-js';
import { describe, expect, test } from 'vitest';
import { ensureAuthWorkspace } from './authBootstrap';

type Row = Record<string, unknown>;

const profile = {
  id: 'user-1',
  email: 'owner@example.com',
  display_name: 'Alexey',
  avatar_url: null,
  created_at: '2026-06-07T00:00:00.000Z',
  updated_at: '2026-06-07T00:00:00.000Z',
};

const workspace = {
  id: 'workspace-1',
  name: 'Team',
  created_by: 'user-1',
  created_at: '2026-06-07T00:00:00.000Z',
  updated_at: '2026-06-07T00:00:00.000Z',
};

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  user_metadata: { display_name: 'Alexey' },
} as unknown as User;

describe('ensureAuthWorkspace', () => {
  test('returns the existing profile and workspace without creating a workspace', async () => {
    const client = createFakeSupabaseClient({
      profiles: [profile],
      workspace_members: [
        {
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
          created_at: '2026-06-07T00:00:00.000Z',
        },
      ],
      workspaces: [workspace],
    });

    const result = await ensureAuthWorkspace(client, user);

    expect(result).toEqual({ profile, workspace, role: 'owner' });
    expect(client.inserted.workspaces).toEqual([]);
    expect(client.inserted.workspace_members).toEqual([]);
  });

  test('creates a profile, workspace, and owner membership for a new authenticated user', async () => {
    const client = createFakeSupabaseClient({
      profiles: [],
      workspace_members: [],
      workspaces: [],
    });

    const result = await ensureAuthWorkspace(client, user, {
      createWorkspaceId: () => 'workspace-new',
    });

    expect(client.inserted.profiles).toEqual([
      expect.objectContaining({
        id: user.id,
        email: user.email,
        display_name: 'Alexey',
      }),
    ]);
    expect(client.inserted.workspaces).toEqual([
      {
        id: 'workspace-new',
        name: 'Команда owner',
        created_by: user.id,
      },
    ]);
    expect(client.inserted.workspace_members).toEqual([
      {
        workspace_id: 'workspace-new',
        user_id: user.id,
        role: 'owner',
      },
    ]);
    expect(result.workspace.id).toBe('workspace-new');
    expect(result.role).toBe('owner');
  });

  test('throws a user-visible bootstrap error when the database request fails', async () => {
    const client = createFakeSupabaseClient({
      profiles: [],
      workspace_members: [],
      workspaces: [],
      errors: { profiles: new Error('database unavailable') },
    });

    await expect(ensureAuthWorkspace(client, user)).rejects.toThrow(
      'Не удалось подготовить рабочее пространство. Попробуйте еще раз.',
    );
  });
});

function createFakeSupabaseClient(seed: {
  profiles: Row[];
  workspace_members: Row[];
  workspaces: Row[];
  errors?: Partial<Record<string, Error>>;
}) {
  const tables = {
    profiles: [...seed.profiles],
    workspace_members: [...seed.workspace_members],
    workspaces: [...seed.workspaces],
  };
  const inserted = {
    profiles: [] as Row[],
    workspace_members: [] as Row[],
    workspaces: [] as Row[],
  };

  return {
    inserted,
    from(tableName: keyof typeof tables) {
      return createQueryBuilder(tableName, tables, inserted, seed.errors);
    },
  };
}

function createQueryBuilder(
  tableName: 'profiles' | 'workspace_members' | 'workspaces',
  tables: Record<'profiles' | 'workspace_members' | 'workspaces', Row[]>,
  inserted: Record<'profiles' | 'workspace_members' | 'workspaces', Row[]>,
  errors?: Partial<Record<string, Error>>,
) {
  const filters: Array<{ column: string; value: unknown }> = [];

  const builder = {
    select() {
      return builder;
    },
    eq(column: string, value: unknown) {
      filters.push({ column, value });
      return builder;
    },
    order() {
      return builder;
    },
    limit() {
      return builder;
    },
    async maybeSingle() {
      if (errors?.[tableName]) {
        return { data: null, error: errors[tableName] };
      }

      return { data: findRows(tables[tableName], filters)[0] ?? null, error: null };
    },
    async single() {
      if (errors?.[tableName]) {
        return { data: null, error: errors[tableName] };
      }

      return { data: findRows(tables[tableName], filters)[0] ?? null, error: null };
    },
    async insert(value: Row) {
      if (errors?.[tableName]) {
        return { data: null, error: errors[tableName] };
      }

      tables[tableName].push(value);
      inserted[tableName].push(value);

      return { data: null, error: null };
    },
    async update(value: Row) {
      if (errors?.[tableName]) {
        return { data: null, error: errors[tableName] };
      }

      const row = findRows(tables[tableName], filters)[0];
      if (row) {
        Object.assign(row, value);
      }

      return { data: null, error: null };
    },
  };

  return builder;
}

function findRows(rows: Row[], filters: Array<{ column: string; value: unknown }>) {
  return rows.filter((row) =>
    filters.every((filter) => row[filter.column] === filter.value),
  );
}
