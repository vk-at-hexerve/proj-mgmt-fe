import { Task, TaskFilters, TaskSort, WorkflowStatus } from './types';
import { GROUP_PROGRESS_MAP } from './status-utils';

/**
 * A pure function that applies advanced filters and sorting to a list of tasks.
 */
export function applyTaskFilters(
  tasks: Task[],
  taskFilters: TaskFilters,
  taskSort: TaskSort,
  workflowStatuses: WorkflowStatus[]
): Task[] {
  let result = [...tasks];

  const hasActiveFilters = Object.values(taskFilters).some(v =>
    Array.isArray(v) ? v.length > 0 : (v !== undefined && v !== null && v !== '')
  );

  if (hasActiveFilters) {
    if (taskFilters.assignees && taskFilters.assignees.length > 0) {
      result = result.filter(t => t.assignee?.id && taskFilters.assignees!.includes(t.assignee.id));
    }
    if (taskFilters.priorities && taskFilters.priorities.length > 0) {
      result = result.filter(t => taskFilters.priorities!.includes(t.priority));
    }
    if (taskFilters.types && taskFilters.types.length > 0) {
      result = result.filter(t =>
        taskFilters.types!.includes(t.type) ||
        (taskFilters.types!.includes('subtask') && !!t.parentId)
      );
    }
    if (taskFilters.statuses && taskFilters.statuses.length > 0) {
      result = result.filter(t => taskFilters.statuses!.includes(t.statusId));
    }
    if (taskFilters.groups && taskFilters.groups.length > 0) {
      result = result.filter(t => t.group && taskFilters.groups!.includes(t.group));
    }
    if (taskFilters.isMilestone !== undefined && taskFilters.isMilestone !== null) {
      result = result.filter(t => (t.isMilestone || false) === taskFilters.isMilestone);
    }
    if (taskFilters.startDateAfter) {
      result = result.filter(t => t.startDate && t.startDate >= taskFilters.startDateAfter!);
    }
    if (taskFilters.endDateBefore) {
      result = result.filter(t => t.dueDate && t.dueDate <= taskFilters.endDateBefore!);
    }
  }

  // Apply Sort
  result.sort((a, b) => {
    let comp = 0;
    switch (taskSort.field) {
      case 'key': {
        const [prefixA, numA] = a.key.split('-');
        const [prefixB, numB] = b.key.split('-');
        comp = prefixA !== prefixB ? prefixA.localeCompare(prefixB) : parseInt(numA || '0', 10) - parseInt(numB || '0', 10);
        break;
      }
      case 'title': comp = a.title.localeCompare(b.title); break;
      case 'status': comp = a.statusId.localeCompare(b.statusId); break;
      case 'progress': {
        const groupA = workflowStatuses.find(s => s.id === a.statusId)?.groupKey;
        const groupB = workflowStatuses.find(s => s.id === b.statusId)?.groupKey;
        const progA = groupA ? GROUP_PROGRESS_MAP[groupA] : 0;
        const progB = groupB ? GROUP_PROGRESS_MAP[groupB] : 0;
        comp = progA - progB;
        break;
      }
      case 'priority': {
        const pOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        comp = (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
        break;
      }
      case 'startDate': comp = (a.startDate || 'zzzz').localeCompare(b.startDate || 'zzzz'); break;
      case 'dueDate': comp = (a.dueDate || 'zzzz').localeCompare(b.dueDate || 'zzzz'); break;
      case 'createdAt': comp = (a.createdAt || 'zzzz').localeCompare(b.createdAt || 'zzzz'); break;
      case 'storyPoints': comp = (a.storyPoints || 0) - (b.storyPoints || 0); break;
    }
    return taskSort.direction === 'asc' ? comp : -comp;
  });

  return result;
}
