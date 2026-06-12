import { describe, expect, test } from 'vitest';
import { filterAndSortProjects } from './projectFilters';
import type { ProjectListItem } from './projectTypes';

describe('filterAndSortProjects', () => {
  test('searches projects by name and description case-insensitively', () => {
    const projects = [
      createProject({ id: 'project-1', name: 'Бизнес', description: 'Продажи' }),
      createProject({ id: 'project-2', name: 'Работа', description: 'Операции' }),
      createProject({ id: 'project-3', name: 'Учеба', description: 'Внутренние материалы' }),
    ];

    expect(
      filterAndSortProjects(projects, {
        search: 'материал',
        statusFilter: 'all',
        sortKey: 'createdAt',
      }).map((project) => project.id),
    ).toEqual(['project-3']);
  });

  test('filters active and archived projects', () => {
    const projects = [
      createProject({ id: 'active-project', archived_at: null }),
      createProject({
        id: 'archived-project',
        archived_at: '2026-06-11T00:00:00.000Z',
        created_at: '2026-06-11T00:00:00.000Z',
      }),
    ];

    expect(
      filterAndSortProjects(projects, {
        search: '',
        statusFilter: 'active',
        sortKey: 'createdAt',
      }).map((project) => project.id),
    ).toEqual(['active-project']);
    expect(
      filterAndSortProjects(projects, {
        search: '',
        statusFilter: 'archived',
        sortKey: 'createdAt',
      }).map((project) => project.id),
    ).toEqual(['archived-project']);
    expect(
      filterAndSortProjects(projects, {
        search: '',
        statusFilter: 'all',
        sortKey: 'createdAt',
      }).map((project) => project.id),
    ).toEqual(['archived-project', 'active-project']);
  });

  test('sorts by nearest deadline and keeps missing deadlines at the end', () => {
    const projects = [
      createProject({ id: 'without-deadline', deadline: null }),
      createProject({ id: 'later', deadline: '2026-06-20' }),
      createProject({ id: 'earlier', deadline: '2026-06-13' }),
    ];

    expect(
      filterAndSortProjects(projects, {
        search: '',
        statusFilter: 'all',
        sortKey: 'deadline',
      }).map((project) => project.id),
    ).toEqual(['earlier', 'later', 'without-deadline']);
  });

  test('sorts by highest progress first', () => {
    const projects = [
      createProject({ id: 'low', progress: 10 }),
      createProject({ id: 'high', progress: 90 }),
      createProject({ id: 'middle', progress: 50 }),
    ];

    expect(
      filterAndSortProjects(projects, {
        search: '',
        statusFilter: 'all',
        sortKey: 'progress',
      }).map((project) => project.id),
    ).toEqual(['high', 'middle', 'low']);
  });

  test('sorts by latest visit and keeps missing visits at the end', () => {
    const projects = [
      createProject({ id: 'never-opened', lastVisitedAt: null }),
      createProject({ id: 'older', lastVisitedAt: '2026-06-10T08:00:00.000Z' }),
      createProject({ id: 'newer', lastVisitedAt: '2026-06-12T08:00:00.000Z' }),
    ];

    expect(
      filterAndSortProjects(projects, {
        search: '',
        statusFilter: 'all',
        sortKey: 'lastVisit',
      }).map((project) => project.id),
    ).toEqual(['newer', 'older', 'never-opened']);
  });

  test('sorts by newest created date first', () => {
    const projects = [
      createProject({ id: 'older', created_at: '2026-06-10T08:00:00.000Z' }),
      createProject({ id: 'newer', created_at: '2026-06-12T08:00:00.000Z' }),
    ];

    expect(
      filterAndSortProjects(projects, {
        search: '',
        statusFilter: 'all',
        sortKey: 'createdAt',
      }).map((project) => project.id),
    ).toEqual(['newer', 'older']);
  });
});

function createProject(overrides: Partial<ProjectListItem>): ProjectListItem {
  return {
    id: 'project',
    workspace_id: 'workspace-1',
    name: 'Проект',
    description: null,
    icon_name: 'briefcase',
    color: '#42a5ff',
    deadline: null,
    archived_at: null,
    created_by: 'user-1',
    created_at: '2026-06-07T00:00:00.000Z',
    updated_at: '2026-06-07T00:00:00.000Z',
    doneTaskCount: 0,
    totalTaskCount: 0,
    progress: 0,
    lastVisitedAt: null,
    deadlineStatus: {
      dateText: 'Без дедлайна',
      statusText: 'Срок не задан',
      tone: 'muted',
      daysUntilDeadline: null,
    },
    lastVisitText: 'Еще не открывали',
    displayColor: '#42a5ff',
    displayIconName: 'briefcase',
    ...overrides,
  };
}
