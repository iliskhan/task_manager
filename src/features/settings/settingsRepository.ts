import { supabase } from '../../lib/supabase/client';

type SettingsRepositoryClient = {
  from: (tableName: 'profiles' | 'workspaces') => any;
};

type SupabaseResponse<T> = {
  data: T;
  error: Error | null;
};

export type UpdateProfileNameInput = {
  userId: string;
  displayName: string;
};

export type UpdateWorkspaceNameInput = {
  workspaceId: string;
  name: string;
};

export async function updateProfileName(
  client: SettingsRepositoryClient,
  input: UpdateProfileNameInput,
) {
  const response = await client
    .from('profiles')
    .update({ display_name: input.displayName })
    .eq('id', input.userId)
    .select('id')
    .single();

  return getDataOrThrow<{ id: string }>(response);
}

export async function updateWorkspaceName(
  client: SettingsRepositoryClient,
  input: UpdateWorkspaceNameInput,
) {
  const response = await client
    .from('workspaces')
    .update({ name: input.name })
    .eq('id', input.workspaceId)
    .select('id')
    .single();

  return getDataOrThrow<{ id: string }>(response);
}

export async function updateOwnProfileName(userId: string, displayName: string) {
  return updateProfileName(supabase, {
    userId,
    displayName,
  });
}

export async function updateCurrentWorkspaceName(workspaceId: string, name: string) {
  return updateWorkspaceName(supabase, {
    workspaceId,
    name,
  });
}

function getDataOrThrow<T>(response: SupabaseResponse<T>) {
  if (response.error) {
    throw response.error;
  }

  return response.data;
}
