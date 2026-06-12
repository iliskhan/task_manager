import type { TeamMember, TeamRole } from './teamTypes';

export function formatTeamRole(role: TeamRole) {
  return role === 'owner' ? 'Владелец' : 'Участник';
}

export function formatMemberName(member: Pick<TeamMember, 'displayName' | 'email'>) {
  return member.displayName?.trim() || member.email;
}

export function formatMemberJoinedAt(createdAt: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(createdAt));
}
