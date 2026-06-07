import { expect, test } from '@playwright/test';

test('renders the projects screen and sidebar navigation', async ({ page }) => {
  await page.goto('/app/projects');

  await expect(page.getByRole('heading', { name: 'Мои задачи' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Календарь/i })).toBeVisible();
});

test('renders the project detail placeholder', async ({ page }) => {
  await page.goto('/app/projects/demo');

  await expect(page.getByRole('heading', { name: 'Бизнес' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Задачи' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Обзор' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Статистика' })).toBeVisible();
});
