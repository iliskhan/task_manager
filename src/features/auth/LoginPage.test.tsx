import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from './authTypes';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  test('renders the sign-in form by default', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: 'Вход' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeVisible();
  });

  test('switches to sign-up mode without leaving the login route', async () => {
    renderLoginPage();

    await userEvent.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));

    expect(screen.getByRole('heading', { name: 'Регистрация' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Создать аккаунт' })).toBeVisible();
  });

  test('shows validation feedback for an invalid email', async () => {
    renderLoginPage();

    await userEvent.type(screen.getByLabelText('Email'), 'not-email');
    await userEvent.type(screen.getByLabelText('Пароль'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Введите корректный email')).toBeVisible();
  });

  test('calls signIn with valid credentials', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    renderLoginPage({ signIn });

    await userEvent.type(screen.getByLabelText('Email'), 'Owner@Example.com ');
    await userEvent.type(screen.getByLabelText('Пароль'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(signIn).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'password123',
    });
  });
});

function renderLoginPage(overrides: Partial<AuthContextValue> = {}) {
  return render(
    <AuthContext.Provider value={createAuthValue(overrides)}>
      <LoginPage />
    </AuthContext.Provider>,
  );
}

function createAuthValue(
  overrides: Partial<AuthContextValue>,
): AuthContextValue {
  return {
    status: 'unauthenticated',
    session: null,
    user: null,
    profile: null,
    workspace: null,
    role: null,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshWorkspace: vi.fn(),
    ...overrides,
  };
}
