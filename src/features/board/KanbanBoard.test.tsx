import { ThemeProvider } from '@mui/material';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { appTheme } from '../../app/theme/theme';
import type { ProjectBoardData } from './boardTypes';
import { KanbanBoard } from './KanbanBoard';
import {
  useCreateTaskMutation,
  useMoveTaskMutation,
  useProjectBoardQuery,
  useUpdateTaskMutation,
} from '../tasks/taskQueries';

vi.mock('../tasks/taskQueries', () => ({
  useProjectBoardQuery: vi.fn(),
  useCreateTaskMutation: vi.fn(),
  useUpdateTaskMutation: vi.fn(),
  useMoveTaskMutation: vi.fn(),
}));

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.mocked(useCreateTaskMutation).mockReturnValue(createMutation() as never);
    vi.mocked(useUpdateTaskMutation).mockReturnValue(createMutation() as never);
    vi.mocked(useMoveTaskMutation).mockReturnValue(createMutation() as never);
  });

  test('renders all five status columns and keeps empty columns visible', () => {
    mockBoardData({ tasks: [] });

    renderBoard();

    expect(screen.getByRole('heading', { name: 'Бэклог' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'К выполнению' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'В работе' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Проверка' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Готово' })).toBeVisible();
    expect(screen.getAllByText('Нет задач')).toHaveLength(5);
  });

  test('renders task cards with labels, assignee, priority, and due date', () => {
    mockBoardData();

    renderBoard();

    const card = screen.getByRole('button', { name: /Подготовить отчет/i });
    expect(card).toBeVisible();
    expect(within(card).getByText('Финансы')).toBeVisible();
    expect(within(card).getByText('Мария')).toBeVisible();
    expect(within(card).getByText('Высокий')).toBeVisible();
    expect(within(card).getByText(/20\.06\.2026/)).toBeVisible();
  });

  test('clicking add task opens the create drawer', async () => {
    const user = userEvent.setup();
    mockBoardData();

    renderBoard();

    await user.click(screen.getByRole('button', { name: 'Добавить задачу' }));

    expect(screen.getByRole('heading', { name: 'Новая задача' })).toBeVisible();
  });

  test('clicking a task opens the edit drawer', async () => {
    const user = userEvent.setup();
    mockBoardData();

    renderBoard();

    await user.click(screen.getByRole('button', { name: /Подготовить отчет/i }));

    expect(screen.getByRole('heading', { name: 'Редактировать задачу' })).toBeVisible();
    expect(screen.getByDisplayValue('Подготовить отчет')).toBeVisible();
  });

  test('opens the edit drawer when an initial task id matches loaded board data', () => {
    mockBoardData();

    renderBoard({ initialTaskId: 'task-1' });

    expect(screen.getByRole('heading', { name: 'Редактировать задачу' })).toBeVisible();
    expect(screen.getByDisplayValue('Подготовить отчет')).toBeVisible();
  });
});

function renderBoard(options: { initialTaskId?: string } = {}) {
  return render(
    <ThemeProvider theme={appTheme}>
      <KanbanBoard
        workspaceId="workspace-1"
        projectId="project-1"
        currentUserId="user-1"
        projectName="Проект"
        projectColor="#42a5ff"
        initialTaskId={options.initialTaskId}
      />
    </ThemeProvider>,
  );
}

function mockBoardData(overrides: Partial<ProjectBoardData> = {}) {
  vi.mocked(useProjectBoardQuery).mockReturnValue({
    data: createBoardData(overrides),
    isLoading: false,
    isError: false,
    error: null,
  } as never);
}

function createMutation() {
  return {
    mutateAsync: vi.fn(),
    isPending: false,
    error: null,
  };
}

function createBoardData(overrides: Partial<ProjectBoardData> = {}): ProjectBoardData {
  const labels = [
    {
      id: 'label-1',
      name: 'Финансы',
      color: '#42a5ff',
    },
  ];
  const assignees = [
    {
      id: 'user-2',
      email: 'member@example.com',
      displayName: 'Мария',
    },
  ];

  return {
    labels,
    assignees,
    tasks: [
      {
        id: 'task-1',
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        title: 'Подготовить отчет',
        description: null,
        status: 'todo',
        priority: 'high',
        assigneeId: 'user-2',
        dueDate: '2026-06-20',
        position: 1000,
        createdBy: 'user-1',
        createdAt: '2026-06-07T00:00:00.000Z',
        updatedAt: '2026-06-07T00:00:00.000Z',
        labels,
        assignee: assignees[0],
      },
    ],
    ...overrides,
  };
}
