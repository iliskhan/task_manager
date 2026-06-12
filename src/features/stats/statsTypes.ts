import type { TaskStatus } from '../board/boardConstants';
import type { Tables } from '../../lib/supabase/database.types';

export type StatsProjectRow = Tables<'projects'>;
export type StatsTaskRow = Tables<'tasks'>;
export type StatsActivityEventRow = Tables<'activity_events'>;
export type StatsProfileRow = Tables<'profiles'>;

export type StatsSummary = {
  activeProjectCount: number;
  totalTaskCount: number;
  completedTaskCount: number;
  completionPercent: number;
  overdueTaskCount: number;
  upcomingDeadlineCount: number;
};

export type StatsStatusCount = {
  status: TaskStatus;
  label: string;
  color: string;
  count: number;
  percent: number;
};

export type StatsProjectProgress = {
  projectId: string;
  name: string;
  color: string;
  doneTaskCount: number;
  totalTaskCount: number;
  progress: number;
};

export type StatsDeadlineTask = {
  id: string;
  title: string;
  dueDate: string;
  status: TaskStatus;
  projectId: string;
  projectName: string;
  projectColor: string;
};

export type StatsActivityItem = {
  id: string;
  label: string;
  description: string;
  actorName: string;
  projectName: string | null;
  createdAt: string;
};

export type WorkspaceStats = {
  summary: StatsSummary;
  statusCounts: StatsStatusCount[];
  projectProgress: StatsProjectProgress[];
  overdueTasks: StatsDeadlineTask[];
  upcomingDeadlines: StatsDeadlineTask[];
  recentActivity: StatsActivityItem[];
};

export type WorkspaceStatsInput = {
  projects: StatsProjectRow[];
  tasks: StatsTaskRow[];
  activityEvents: StatsActivityEventRow[];
  profiles?: StatsProfileRow[];
  now?: Date;
};
