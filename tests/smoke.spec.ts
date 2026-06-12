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

test('creates a project from the projects screen', async ({ page }) => {
  const projectName = `Smoke ${Date.now()}`;

  await signInAsSeededOwner(page);
  await page.getByRole('button', { name: 'Новый проект' }).click();
  await page.getByLabel('Название проекта').fill(projectName);
  await page.getByLabel('Описание').fill('Создано smoke-тестом');
  await page.getByLabel('Дедлайн').fill('2026-09-15');
  await page.getByRole('button', { name: 'Создать' }).click();

  await expect(page.getByRole('link', { name: new RegExp(projectName) })).toBeVisible();
});

test('renders a seeded project detail page', async ({ page }) => {
  await signInAsSeededOwner(page);
  await page.goto('/app/projects/20000000-0000-4000-8000-000000000001');

  await expect(page.getByRole('heading', { name: 'Бизнес' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Задачи' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Обзор' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Статистика' })).toBeVisible();
});

test('covers the MVP project task calendar statistics path', async ({ page }) => {
  const taskTitle = `Smoke task ${Date.now()}`;

  await signInAsSeededOwner(page);
  await page.goto('/app/projects/20000000-0000-4000-8000-000000000001');

  await page.getByRole('button', { name: 'Добавить задачу' }).click();
  await page.getByLabel('Название задачи').fill(taskTitle);
  await page.getByLabel('Описание').fill('Проверка MVP smoke-пути');
  await page.getByLabel('Срок').fill('2026-09-20');
  await page.getByRole('button', { name: 'Создать' }).click();

  await expect(page.getByRole('button', { name: new RegExp(taskTitle) })).toBeVisible();

  await page.getByRole('button', { name: new RegExp(taskTitle) }).click();
  await page.getByLabel('Статус').click();
  await page.getByRole('option', { name: 'Готово' }).click();
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByRole('button', { name: new RegExp(taskTitle) })).toBeVisible();

  await page.getByRole('link', { name: /Мои задачи/i }).click();
  await expect(page.getByRole('link', { name: /Бизнес/i })).toBeVisible();
  await expect(page.getByLabel(/Прогресс проекта Бизнес/i)).toBeVisible();

  await page.getByRole('link', { name: /Календарь/i }).click();
  await expect(page.getByRole('heading', { name: 'Календарь' })).toBeVisible();

  await page.getByRole('link', { name: /Статистика/i }).click();
  await expect(page.getByRole('heading', { name: 'Статистика' })).toBeVisible();
});

test('keeps the mobile task drawer inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInAsSeededOwner(page);
  await page.goto('/app/projects/20000000-0000-4000-8000-000000000001');

  await page.getByRole('button', { name: 'Добавить задачу' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  await expect
    .poll(async () => {
      const box = await dialog.boundingBox();

      return box ? Math.ceil(box.x + box.width) : Number.POSITIVE_INFINITY;
    })
    .toBeLessThanOrEqual(viewportWidth);

  const drawerBox = await getBoundingBox(dialog, 'task drawer');
  const createButtonBox = await getBoundingBox(
    page.getByRole('button', { name: 'Создать' }),
    'create task button',
  );
  const assigneeLabelBox = await getBoundingBox(
    page.locator('label[for="task-assignee"]'),
    'assignee label',
  );
  const assigneeSelectBox = await getBoundingBox(
    page.locator('#task-assignee'),
    'assignee select',
  );

  expect(drawerBox.x).toBeGreaterThanOrEqual(0);
  expect(drawerBox.x + drawerBox.width).toBeLessThanOrEqual(viewportWidth);
  expect(drawerBox.width).toBeLessThanOrEqual(viewportWidth);
  expect(createButtonBox.x + createButtonBox.width).toBeLessThanOrEqual(
    viewportWidth,
  );
  expect(assigneeLabelBox.y + assigneeLabelBox.height).toBeLessThanOrEqual(
    assigneeSelectBox.y,
  );
});

test('shows the duplicate-member message from settings', async ({ page }) => {
  await signInAsSeededOwner(page);

  await page.getByRole('link', { name: /Настройки/i }).click();
  await page.getByLabel('Email участника').fill('member@example.com');
  await page.getByRole('button', { name: 'Добавить участника' }).click();

  await expect(
    page.getByText('Пользователь уже состоит в команде.'),
  ).toBeVisible();
  await expect(
    page.getByText('Не удалось добавить участника.'),
  ).not.toBeVisible();
});

async function signInAsSeededOwner(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('owner@example.com');
  await page.getByLabel('Пароль').fill('password123');
  await page.getByRole('button', { name: 'Войти' }).click();

  await expect(page.getByRole('heading', { name: 'Мои задачи' })).toBeVisible();
}

async function getBoundingBox(locator: ReturnType<Page['locator']>, label: string) {
  const box = await locator.boundingBox();

  expect(box, `${label} should have a visible bounding box`).not.toBeNull();

  return box!;
}
