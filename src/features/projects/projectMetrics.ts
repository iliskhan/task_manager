import type { ProjectMetrics, ProjectTaskRow } from './projectTypes';

export function calculateProjectMetrics(
  projectId: string,
  tasks: ProjectTaskRow[],
): ProjectMetrics {
  const projectTasks = tasks.filter((task) => task.project_id === projectId);
  const totalTaskCount = projectTasks.length;

  if (totalTaskCount === 0) {
    return {
      doneTaskCount: 0,
      totalTaskCount: 0,
      progress: 0,
    };
  }

  const doneTaskCount = projectTasks.filter((task) => task.status === 'done').length;

  return {
    doneTaskCount,
    totalTaskCount,
    progress: Math.round((doneTaskCount / totalTaskCount) * 100),
  };
}
