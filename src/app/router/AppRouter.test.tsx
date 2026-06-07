import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import App from '../../App';

describe('AppRouter', () => {
  test('redirects / to the projects page', async () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Мои задачи' }),
    ).toBeVisible();
  });

  test('navigates to calendar from the sidebar', async () => {
    window.history.pushState({}, '', '/app/projects');

    render(<App />);
    await userEvent.click(screen.getByRole('link', { name: /Календарь/i }));

    expect(
      await screen.findByRole('heading', { name: 'Календарь' }),
    ).toBeVisible();
  });

  test('navigates to statistics from the sidebar', async () => {
    window.history.pushState({}, '', '/app/projects');

    render(<App />);
    await userEvent.click(screen.getByRole('link', { name: /Статистика/i }));

    expect(
      await screen.findByRole('heading', { name: 'Статистика' }),
    ).toBeVisible();
  });
});
