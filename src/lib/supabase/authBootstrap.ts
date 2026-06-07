import type { User } from '@supabase/supabase-js';
import type { Tables } from './database.types';

export type AuthRole = 'owner' | 'member';

export type AuthWorkspaceState = {
  profile: Tables<'profiles'>;
  workspace: Tables<'workspaces'>;
  role: AuthRole;
};

type BootstrapClient = {
  from: (tableName: 'profiles' | 'workspace_members' | 'workspaces') => any;
};

type EnsureAuthWorkspaceOptions = {
  createWorkspaceId?: () => string;
};

const BOOTSTRAP_ERROR_MESSAGE =
  'Не удалось подготовить рабочее пространство. Попробуйте еще раз.';

export async function ensureAuthWorkspace(
  supabaseClient: BootstrapClient,
  user: User,
  options: EnsureAuthWorkspaceOptions = {},
): Promise<AuthWorkspaceState> {
  try {
    const email = normalizeUserEmail(user);
    const profile = await ensureProfile(supabaseClient, user, email);
    const existingMembership = await getExistingMembership(supabaseClient, user.id);

    if (existingMembership) {
      return {
        profile,
        workspace: await getWorkspace(supabaseClient, existingMembership.workspace_id),
        role: normalizeRole(existingMembership.role),
      };
    }

    const workspaceId = options.createWorkspaceId?.() ?? crypto.randomUUID();

    await insertOrThrow(
      supabaseClient.from('workspaces').insert({
        id: workspaceId,
        name: `Команда ${getEmailPrefix(email)}`,
        created_by: user.id,
      }),
    );
    await insertOrThrow(
      supabaseClient.from('workspace_members').insert({
        workspace_id: workspaceId,
        user_id: user.id,
        role: 'owner',
      }),
    );

    return {
      profile,
      workspace: await getWorkspace(supabaseClient, workspaceId),
      role: 'owner',
    };
  } catch (error) {
    throw createBootstrapError(error);
  }
}

async function ensureProfile(
  supabaseClient: BootstrapClient,
  user: User,
  email: string,
) {
  const { data: existingProfile, error: readError } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  throwIfSupabaseError(readError);

  if (existingProfile) {
    if (existingProfile.email !== email) {
      await insertOrThrow(
        supabaseClient.from('profiles').update({ email }).eq('id', user.id),
      );
      return { ...existingProfile, email } as Tables<'profiles'>;
    }

    return existingProfile as Tables<'profiles'>;
  }

  const profileInsert = {
    id: user.id,
    email,
    display_name: getDisplayName(user),
    avatar_url: null,
  };

  await insertOrThrow(supabaseClient.from('profiles').insert(profileInsert));

  return {
    ...profileInsert,
    created_at: '',
    updated_at: '',
  } as Tables<'profiles'>;
}

async function getExistingMembership(supabaseClient: BootstrapClient, userId: string) {
  const { data, error } = await supabaseClient
    .from('workspace_members')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  throwIfSupabaseError(error);

  return data as Tables<'workspace_members'> | null;
}

async function getWorkspace(supabaseClient: BootstrapClient, workspaceId: string) {
  const { data, error } = await supabaseClient
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  throwIfSupabaseError(error);

  if (!data) {
    throw new Error('Workspace not found after bootstrap.');
  }

  return data as Tables<'workspaces'>;
}

async function insertOrThrow(request: PromiseLike<{ error: Error | null }>) {
  const { error } = await request;
  throwIfSupabaseError(error);
}

function throwIfSupabaseError(error: Error | null | undefined) {
  if (error) {
    throw error;
  }
}

function normalizeUserEmail(user: User) {
  const email = user.email?.trim().toLowerCase();

  if (!email) {
    throw new Error('Authenticated user email is missing.');
  }

  return email;
}

function getEmailPrefix(email: string) {
  return email.split('@')[0] || 'team';
}

function getDisplayName(user: User) {
  const displayName = user.user_metadata?.display_name;

  return typeof displayName === 'string' && displayName.trim()
    ? displayName.trim()
    : null;
}

function normalizeRole(role: string): AuthRole {
  return role === 'owner' ? 'owner' : 'member';
}

function createBootstrapError(cause: unknown) {
  const error = new Error(BOOTSTRAP_ERROR_MESSAGE);
  Object.defineProperty(error, 'cause', {
    value: cause,
    configurable: true,
  });

  return error;
}
