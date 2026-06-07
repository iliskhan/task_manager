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
  client?: AuthClient;
  bootstrapAuthWorkspace?: (
    client: AuthClient,
    user: User,
  ) => Promise<AuthWorkspaceState>;
};

const initialState: AuthState = {
  status: 'loading',
  session: null,
  user: null,
  workspaceState: null,
  error: null,
};

export function AuthProvider({
  children,
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
        const workspaceState = await bootstrapAuthWorkspace(client, nextSession.user);

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
    [bootstrapAuthWorkspace, client],
  );

  useEffect(() => {
    mountedRef.current = true;

    void client.auth.getSession().then(({ data, error }) => {
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
  }, [applySession, client]);

  const signIn = useCallback(
    async (credentials: AuthCredentials) => {
      const { data, error } = await client.auth.signInWithPassword(credentials);

      if (error) {
        throw error;
      }

      await applySession(data.session);
    },
    [applySession, client],
  );

  const signUp = useCallback(
    async (credentials: AuthCredentials) => {
      const { data, error } = await client.auth.signUp(credentials);

      if (error) {
        throw error;
      }

      await applySession(data.session);
    },
    [applySession, client],
  );

  const signOut = useCallback(async () => {
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }

    await applySession(null);
  }, [applySession, client]);

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
