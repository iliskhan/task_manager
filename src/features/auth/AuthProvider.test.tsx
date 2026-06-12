import type { Session, User } from '@supabase/supabase-js';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

const user = {
  id: 'user-1',
  email: 'owner@example.com',
  user_metadata: { display_name: 'Alexey' },
} as unknown as User;

const session = {
  access_token: 'access-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user,
} as Session;

const profile = {
  id: user.id,
  email: user.email,
  display_name: 'Alexey',
  avatar_url: null,
  created_at: '2026-06-07T00:00:00.000Z',
  updated_at: '2026-06-07T00:00:00.000Z',
};

const workspace = {
  id: 'workspace-1',
  name: 'Команда owner',
  created_by: user.id,
  created_at: '2026-06-07T00:00:00.000Z',
  updated_at: '2026-06-07T00:00:00.000Z',
};

describe('AuthProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test('exposes loading while the initial session request is pending', () => {
    const client = createAuthClient({
      getSession: () => new Promise(() => undefined),
    });

    renderAuthProvider(client);

    expect(screen.getByText('loading')).toBeVisible();
  });

  test('exposes an error when the initial session request times out', async () => {
    vi.useFakeTimers();
    const client = createAuthClient({
      getSession: () => new Promise(() => undefined),
    });

    renderAuthProvider(client, vi.fn(), { authRequestTimeoutMs: 50 });

    expect(screen.getByText('loading')).toBeVisible();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(screen.getByText('error')).toBeVisible();
  });

  test('exposes an error when workspace bootstrap times out', async () => {
    vi.useFakeTimers();
    const client = createAuthClient({
      getSession: async () => ({ data: { session }, error: null }),
    });
    const bootstrap = vi.fn(() => new Promise(() => undefined));

    renderAuthProvider(client, bootstrap, { authRequestTimeoutMs: 50 });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(screen.getByText('error')).toBeVisible();
    expect(bootstrap).toHaveBeenCalledWith(client, user);
  });

  test('exposes unauthenticated when Supabase has no session', async () => {
    const client = createAuthClient({
      getSession: async () => ({ data: { session: null }, error: null }),
    });

    renderAuthProvider(client);

    expect(await screen.findByText('unauthenticated')).toBeVisible();
  });

  test('bootstraps profile and workspace for an existing signed-in session', async () => {
    const client = createAuthClient({
      getSession: async () => ({ data: { session }, error: null }),
    });
    const bootstrap = vi.fn().mockResolvedValue({
      profile,
      workspace,
      role: 'owner',
    });

    renderAuthProvider(client, bootstrap);

    expect(await screen.findByText('authenticated')).toBeVisible();
    expect(screen.getByText('owner@example.com')).toBeVisible();
    expect(screen.getByText('Команда owner')).toBeVisible();
    expect(bootstrap).toHaveBeenCalledWith(client, user);
  });
});

function AuthStateProbe() {
  const auth = useAuth();

  return (
    <div>
      <span>{auth.status}</span>
      <span>{auth.profile?.email}</span>
      <span>{auth.workspace?.name}</span>
    </div>
  );
}

function renderAuthProvider(
  client: ReturnType<typeof createAuthClient>,
  bootstrap = vi.fn(),
  options: Partial<Parameters<typeof AuthProvider>[0]> = {},
) {
  return render(
    <AuthProvider
      authRequestTimeoutMs={options.authRequestTimeoutMs}
      bootstrapAuthWorkspace={bootstrap}
      client={client}
    >
      <AuthStateProbe />
    </AuthProvider>,
  );
}

function createAuthClient(overrides: {
  getSession: () => Promise<{ data: { session: Session | null }; error: Error | null }>;
}) {
  return {
    from: vi.fn(),
    auth: {
      getSession: overrides.getSession,
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  };
}
