import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import {
  ensureAuthWorkspace,
  type AuthWorkspaceState,
} from '../../lib/supabase/authBootstrap';
import { supabase } from '../../lib/supabase/client';
import {
  AuthContext,
  type AuthContextValue,
  type AuthCredentials,
  type AuthStatus,
} from './authTypes';

type AuthSessionResponse = Promise<{
  data: { session: Session | null; user?: User | null };
  error: Error | null;
}>;

type AuthClient = {
  from: (tableName: 'profiles' | 'workspace_members' | 'workspaces') => any;
  auth: {
    getSession: () => AuthSessionResponse;
    onAuthStateChange: (
      callback: (event: AuthChangeEvent, session: Session | null) => void,
    ) => { data: { subscription: { unsubscribe: () => void } } };
    signInWithPassword: (credentials: AuthCredentials) => AuthSessionResponse;
    signUp: (credentials: AuthCredentials) => AuthSessionResponse;
    signOut: () => Promise<{ error: Error | null }>;
  };
};

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  workspaceState: AuthWorkspaceState | null;
  error: Error | null;
};

type AuthProviderProps = {
  children: ReactNode;
  authRequestTimeoutMs?: number;
  client?: AuthClient;
  bootstrapAuthWorkspace?: (
    client: AuthClient,
    user: User,
  ) => Promise<AuthWorkspaceState>;
};

const DEFAULT_AUTH_REQUEST_TIMEOUT_MS = 8_000;
const AUTH_REQUEST_TIMEOUT_ERROR_MESSAGE = 'Supabase request timed out.';

const initialState: AuthState = {
  status: 'loading',
  session: null,
  user: null,
  workspaceState: null,
  error: null,
};

export function AuthProvider({
  children,
  authRequestTimeoutMs = DEFAULT_AUTH_REQUEST_TIMEOUT_MS,
  client = supabase,
  bootstrapAuthWorkspace = ensureAuthWorkspace,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);

  const applySession = useCallback(
    async (nextSession: Session | null) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (!mountedRef.current) {
        return;
      }

      if (!nextSession) {
        setState({
          status: 'unauthenticated',
          session: null,
          user: null,
          workspaceState: null,
          error: null,
        });
        return;
      }

      setState((current) => ({
        ...current,
        status: 'loading',
        session: nextSession,
        user: nextSession.user,
        error: null,
      }));

      try {
        const workspaceState = await withTimeout(
          bootstrapAuthWorkspace(client, nextSession.user),
          authRequestTimeoutMs,
          AUTH_REQUEST_TIMEOUT_ERROR_MESSAGE,
        );

        if (!mountedRef.current || requestIdRef.current !== requestId) {
          return;
        }

        setState({
          status: 'authenticated',
          session: nextSession,
          user: nextSession.user,
          workspaceState,
          error: null,
        });
      } catch (error) {
        if (!mountedRef.current || requestIdRef.current !== requestId) {
          return;
        }

        setState({
          status: 'error',
          session: nextSession,
          user: nextSession.user,
          workspaceState: null,
          error: error instanceof Error ? error : new Error('Auth bootstrap failed.'),
        });
      }
    },
    [authRequestTimeoutMs, bootstrapAuthWorkspace, client],
  );

  useEffect(() => {
    mountedRef.current = true;

    void withTimeout(
      client.auth.getSession(),
      authRequestTimeoutMs,
      AUTH_REQUEST_TIMEOUT_ERROR_MESSAGE,
    )
      .then(({ data, error }) => {
        if (!mountedRef.current) {
          return;
        }

        if (error) {
          setState({
            status: 'error',
            session: null,
            user: null,
            workspaceState: null,
            error,
          });
          return;
        }

        void applySession(data.session);
      })
      .catch((error) => {
        if (!mountedRef.current) {
          return;
        }

        setState({
          status: 'error',
          session: null,
          user: null,
          workspaceState: null,
          error: normalizeError(error),
        });
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [applySession, authRequestTimeoutMs, client]);

  const signIn = useCallback(
    async (credentials: AuthCredentials) => {
      const { data, error } = await withTimeout(
        client.auth.signInWithPassword(credentials),
        authRequestTimeoutMs,
        AUTH_REQUEST_TIMEOUT_ERROR_MESSAGE,
      );

      if (error) {
        throw error;
      }

      await applySession(data.session);
    },
    [applySession, authRequestTimeoutMs, client],
  );

  const signUp = useCallback(
    async (credentials: AuthCredentials) => {
      const { data, error } = await withTimeout(
        client.auth.signUp(credentials),
        authRequestTimeoutMs,
        AUTH_REQUEST_TIMEOUT_ERROR_MESSAGE,
      );

      if (error) {
        throw error;
      }

      await applySession(data.session);
    },
    [applySession, authRequestTimeoutMs, client],
  );

  const signOut = useCallback(async () => {
    const { error } = await withTimeout(
      client.auth.signOut(),
      authRequestTimeoutMs,
      AUTH_REQUEST_TIMEOUT_ERROR_MESSAGE,
    );

    if (error) {
      throw error;
    }

    await applySession(null);
  }, [applySession, authRequestTimeoutMs, client]);

  const refreshWorkspace = useCallback(async () => {
    if (state.session) {
      await applySession(state.session);
    }
  }, [applySession, state.session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: state.status,
      session: state.session,
      user: state.user,
      profile: state.workspaceState?.profile ?? null,
      workspace: state.workspaceState?.workspace ?? null,
      role: state.workspaceState?.role ?? null,
      error: state.error,
      signIn,
      signUp,
      signOut,
      refreshWorkspace,
    }),
    [
      refreshWorkspace,
      signIn,
      signOut,
      signUp,
      state.error,
      state.session,
      state.status,
      state.user,
      state.workspaceState,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function withTimeout<T>(
  request: PromiseLike<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    Promise.resolve(request).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error : new Error('Auth request failed.');
}
