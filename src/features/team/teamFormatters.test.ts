import { describe, expect, test } from 'vitest';
import {
  formatMemberJoinedAt,
  formatMemberName,
  formatTeamRole,
} from './teamFormatters';

describe('teamFormatters', () => {
  test('formats owner and member roles', () => {
    expect(formatTeamRole('owner')).toBe('Владелец');
    expect(formatTeamRole('member')).toBe('Участник');
  });

  test('uses display name before email and falls back to email', () => {
    expect(
      formatMemberName({
        displayName: 'Мария',
        email: 'member@example.com',
      }),
    ).toBe('Мария');
    expect(
      formatMemberName({
        displayName: null,
        email: 'member@example.com',
      }),
    ).toBe('member@example.com');
  });

  test('formats joined date in Russian locale', () => {
    expect(formatMemberJoinedAt('2026-06-12T12:00:00.000Z')).toBe(
      '12 июн. 2026 г.',
    );
  });
});
