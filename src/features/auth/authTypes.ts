import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type {
  AuthRole,
  AuthWorkspaceState,
} from '../../lib/supabase/authBootstrap';

export type AuthStatus =
  | 'loading'
  | 'authenticated'
  | 'unauthenticated'
  | 'error';

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: AuthWorkspaceState['profile'] | null;
  workspace: AuthWorkspaceState['workspace'] | null;
  role: AuthRole | null;
  error: Error | null;
  signIn: (credentials: AuthCredentials) => Promise<void>;
  signUp: (credentials: AuthCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  refreshWorkspace: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
