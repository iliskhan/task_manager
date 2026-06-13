import { ThemeProvider } from '@mui/material';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { appTheme } from '../../app/theme/theme';
import { TaskDrawer } from './TaskDrawer';
import type { BoardAssignee, BoardLabel, BoardTask } from '../board/boardTypes';

const submit = vi.fn();
const close = vi.fn();

describe('TaskDrawer', () => {
  beforeEach(() => {
    submit.mockReset();
    close.mockReset();
    mockMobileViewport(false);
  });

  test('submits trimmed create values', async () => {
    const user = userEvent.setup();
    renderDrawer({ mode: 'create' });

    await user.type(screen.getByLabelText('Название задачи'), '  Новая задача  ');
    await user.type(screen.getByLabelText('Описание'), '  Подробности  ');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(submit).toHaveBeenCalledWith({
      title: 'Новая задача',
      description: 'Подробности',
      status: 'todo',
      priority: 'medium',
      assigneeId: null,
      dueDate: null,
      labelIds: [],
    });
  });

  test('edit submit includes the task id and preserves unchanged fields', async () => {
    const user = userEvent.setup();
    renderDrawer({
      mode: 'edit',
      task: createTask({ id: 'task-1', title: 'Старая задача' }),
    });

    await user.clear(screen.getByLabelText('Название задачи'));
    await user.type(screen.getByLabelText('Название задачи'), 'Обновленная задача');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(submit).toHaveBeenCalledWith({
      taskId: 'task-1',
      title: 'Обновленная задача',
      description: null,
      status: 'todo',
      priority: 'medium',
      assigneeId: null,
      dueDate: null,
      labelIds: [],
    });
  });

  test('missing title prevents submit', async () => {
    const user = userEvent.setup();
    renderDrawer({ mode: 'create' });

    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(screen.getByText('Название обязательно')).toBeVisible();
    expect(submit).not.toHaveBeenCalled();
  });

  test('clearing assignee, due date, and labels sends nullable and empty values', async () => {
    const user = userEvent.setup();
    renderDrawer({
      mode: 'edit',
      task: createTask({
        id: 'task-1',
        assigneeId: 'user-2',
        dueDate: '2026-06-20',
        labels: [labels[0]],
      }),
    });

    await user.selectOptions(screen.getByLabelText('Исполнитель'), '');
    await user.clear(screen.getByLabelText('Срок'));
    await user.click(screen.getByRole('checkbox', { name: 'Финансы' }));
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        assigneeId: null,
        dueDate: null,
        labelIds: [],
      }),
    );
  });

  test('uses viewport-safe drawer sizing and form label spacing on mobile', () => {
    mockMobileViewport(true);

    renderDrawer({ mode: 'create' });

    expect(screen.getByRole('dialog')).toHaveStyle({
      left: '0px',
      right: '1px',
      width: 'auto',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      transform: 'none',
      transition: 'none',
    });
    expect(screen.getByTestId('task-drawer-actions')).toHaveStyle({
      flexWrap: 'wrap',
    });
    expect(screen.getByText('Исполнитель')).toHaveAttribute('data-shrink', 'true');
  });
});

const labels: BoardLabel[] = [
  {
    id: 'label-1',
    name: 'Финансы',
    color: '#42a5ff',
  },
];

const assignees: BoardAssignee[] = [
  {
    id: 'user-2',
    email: 'member@example.com',
    displayName: 'Мария',
  },
];

function renderDrawer({
  mode,
  task = null,
}: {
  mode: 'create' | 'edit';
  task?: BoardTask | null;
}) {
  return render(
    <ThemeProvider theme={appTheme}>
      <TaskDrawer
        open
        mode={mode}
        task={task}
        defaultStatus="todo"
        labels={labels}
        assignees={assignees}
        isSubmitting={false}
        error={null}
        onClose={close}
        onSubmit={submit}
      />
    </ThemeProvider>,
  );
}

function mockMobileViewport(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function createTask(overrides: Partial<BoardTask> = {}): BoardTask {
  return {
    id: 'task-1',
    workspaceId: 'workspace-1',
    projectId: 'project-1',
    title: 'Задача',
    description: null,
    status: 'todo',
    priority: 'medium',
    assigneeId: null,
    dueDate: null,
    position: 1000,
    createdBy: 'user-1',
    createdAt: '2026-06-07T00:00:00.000Z',
    updatedAt: '2026-06-07T00:00:00.000Z',
    labels: [],
    assignee: null,
    ...overrides,
  };
}
