import type { WorkflowGroupKey, WorkflowStatus } from './types';

// ── Workflow Group Configuration ────────────────────────────────────────

/** System-level group metadata — used for fallback colors and labels. */
export const GROUP_CONFIG: Record<WorkflowGroupKey, { label: string; defaultColor: string }> = {
  OPEN:        { label: 'Open',        defaultColor: '#6B7280' },
  IN_PROGRESS: { label: 'In Progress', defaultColor: '#7B68EE' },
  ON_HOLD:     { label: 'On Hold',     defaultColor: '#F59E0B' },
  CLOSED:      { label: 'Closed',      defaultColor: '#22C55E' },
};

/** Canonical ordering of groups for sorting. */
export const GROUP_ORDER: Record<WorkflowGroupKey, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  ON_HOLD: 2,
  CLOSED: 3,
};

/** Progress approximation by group — used in Gantt and list views. */
export const GROUP_PROGRESS_MAP: Record<WorkflowGroupKey, number> = {
  OPEN: 0,
  IN_PROGRESS: 50,
  ON_HOLD: 25,
  CLOSED: 100,
};

// ── Status Lookup Utilities ─────────────────────────────────────────────

/** Find a specific workflow status by ID. */
export function getStatusById(statuses: WorkflowStatus[], id: string): WorkflowStatus | undefined {
  return statuses.find((s) => s.id === id);
}

/** Get all statuses belonging to a specific group, sorted by position. */
export function getStatusesByGroup(statuses: WorkflowStatus[], group: WorkflowGroupKey): WorkflowStatus[] {
  return statuses
    .filter((s) => s.groupKey === group)
    .sort((a, b) => a.position - b.position);
}

/** Get all statuses for a project, sorted by group order then position. */
export function getProjectStatuses(statuses: WorkflowStatus[], projectId: string): WorkflowStatus[] {
  return statuses
    .filter((s) => s.projectId === projectId)
    .sort((a, b) => {
      const groupDiff = (GROUP_ORDER[a.groupKey] ?? 99) - (GROUP_ORDER[b.groupKey] ?? 99);
      return groupDiff !== 0 ? groupDiff : a.position - b.position;
    });
}

/** Check if a status belongs to the CLOSED group (i.e. task is "done"). */
export function isTerminalStatus(statuses: WorkflowStatus[], statusId: string): boolean {
  const s = getStatusById(statuses, statusId);
  return s?.groupKey === 'CLOSED';
}

/** Get the group key for a given status ID. */
export function getStatusGroup(statuses: WorkflowStatus[], statusId: string): WorkflowGroupKey | undefined {
  return getStatusById(statuses, statusId)?.groupKey;
}

/** Get the display name for a status, with fallback. */
export function getStatusName(statuses: WorkflowStatus[], statusId: string): string {
  return getStatusById(statuses, statusId)?.name ?? 'Unknown';
}

/** Get the hex color for a status, with group fallback. */
export function getStatusColor(statuses: WorkflowStatus[], statusId: string): string {
  const s = getStatusById(statuses, statusId);
  if (s) return s.color;
  return '#6B7280';
}
