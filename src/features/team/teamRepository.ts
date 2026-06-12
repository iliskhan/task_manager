import type {
  AddWorkspaceMemberErrorCode,
  AddWorkspaceMemberErrorResponse,
  AddWorkspaceMemberFunctionResponse,
  AddWorkspaceMemberInput,
  ProfileRow,
  TeamMember,
  WorkspaceMemberRow,
} from './teamTypes';

type TeamRepositoryClient = {
  from: (tableName: 'workspace_members' | 'profiles') => any;
  functions: {
    invoke: (
      functionName: 'add-workspace-member',
      options: { body: { workspaceId: string; email: string; role: 'member' } },
    ) => Promise<{
      data: AddWorkspaceMemberFunctionResponse | null;
      error: unknown;
    }>;
  };
};

type SupabaseResponse<T> = {
  data: T;
  error: Error | null;
};

const addMemberMessages: Record<AddWorkspaceMemberErrorCode, string> = {
  unauthenticated: 'Войдите, чтобы добавить участника.',
  not_owner: 'Добавлять участников может только владелец.',
  invalid_email: 'Введите корректный email.',
  invalid_role: 'В MVP можно добавлять только участников.',
  user_not_found: 'Пользователь с таким email не найден.',
  already_member: 'Пользователь уже состоит в команде.',
  internal_error: 'Не удалось добавить участника.',
};

export class AddWorkspaceMemberError extends Error {
  constructor(
    public readonly code: AddWorkspaceMemberErrorCode,
    message = addMemberMessages[code],
  ) {
    super(message);
    this.name = 'AddWorkspaceMemberError';
  }
}

export async function loadWorkspaceMembers(
  client: TeamRepositoryClient,
  workspaceId: string,
): Promise<TeamMember[]> {
  const membershipsResponse = await client
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });
  const memberships = getDataOrThrow<WorkspaceMemberRow[]>(membershipsResponse);

  if (memberships.length === 0) {
    return [];
  }

  const memberIds = memberships.map((membership) => membership.user_id);
  const profilesResponse = await client
    .from('profiles')
    .select('*')
    .in('id', memberIds);
  const profiles = getDataOrThrow<ProfileRow[]>(profilesResponse);
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return memberships
    .map((membership) => mapTeamMember(membership, profilesById.get(membership.user_id)))
    .filter((member): member is TeamMember => Boolean(member))
    .sort(compareMembers);
}

export async function addWorkspaceMember(
  client: TeamRepositoryClient,
  input: AddWorkspaceMemberInput,
): Promise<TeamMember> {
  const response = await client.functions.invoke('add-workspace-member', {
    body: {
      workspaceId: input.workspaceId,
      email: input.email.trim().toLowerCase(),
      role: 'member',
    },
  });

  if (response.error) {
    throw await mapFunctionError(response.error);
  }

  if (!response.data?.member) {
    throw new AddWorkspaceMemberError('internal_error');
  }

  return response.data.member;
}

function mapTeamMember(
  membership: WorkspaceMemberRow,
  profile: ProfileRow | undefined,
): TeamMember | null {
  if (!profile) {
    return null;
  }

  return {
    userId: membership.user_id,
    email: profile.email,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    role: membership.role,
    createdAt: membership.created_at,
  };
}

function compareMembers(first: TeamMember, second: TeamMember) {
  if (first.role !== second.role) {
    return first.role === 'owner' ? -1 : 1;
  }

  return first.createdAt.localeCompare(second.createdAt);
}

async function mapFunctionError(error: unknown) {
  const body = await readFunctionErrorBody(error);

  if (body && isAddMemberErrorCode(body.code)) {
    return new AddWorkspaceMemberError(body.code);
  }

  return new AddWorkspaceMemberError('internal_error');
}

async function readFunctionErrorBody(error: unknown) {
  const context = (error as { context?: { json?: () => Promise<unknown> } })?.context;

  if (!context?.json) {
    return null;
  }

  try {
    return (await context.json()) as Partial<AddWorkspaceMemberErrorResponse>;
  } catch {
    return null;
  }
}

function isAddMemberErrorCode(code: unknown): code is AddWorkspaceMemberErrorCode {
  return typeof code === 'string' && code in addMemberMessages;
}

function getDataOrThrow<T>(response: SupabaseResponse<T>) {
  if (response.error) {
    throw response.error;
  }

  return response.data;
}
