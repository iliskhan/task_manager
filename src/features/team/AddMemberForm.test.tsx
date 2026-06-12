import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { appTheme } from '../../app/theme/theme';
import { AddMemberForm } from './AddMemberForm';

describe('AddMemberForm', () => {
  test('shows validation feedback for invalid email', async () => {
    const user = userEvent.setup();
    renderAddMemberForm();

    await user.type(screen.getByLabelText('Email участника'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Добавить участника' }));

    expect(screen.getByText('Введите корректный email.')).toBeVisible();
  });

  test('submits normalized email', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderAddMemberForm({ onSubmit });

    await user.type(screen.getByLabelText('Email участника'), '  MEMBER@Example.COM ');
    await user.click(screen.getByRole('button', { name: 'Добавить участника' }));

    expect(onSubmit).toHaveBeenCalledWith('member@example.com');
  });

  test('does not rethrow submit errors handled by the parent mutation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('already member'));
    renderAddMemberForm({ onSubmit });

    await user.type(screen.getByRole('textbox', { name: /Email/i }), 'member@example.com');
    await expect(
      user.click(screen.getByRole('button')),
    ).resolves.toBeUndefined();

    expect(onSubmit).toHaveBeenCalledWith('member@example.com');
  });
});

function renderAddMemberForm(
  overrides: Partial<ComponentProps<typeof AddMemberForm>> = {},
) {
  return render(
    <ThemeProvider theme={appTheme}>
      <AddMemberForm
        isSubmitting={false}
        error={null}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        {...overrides}
      />
    </ThemeProvider>,
  );
}
