import { describe, expect, test } from 'vitest';
import { readAddWorkspaceMemberEnv } from './env';

describe('readAddWorkspaceMemberEnv', () => {
  const localServiceRoleKeyName = [
    'TASK_MANAGER',
    'SUPABASE',
    'SERVICE',
    'ROLE',
    'KEY',
  ].join('_');

  test('reads deployed Supabase Edge Function environment names', () => {
    const env = readAddWorkspaceMemberEnv(
      createEnvReader({
        SUPABASE_URL: 'http://127.0.0.1:54321',
        SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: 'publishable-key' }),
        SUPABASE_SECRET_KEYS: JSON.stringify({ default: 'secret-key' }),
      }),
    );

    expect(env).toEqual({
      supabaseUrl: 'http://127.0.0.1:54321',
      publishableKey: 'publishable-key',
      secretKey: 'secret-key',
    });
  });

  test('falls back to local task manager env names for functions serve', () => {
    const env = readAddWorkspaceMemberEnv(
      createEnvReader({
        TASK_MANAGER_SUPABASE_URL: 'http://127.0.0.1:54321',
        TASK_MANAGER_SUPABASE_ANON_KEY: 'local-anon-key',
        [localServiceRoleKeyName]: 'local-service-key',
      }),
    );

    expect(env).toEqual({
      supabaseUrl: 'http://127.0.0.1:54321',
      publishableKey: 'local-anon-key',
      secretKey: 'local-service-key',
    });
  });

  test('throws a non-secret configuration error when required values are missing', () => {
    expect(() =>
      readAddWorkspaceMemberEnv(
        createEnvReader({
          TASK_MANAGER_SUPABASE_URL: 'http://127.0.0.1:54321',
          TASK_MANAGER_SUPABASE_ANON_KEY: 'local-anon-key',
        }),
      ),
    ).toThrow('Missing add-workspace-member Supabase configuration: secretKey');
  });
});

function createEnvReader(values: Record<string, string>) {
  return (name: string) => values[name] ?? null;
}
