import type { Tables } from '../../lib/supabase/database.types';

export type WorkspaceMemberRow = Tables<'workspace_members'>;
export type ProfileRow = Tables<'profiles'>;
export type TeamRole = WorkspaceMemberRow['role'];

export type TeamMember = {
  userId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: TeamRole;
  createdAt: string;
};

export type AddWorkspaceMemberInput = {
  workspaceId: string;
  email: string;
};

export type AddWorkspaceMemberFunctionResponse = {
  member: TeamMember;
};

export type AddWorkspaceMemberErrorCode =
  | 'unauthenticated'
  | 'not_owner'
  | 'invalid_email'
  | 'invalid_role'
  | 'user_not_found'
  | 'already_member'
  | 'internal_error';

export type AddWorkspaceMemberErrorResponse = {
  code: AddWorkspaceMemberErrorCode;
  message: string;
};
