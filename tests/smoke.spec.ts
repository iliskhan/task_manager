import { expect, type Page, test } from '@playwright/test';

test('signs in with the seeded owner and logs out', async ({ page }) => {
  await signInAsSeededOwner(page);

  await page.getByRole('button', { name: 'Выйти' }).click();

  await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
});

test('renders the projects screen and sidebar navigation', async ({ page }) => {
  await signInAsSeededOwner(page);

  await expect(page.getByRole('heading', { name: 'Мои задачи' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Календарь/i })).toBeVisible();
});

test('renders the project detail placeholder', async ({ page }) => {
  await signInAsSeededOwner(page);
  await page.goto('/app/projects/demo');

  await expect(page.getByRole('heading', { name: 'Бизнес' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Задачи' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Обзор' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Статистика' })).toBeVisible();
});

async function signInAsSeededOwner(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('owner@example.com');
  await page.getByLabel('Пароль').fill('password123');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page.getByRole('heading', { name: 'Мои задачи' })).toBeVisible();
}
