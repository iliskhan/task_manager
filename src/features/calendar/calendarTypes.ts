import type { TaskPriority, TaskStatus } from '../board/boardConstants';
import type { ProjectIconName } from '../projects/projectTypes';

export type CalendarTaskProject = {
  id: string;
  name: string;
  color: string;
  iconName: ProjectIconName;
};

export type CalendarTaskDeadline = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  project: CalendarTaskProject;
};

export type CalendarDay = {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: CalendarTaskDeadline[];
};

export type CalendarMonth = {
  title: string;
  monthStart: string;
  days: CalendarDay[];
};
