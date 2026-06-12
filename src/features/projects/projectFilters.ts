import type {
  ProjectListItem,
  ProjectSortKey,
  ProjectStatusFilter,
} from './projectTypes';

type ProjectFilterOptions = {
  search: string;
  statusFilter: ProjectStatusFilter;
  sortKey: ProjectSortKey;
};

export function filterAndSortProjects(
  projects: ProjectListItem[],
  options: ProjectFilterOptions,
) {
  const normalizedSearch = options.search.trim().toLocaleLowerCase('ru-RU');

  return projects
    .filter((project) => matchesStatusFilter(project, options.statusFilter))
    .filter((project) => matchesSearch(project, normalizedSearch))
    .sort((left, right) => compareProjects(left, right, options.sortKey));
}

function matchesStatusFilter(
  project: ProjectListItem,
  statusFilter: ProjectStatusFilter,
) {
  if (statusFilter === 'all') {
    return true;
  }

  const isArchived = Boolean(project.archived_at);

  return statusFilter === 'archived' ? isArchived : !isArchived;
}

function matchesSearch(project: ProjectListItem, normalizedSearch: string) {
  if (!normalizedSearch) {
    return true;
  }

  return `${project.name} ${project.description ?? ''}`
    .toLocaleLowerCase('ru-RU')
    .includes(normalizedSearch);
}

function compareProjects(
  left: ProjectListItem,
  right: ProjectListItem,
  sortKey: ProjectSortKey,
) {
  if (sortKey === 'deadline') {
    return compareOptionalDateAsc(left.deadline, right.deadline);
  }

  if (sortKey === 'progress') {
    return right.progress - left.progress;
  }

  if (sortKey === 'lastVisit') {
    return compareOptionalDateDesc(left.lastVisitedAt, right.lastVisitedAt);
  }

  return compareOptionalDateDesc(left.created_at, right.created_at);
}

function compareOptionalDateAsc(left: string | null, right: string | null) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return Date.parse(left) - Date.parse(right);
}

function compareOptionalDateDesc(left: string | null, right: string | null) {
  if (!left && !right) {
    return 0;
  }

  if (!left) {
    return 1;
  }

  if (!right) {
    return -1;
  }

  return Date.parse(right) - Date.parse(left);
}
