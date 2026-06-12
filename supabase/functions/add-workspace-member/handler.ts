export type AddWorkspaceMemberRole = 'member';

export type AddWorkspaceMemberErrorCode =
  | 'unauthenticated'
  | 'not_owner'
  | 'invalid_email'
  | 'invalid_role'
  | 'user_not_found'
  | 'already_member'
  | 'internal_error';

export type AddWorkspaceMemberRequest = {
  workspaceId: string;
  email: string;
  role: AddWorkspaceMemberRole;
};

export type AddWorkspaceMemberResponse = {
  member: {
    userId: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: AddWorkspaceMemberRole;
    createdAt: string;
  };
};

export type AddWorkspaceMemberErrorResponse = {
  code: AddWorkspaceMemberErrorCode;
  message: string;
};

export type HandlerResult =
  | { status: 200; body: AddWorkspaceMemberResponse }
  | { status: number; body: AddWorkspaceMemberErrorResponse };

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

type SupabaseResponse<T> = {
  data: T;
  error: { message?: string; code?: string } | null;
};

type AddWorkspaceMemberClient = {
  from: (tableName: 'workspace_members' | 'profiles' | 'activity_events') => any;
};

type ParseResult =
  | { ok: true; value: AddWorkspaceMemberRequest }
  | { ok: false; error: AddWorkspaceMemberErrorResponse & { status: number } };

type HandleAddWorkspaceMemberInput = {
  callerUserId: string | null;
  client: AddWorkspaceMemberClient;
  visibleClient?: AddWorkspaceMemberClient;
  body: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseAddWorkspaceMemberRequest(body: unknown): ParseResult {
  if (!body || typeof body !== 'object') {
    return validationError('internal_error', 'Некорректный запрос.');
  }

  const workspaceId = (body as Record<string, unknown>).workspaceId;
  const email = (body as Record<string, unknown>).email;
  const role = (body as Record<string, unknown>).role;

  if (typeof workspaceId !== 'string' || !uuidPattern.test(workspaceId)) {
    return validationError('internal_error', 'Некорректный идентификатор пространства.');
  }

  if (role !== 'member') {
    return validationError('invalid_role', 'В MVP можно добавлять только участников.');
  }

  if (typeof email !== 'string') {
    return validationError('invalid_email', 'Введите корректный email.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!emailPattern.test(normalizedEmail)) {
    return validationError('invalid_email', 'Введите корректный email.');
  }

  return {
    ok: true,
    value: {
      workspaceId,
      email: normalizedEmail,
      role,
    },
  };
}

export async function handleAddWorkspaceMember({
  callerUserId,
  client,
  visibleClient,
  body,
}: HandleAddWorkspaceMemberInput): Promise<HandlerResult> {
  if (!callerUserId) {
    return errorResult(401, 'unauthenticated', 'Войдите, чтобы добавить участника.');
  }

  const parsed = parseAddWorkspaceMemberRequest(body);

  if (!parsed.ok) {
    return {
      status: parsed.error.status,
      body: {
        code: parsed.error.code,
        message: parsed.error.message,
      },
    };
  }

  const callerVisibleClient = visibleClient ?? client;
  const ownerResponse = await callerVisibleClient
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', parsed.value.workspaceId)
    .eq('user_id', callerUserId)
    .maybeSingle();

  if (ownerResponse.error) {
    return internalError();
  }

  if ((ownerResponse as SupabaseResponse<WorkspaceMemberRow | null>).data?.role !== 'owner') {
    return errorResult(403, 'not_owner', 'Добавлять участников может только владелец.');
  }

  let profile: ProfileRow | null = null;

  if (visibleClient) {
    const visibleProfileResponse = await visibleClient
      .from('profiles')
      .select('id,email,display_name,avatar_url')
      .ilike('email', parsed.value.email)
      .maybeSingle();

    if (visibleProfileResponse.error) {
      return internalError();
    }

    const visibleProfile = (visibleProfileResponse as SupabaseResponse<ProfileRow | null>).data;

    if (visibleProfile) {
      const visibleExistingMemberResponse = await visibleClient
        .from('workspace_members')
        .select('user_id')
        .eq('workspace_id', parsed.value.workspaceId)
        .eq('user_id', visibleProfile.id)
        .maybeSingle();

      if (visibleExistingMemberResponse.error) {
        return internalError();
      }

      if ((visibleExistingMemberResponse as SupabaseResponse<WorkspaceMemberRow | null>).data) {
        return errorResult(409, 'already_member', 'Пользователь уже состоит в команде.');
      }

      profile = visibleProfile;
    }
  }

  if (!profile) {
    const profileResponse = await client
      .from('profiles')
      .select('id,email,display_name,avatar_url')
      .ilike('email', parsed.value.email)
      .maybeSingle();

    if (profileResponse.error) {
      return internalError();
    }

    profile = (profileResponse as SupabaseResponse<ProfileRow | null>).data;
  }

  if (!profile) {
    return errorResult(404, 'user_not_found', 'Пользователь с таким email не найден.');
  }

  const existingMemberResponse = await client
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', parsed.value.workspaceId)
    .eq('user_id', profile.id)
    .maybeSingle();

  if (existingMemberResponse.error) {
    return internalError();
  }

  if ((existingMemberResponse as SupabaseResponse<WorkspaceMemberRow | null>).data) {
    return errorResult(409, 'already_member', 'Пользователь уже состоит в команде.');
  }

  const membershipResponse = await client
    .from('workspace_members')
    .insert({
      workspace_id: parsed.value.workspaceId,
      user_id: profile.id,
      role: parsed.value.role,
    })
    .select('workspace_id,user_id,role,created_at')
    .single();

  if (membershipResponse.error) {
    if (isDuplicateError(membershipResponse.error)) {
      return errorResult(409, 'already_member', 'Пользователь уже состоит в команде.');
    }

    return internalError();
  }

  const membership = (membershipResponse as SupabaseResponse<WorkspaceMemberRow>).data;
  const activityResponse = await client.from('activity_events').insert({
    workspace_id: parsed.value.workspaceId,
    project_id: null,
    task_id: null,
    actor_id: callerUserId,
    event_type: 'member_added',
    payload: {
      memberUserId: profile.id,
      email: parsed.value.email,
      role: parsed.value.role,
    },
  });

  if (activityResponse.error) {
    return internalError();
  }

  return {
    status: 200,
    body: {
      member: {
        userId: profile.id,
        email: parsed.value.email,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        role: membership.role as AddWorkspaceMemberRole,
        createdAt: membership.created_at,
      },
    },
  };
}

function validationError(
  code: AddWorkspaceMemberErrorCode,
  message: string,
): ParseResult {
  return {
    ok: false,
    error: {
      status: 400,
      code,
      message,
    },
  };
}

function internalError(): HandlerResult {
  return errorResult(500, 'internal_error', 'Не удалось добавить участника.');
}

function errorResult(
  status: number,
  code: AddWorkspaceMemberErrorCode,
  message: string,
): HandlerResult {
  return {
    status,
    body: {
      code,
      message,
    },
  };
}

function isDuplicateError(error: { message?: string; code?: string }) {
  return error.code === '23505' || error.message?.toLowerCase().includes('duplicate');
}
