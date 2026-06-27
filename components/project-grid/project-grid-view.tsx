'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Save,
  Undo2,
  Route,
  Columns,
  Settings2,
  UserCheck,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { users, tags as availableTags } from '@/lib/mock-data';
import { getStatusName, getStatusGroup, GROUP_PROGRESS_MAP } from '@/lib/status-utils';
import type { Task, TaskPriority, Project } from '@/lib/types';
import { TaskWatchButton } from '@/components/tasks/task-watch-button';

// Extended WBS Grid Row type with many more columns
interface WBSRow {
  id: string;
  wbs: string;
  taskName: string;
  duration: number;
  startDate: string;
  endDate: string;
  predecessors: string;
  successors: string;
  assigneeId: string;
  priority: TaskPriority;
  statusId: string;
  progress: number;
  notes: string;
  indent: number;
  expanded: boolean;
  isParent: boolean;
  isCritical: boolean;
  isEditing: boolean;
  parentId?: string;
  // Extended columns
  taskType: 'milestone' | 'task' | 'summary';
  work: number; // hours
  actualWork: number;
  remainingWork: number;
  cost: number;
  actualCost: number;
  baselineStart: string;
  baselineFinish: string;
  variance: number;
  slack: number;
  constraintType: 'asap' | 'alap' | 'must-start-on' | 'must-finish-on' | 'start-no-earlier' | 'start-no-later' | 'finish-no-earlier' | 'finish-no-later';
  constraintDate: string;
  deadline: string;
  wbsLevel: number;
  outlineLevel: number;
  resourceNames: string;
  percentWorkComplete: number;
  milestoneFlag: boolean;
  summaryFlag: boolean;
  tags: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  group: string;
  calendarName: string;
  earlyStart: string;
  earlyFinish: string;
  lateStart: string;
  lateFinish: string;
  totalSlack: number;
  freeSlack: number;
  isOverdue?: boolean;
}

// Column configuration
interface ColumnConfig {
  id: keyof WBSRow | 'actions';
  label: string;
  width: number;
  visible: boolean;
  frozen?: boolean;
  type: 'text' | 'number' | 'date' | 'select' | 'progress' | 'badge' | 'avatar' | 'checkbox' | 'actions';
}

const allColumns: ColumnConfig[] = [
  { id: 'wbs', label: 'WBS', width: 80, visible: true, frozen: true, type: 'text' },
  { id: 'taskName', label: 'Task Name', width: 250, visible: true, frozen: true, type: 'text' },
  { id: 'taskType', label: 'Type', width: 90, visible: true, type: 'badge' },
  { id: 'duration', label: 'Duration', width: 80, visible: true, type: 'number' },
  { id: 'startDate', label: 'Start', width: 100, visible: true, type: 'date' },
  { id: 'endDate', label: 'Finish', width: 100, visible: true, type: 'date' },
  { id: 'progress', label: '% Complete', width: 110, visible: true, type: 'progress' },
  { id: 'predecessors', label: 'Predecessors', width: 120, visible: true, type: 'text' },
  { id: 'successors', label: 'Successors', width: 120, visible: true, type: 'text' },
  { id: 'assigneeId', label: 'Resource', width: 120, visible: true, type: 'avatar' },
  { id: 'priority', label: 'Priority', width: 100, visible: true, type: 'badge' },
  { id: 'statusId', label: 'Status', width: 120, visible: true, type: 'badge' },
  { id: 'work', label: 'Work (hrs)', width: 90, visible: true, type: 'number' },
  { id: 'actualWork', label: 'Actual Work', width: 100, visible: true, type: 'number' },
  { id: 'remainingWork', label: 'Remaining', width: 100, visible: true, type: 'number' },
  { id: 'cost', label: 'Cost', width: 90, visible: true, type: 'number' },
  { id: 'actualCost', label: 'Actual Cost', width: 100, visible: true, type: 'number' },
  { id: 'baselineStart', label: 'Baseline Start', width: 110, visible: false, type: 'date' },
  { id: 'baselineFinish', label: 'Baseline Finish', width: 115, visible: false, type: 'date' },
  { id: 'variance', label: 'Variance', width: 80, visible: true, type: 'number' },
  { id: 'slack', label: 'Slack', width: 70, visible: true, type: 'number' },
  { id: 'totalSlack', label: 'Total Slack', width: 90, visible: false, type: 'number' },
  { id: 'freeSlack', label: 'Free Slack', width: 90, visible: false, type: 'number' },
  { id: 'constraintType', label: 'Constraint', width: 130, visible: false, type: 'select' },
  { id: 'constraintDate', label: 'Constraint Date', width: 115, visible: false, type: 'date' },
  { id: 'deadline', label: 'Deadline', width: 100, visible: true, type: 'date' },
  { id: 'earlyStart', label: 'Early Start', width: 100, visible: false, type: 'date' },
  { id: 'earlyFinish', label: 'Early Finish', width: 105, visible: false, type: 'date' },
  { id: 'lateStart', label: 'Late Start', width: 95, visible: false, type: 'date' },
  { id: 'lateFinish', label: 'Late Finish', width: 100, visible: false, type: 'date' },
  { id: 'riskLevel', label: 'Risk', width: 80, visible: true, type: 'badge' },
  { id: 'group', label: 'Group', width: 100, visible: false, type: 'text' },
  { id: 'calendarName', label: 'Calendar', width: 100, visible: false, type: 'text' },
  { id: 'milestoneFlag', label: 'Milestone', width: 85, visible: false, type: 'checkbox' },
  { id: 'notes', label: 'Notes', width: 200, visible: false, type: 'text' },
  { id: 'actions', label: '', width: 50, visible: true, type: 'actions' },
];

// Sample WBS data
const createInitialWBSData = (key: string): WBSRow[] => [
  { id: '1', wbs: `${key}-1`, taskName: 'Project Kickoff', duration: 1, startDate: '2026-01-06', endDate: '2026-01-06', predecessors: '', successors: `${key}-2`, assigneeId: 'user-1', priority: 'high', statusId: 'closed', progress: 100, notes: 'Initial meeting', indent: 0, expanded: true, isParent: true, isCritical: true, isEditing: false, taskType: 'milestone', work: 8, actualWork: 8, remainingWork: 0, cost: 800, actualCost: 800, baselineStart: '2026-01-06', baselineFinish: '2026-01-06', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '2026-01-06', wbsLevel: 1, outlineLevel: 1, resourceNames: 'Alex Morgan', percentWorkComplete: 100, milestoneFlag: true, summaryFlag: false, tags: ['kickoff'], riskLevel: 'low', group: 'Planning', calendarName: 'Standard', earlyStart: '2026-01-06', earlyFinish: '2026-01-06', lateStart: '2026-01-06', lateFinish: '2026-01-06', totalSlack: 0, freeSlack: 0 },
  { id: '2', wbs: `${key}-1.1`, taskName: 'Stakeholder Meeting', duration: 1, startDate: '2026-01-06', endDate: '2026-01-06', predecessors: `${key}-1`, successors: `${key}-1.2`, assigneeId: 'user-1', priority: 'high', statusId: 'closed', progress: 100, notes: '', indent: 1, expanded: false, isParent: false, isCritical: true, isEditing: false, taskType: 'task', work: 4, actualWork: 4, remainingWork: 0, cost: 400, actualCost: 400, baselineStart: '2026-01-06', baselineFinish: '2026-01-06', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'Alex Morgan', percentWorkComplete: 100, milestoneFlag: false, summaryFlag: false, tags: [], riskLevel: 'low', group: 'Planning', calendarName: 'Standard', earlyStart: '2026-01-06', earlyFinish: '2026-01-06', lateStart: '2026-01-06', lateFinish: '2026-01-06', totalSlack: 0, freeSlack: 0 },
  { id: '3', wbs: `${key}-1.2`, taskName: 'Requirements Gathering', duration: 3, startDate: '2026-01-07', endDate: '2026-01-09', predecessors: `${key}-1.1`, successors: `${key}-2`, assigneeId: 'user-2', priority: 'high', statusId: 'closed', progress: 100, notes: '', indent: 1, expanded: false, isParent: false, isCritical: true, isEditing: false, taskType: 'task', work: 24, actualWork: 24, remainingWork: 0, cost: 2400, actualCost: 2400, baselineStart: '2026-01-07', baselineFinish: '2026-01-09', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'Sarah Chen', percentWorkComplete: 100, milestoneFlag: false, summaryFlag: false, tags: ['requirements'], riskLevel: 'low', group: 'Planning', calendarName: 'Standard', earlyStart: '2026-01-07', earlyFinish: '2026-01-09', lateStart: '2026-01-07', lateFinish: '2026-01-09', totalSlack: 0, freeSlack: 0 },
  { id: '4', wbs: `${key}-2`, taskName: 'Design Phase', duration: 10, startDate: '2026-01-10', endDate: '2026-01-23', predecessors: `${key}-1.2`, successors: `${key}-3`, assigneeId: 'user-3', priority: 'high', statusId: 'in_progress', progress: 75, notes: '', indent: 0, expanded: true, isParent: true, isCritical: true, isEditing: false, taskType: 'summary', work: 80, actualWork: 60, remainingWork: 20, cost: 8000, actualCost: 6000, baselineStart: '2026-01-10', baselineFinish: '2026-01-23', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '2026-01-25', wbsLevel: 1, outlineLevel: 1, resourceNames: 'Michael Park', percentWorkComplete: 75, milestoneFlag: false, summaryFlag: true, tags: ['design'], riskLevel: 'medium', group: 'Design', calendarName: 'Standard', earlyStart: '2026-01-10', earlyFinish: '2026-01-23', lateStart: '2026-01-10', lateFinish: '2026-01-23', totalSlack: 0, freeSlack: 0 },
  { id: '5', wbs: `${key}-2.1`, taskName: 'UI/UX Design', duration: 5, startDate: '2026-01-10', endDate: '2026-01-16', predecessors: `${key}-1.2`, successors: `${key}-2.2`, assigneeId: 'user-3', priority: 'high', statusId: 'closed', progress: 100, notes: '', indent: 1, expanded: false, isParent: false, isCritical: true, isEditing: false, taskType: 'task', work: 40, actualWork: 40, remainingWork: 0, cost: 4000, actualCost: 4000, baselineStart: '2026-01-10', baselineFinish: '2026-01-16', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'Michael Park', percentWorkComplete: 100, milestoneFlag: false, summaryFlag: false, tags: ['ux', 'ui'], riskLevel: 'low', group: 'Design', calendarName: 'Standard', earlyStart: '2026-01-10', earlyFinish: '2026-01-16', lateStart: '2026-01-10', lateFinish: '2026-01-16', totalSlack: 0, freeSlack: 0 },
  { id: '6', wbs: `${key}-2.2`, taskName: 'Architecture Design', duration: 4, startDate: '2026-01-17', endDate: '2026-01-22', predecessors: `${key}-2.1`, successors: `${key}-3`, assigneeId: 'user-4', priority: 'high', statusId: 'in_progress', progress: 50, notes: '', indent: 1, expanded: false, isParent: false, isCritical: true, isEditing: false, taskType: 'task', work: 32, actualWork: 16, remainingWork: 16, cost: 3200, actualCost: 1600, baselineStart: '2026-01-17', baselineFinish: '2026-01-22', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'James Liu', percentWorkComplete: 50, milestoneFlag: false, summaryFlag: false, tags: ['architecture'], riskLevel: 'medium', group: 'Design', calendarName: 'Standard', earlyStart: '2026-01-17', earlyFinish: '2026-01-22', lateStart: '2026-01-17', lateFinish: '2026-01-22', totalSlack: 0, freeSlack: 0 },
  { id: '7', wbs: `${key}-2.3`, taskName: 'Technical Documentation', duration: 3, startDate: '2026-01-20', endDate: '2026-01-23', predecessors: `${key}-2.1`, successors: '', assigneeId: 'user-2', priority: 'medium', statusId: 'open', progress: 0, notes: '', indent: 1, expanded: false, isParent: false, isCritical: false, isEditing: false, taskType: 'task', work: 24, actualWork: 0, remainingWork: 24, cost: 2400, actualCost: 0, baselineStart: '2026-01-20', baselineFinish: '2026-01-23', variance: 0, slack: 3, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'Sarah Chen', percentWorkComplete: 0, milestoneFlag: false, summaryFlag: false, tags: ['docs'], riskLevel: 'low', group: 'Design', calendarName: 'Standard', earlyStart: '2026-01-20', earlyFinish: '2026-01-23', lateStart: '2026-01-23', lateFinish: '2026-01-26', totalSlack: 3, freeSlack: 3 },
  { id: '8', wbs: `${key}-3`, taskName: 'Development Phase', duration: 20, startDate: '2026-01-23', endDate: '2026-02-19', predecessors: `${key}-2.2`, successors: `${key}-4`, assigneeId: 'user-1', priority: 'high', statusId: 'open', progress: 10, notes: '', indent: 0, expanded: true, isParent: true, isCritical: true, isEditing: false, taskType: 'summary', work: 160, actualWork: 16, remainingWork: 144, cost: 16000, actualCost: 1600, baselineStart: '2026-01-23', baselineFinish: '2026-02-19', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '2026-02-20', wbsLevel: 1, outlineLevel: 1, resourceNames: 'Alex Morgan', percentWorkComplete: 10, milestoneFlag: false, summaryFlag: true, tags: ['dev'], riskLevel: 'high', group: 'Development', calendarName: 'Standard', earlyStart: '2026-01-23', earlyFinish: '2026-02-19', lateStart: '2026-01-23', lateFinish: '2026-02-19', totalSlack: 0, freeSlack: 0 },
  { id: '9', wbs: `${key}-3.1`, taskName: 'Backend Development', duration: 15, startDate: '2026-01-23', endDate: '2026-02-12', predecessors: `${key}-2.2`, successors: `${key}-3.3`, assigneeId: 'user-4', priority: 'high', statusId: 'in_progress', progress: 20, notes: '', indent: 1, expanded: false, isParent: false, isCritical: true, isEditing: false, taskType: 'task', work: 120, actualWork: 24, remainingWork: 96, cost: 12000, actualCost: 2400, baselineStart: '2026-01-23', baselineFinish: '2026-02-12', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'James Liu', percentWorkComplete: 20, milestoneFlag: false, summaryFlag: false, tags: ['backend'], riskLevel: 'high', group: 'Development', calendarName: 'Standard', earlyStart: '2026-01-23', earlyFinish: '2026-02-12', lateStart: '2026-01-23', lateFinish: '2026-02-12', totalSlack: 0, freeSlack: 0 },
  { id: '10', wbs: `${key}-3.2`, taskName: 'Frontend Development', duration: 12, startDate: '2026-01-27', endDate: '2026-02-11', predecessors: `${key}-2.1`, successors: `${key}-3.3`, assigneeId: 'user-3', priority: 'high', statusId: 'open', progress: 0, notes: '', indent: 1, expanded: false, isParent: false, isCritical: false, isEditing: false, taskType: 'task', work: 96, actualWork: 0, remainingWork: 96, cost: 9600, actualCost: 0, baselineStart: '2026-01-27', baselineFinish: '2026-02-11', variance: 0, slack: 2, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'Michael Park', percentWorkComplete: 0, milestoneFlag: false, summaryFlag: false, tags: ['frontend'], riskLevel: 'medium', group: 'Development', calendarName: 'Standard', earlyStart: '2026-01-27', earlyFinish: '2026-02-11', lateStart: '2026-01-29', lateFinish: '2026-02-13', totalSlack: 2, freeSlack: 0 },
  { id: '11', wbs: `${key}-3.3`, taskName: 'Integration', duration: 5, startDate: '2026-02-13', endDate: '2026-02-19', predecessors: `${key}-3.1,${key}-3.2`, successors: `${key}-4`, assigneeId: 'user-1', priority: 'critical', statusId: 'open', progress: 0, notes: '', indent: 1, expanded: false, isParent: false, isCritical: true, isEditing: false, taskType: 'task', work: 40, actualWork: 0, remainingWork: 40, cost: 4000, actualCost: 0, baselineStart: '2026-02-13', baselineFinish: '2026-02-19', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'Alex Morgan', percentWorkComplete: 0, milestoneFlag: false, summaryFlag: false, tags: ['integration'], riskLevel: 'high', group: 'Development', calendarName: 'Standard', earlyStart: '2026-02-13', earlyFinish: '2026-02-19', lateStart: '2026-02-13', lateFinish: '2026-02-19', totalSlack: 0, freeSlack: 0 },
  { id: '12', wbs: `${key}-4`, taskName: 'Testing Phase', duration: 10, startDate: '2026-02-20', endDate: '2026-03-05', predecessors: `${key}-3.3`, successors: `${key}-5`, assigneeId: 'user-2', priority: 'high', statusId: 'open', progress: 0, notes: '', indent: 0, expanded: true, isParent: true, isCritical: true, isEditing: false, taskType: 'summary', work: 80, actualWork: 0, remainingWork: 80, cost: 8000, actualCost: 0, baselineStart: '2026-02-20', baselineFinish: '2026-03-05', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '2026-03-06', wbsLevel: 1, outlineLevel: 1, resourceNames: 'Sarah Chen', percentWorkComplete: 0, milestoneFlag: false, summaryFlag: true, tags: ['testing'], riskLevel: 'medium', group: 'Testing', calendarName: 'Standard', earlyStart: '2026-02-20', earlyFinish: '2026-03-05', lateStart: '2026-02-20', lateFinish: '2026-03-05', totalSlack: 0, freeSlack: 0 },
  { id: '13', wbs: `${key}-4.1`, taskName: 'Unit Testing', duration: 4, startDate: '2026-02-20', endDate: '2026-02-25', predecessors: `${key}-3.3`, successors: `${key}-4.2`, assigneeId: 'user-4', priority: 'high', statusId: 'open', progress: 0, notes: '', indent: 1, expanded: false, isParent: false, isCritical: true, isEditing: false, taskType: 'task', work: 32, actualWork: 0, remainingWork: 32, cost: 3200, actualCost: 0, baselineStart: '2026-02-20', baselineFinish: '2026-02-25', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'James Liu', percentWorkComplete: 0, milestoneFlag: false, summaryFlag: false, tags: ['unit-test'], riskLevel: 'low', group: 'Testing', calendarName: 'Standard', earlyStart: '2026-02-20', earlyFinish: '2026-02-25', lateStart: '2026-02-20', lateFinish: '2026-02-25', totalSlack: 0, freeSlack: 0 },
  { id: '14', wbs: `${key}-4.2`, taskName: 'Integration Testing', duration: 3, startDate: '2026-02-26', endDate: '2026-02-28', predecessors: `${key}-4.1`, successors: `${key}-4.3`, assigneeId: 'user-2', priority: 'high', statusId: 'open', progress: 0, notes: '', indent: 1, expanded: false, isParent: false, isCritical: true, isEditing: false, taskType: 'task', work: 24, actualWork: 0, remainingWork: 24, cost: 2400, actualCost: 0, baselineStart: '2026-02-26', baselineFinish: '2026-02-28', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'Sarah Chen', percentWorkComplete: 0, milestoneFlag: false, summaryFlag: false, tags: ['integration-test'], riskLevel: 'low', group: 'Testing', calendarName: 'Standard', earlyStart: '2026-02-26', earlyFinish: '2026-02-28', lateStart: '2026-02-26', lateFinish: '2026-02-28', totalSlack: 0, freeSlack: 0 },
  { id: '15', wbs: `${key}-4.3`, taskName: 'UAT', duration: 3, startDate: '2026-03-01', endDate: '2026-03-05', predecessors: `${key}-4.2`, successors: `${key}-5`, assigneeId: 'user-1', priority: 'high', statusId: 'open', progress: 0, notes: '', indent: 1, expanded: false, isParent: false, isCritical: true, isEditing: false, taskType: 'task', work: 24, actualWork: 0, remainingWork: 24, cost: 2400, actualCost: 0, baselineStart: '2026-03-01', baselineFinish: '2026-03-05', variance: 0, slack: 0, constraintType: 'asap', constraintDate: '', deadline: '', wbsLevel: 2, outlineLevel: 2, resourceNames: 'Alex Morgan', percentWorkComplete: 0, milestoneFlag: false, summaryFlag: false, tags: ['uat'], riskLevel: 'medium', group: 'Testing', calendarName: 'Standard', earlyStart: '2026-03-01', earlyFinish: '2026-03-05', lateStart: '2026-03-01', lateFinish: '2026-03-05', totalSlack: 0, freeSlack: 0 },
  { id: '16', wbs: `${key}-5`, taskName: 'Deployment', duration: 2, startDate: '2026-03-06', endDate: '2026-03-09', predecessors: `${key}-4.3`, successors: '', assigneeId: 'user-1', priority: 'critical', statusId: 'open', progress: 0, notes: '', indent: 0, expanded: false, isParent: false, isCritical: true, isEditing: false, taskType: 'milestone', work: 16, actualWork: 0, remainingWork: 16, cost: 1600, actualCost: 0, baselineStart: '2026-03-06', baselineFinish: '2026-03-09', variance: 0, slack: 0, constraintType: 'must-finish-on', constraintDate: '2026-03-09', deadline: '2026-03-09', wbsLevel: 1, outlineLevel: 1, resourceNames: 'Alex Morgan', percentWorkComplete: 0, milestoneFlag: true, summaryFlag: false, tags: ['deploy', 'release'], riskLevel: 'critical', group: 'Deployment', calendarName: 'Standard', earlyStart: '2026-03-06', earlyFinish: '2026-03-09', lateStart: '2026-03-06', lateFinish: '2026-03-09', totalSlack: 0, freeSlack: 0 },
];

interface ProjectGridViewProps {
  projectId?: string;
  projectKey?: string;
}

export function ProjectGridView({ projectId, projectKey = 'PRJ' }: ProjectGridViewProps) {
  const { 
    showToast, 
    currentUser, 
    users, 
    getFilteredTasks,
    addTask: addTaskContext, 
    updateTask: updateTaskContext, 
    deleteTask: deleteTaskContext,
    openModal,
    projects,
    isTaskDone,
    getStatusGroup,
    workflowStatuses,
    isTaskOverdue,
  } = useApp();

  const project = projects.find(p => p.id === projectId);

  const mapTaskToWBSRow = useCallback((task: Task, index: number, projectKey: string, isParent: boolean, indent: number): WBSRow => {
      const group = getStatusGroup(task.statusId);
      const progress = group ? GROUP_PROGRESS_MAP[group] : 0;

    return {
      id: task.id,
      wbs: task.key,
      taskName: task.title,
      duration: 1, 
      startDate: task.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      endDate: task.dueDate || new Date().toISOString().split('T')[0],
      predecessors: '',
      successors: '',
      assigneeId: task.assignee?.id || '',
      priority: task.priority,
      statusId: task.statusId,
      progress,
      notes: task.description || '',
      indent,
      expanded: true,
      isParent,
      isCritical: false,
      isEditing: false,
      parentId: task.parentId,
      taskType: task.type === 'epic' ? 'summary' : (task.isMilestone ? 'milestone' : 'task'),
      work: 8,
      actualWork: 0,
      remainingWork: 8,
      cost: 0,
      actualCost: 0,
      baselineStart: '',
      baselineFinish: '',
      variance: 0,
      slack: 0,
      constraintType: 'asap',
      constraintDate: '',
      deadline: task.dueDate || '',
      wbsLevel: 1,
      outlineLevel: 1,
      resourceNames: task.assignee?.name || '',
      percentWorkComplete: progress,
      milestoneFlag: task.isMilestone || false,
      summaryFlag: task.type === 'epic',
      tags: (task.tags || []).map(t => t.name),
      riskLevel: task.priority === 'critical' ? 'critical' : task.priority === 'high' ? 'high' : 'low',
      group: '',
      calendarName: 'Standard',
      earlyStart: '',
      earlyFinish: '',
      lateStart: '',
      lateFinish: '',
      totalSlack: 0,
      freeSlack: 0,
      isOverdue: isTaskOverdue(task),
    };
  }, [getStatusGroup, isTaskOverdue]);

  const projectTasks = useMemo(() => {
    const tasks = projectId ? getFilteredTasks(projectId) : [];
    
    // Hierarchical sort: roots first, then their subtasks
    const roots: Task[] = [];
    const parentMap = new Map<string, Task[]>();
    const taskIds = new Set(tasks.map(t => t.id));
    
    tasks.forEach(t => {
      // A task is a subtask if its parentId is present in the filtered results
      if (t.parentId && taskIds.has(t.parentId)) {
        if (!parentMap.has(t.parentId)) parentMap.set(t.parentId, []);
        parentMap.get(t.parentId)!.push(t);
      } else {
        roots.push(t);
      }
    });
    
    const sorted: Task[] = [];
    roots.forEach(root => {
      sorted.push(root);
      if (parentMap.has(root.id)) {
        sorted.push(...parentMap.get(root.id)!);
      }
    });

    return sorted;
  }, [getFilteredTasks, projectId]);

  const [rows, setRows] = useState<WBSRow[]>([]);

  // Update rows when tasks change
  useEffect(() => {
    const parentMap = new Map<string, boolean>();
    projectTasks.forEach(t => {
      if (t.parentId) {
        parentMap.set(t.parentId, true);
      }
    });
    const taskIds = new Set(projectTasks.map(t => t.id));

    const mappedRows = projectTasks.map((t: Task, i: number) => {
      const isParent = !!parentMap.get(t.id);
      // It's a subtask visually only if its parent is present in the current view
      const indent = t.parentId && taskIds.has(t.parentId) ? 1 : 0;
      return mapTaskToWBSRow(t, i, projectKey, isParent, indent);
    });
    setRows(mappedRows);
  }, [projectTasks, projectKey, mapTaskToWBSRow]);

  const [columns, setColumns] = useState<ColumnConfig[]>(allColumns);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: keyof WBSRow } | null>(null);
  const [showCriticalPath, setShowCriticalPath] = useState(false); // Default to false for real data until calculated
  const [hasChanges, setHasChanges] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Calculate critical path
  const calculateCriticalPath = useCallback((data: WBSRow[]) => {
    if (data.length === 0) return [];
    const wbsMap = new Map<string, WBSRow>();
    data.forEach(row => wbsMap.set(row.wbs, row));

    const earliestStart = new Map<string, number>();
    const earliestFinish = new Map<string, number>();
    const latestStart = new Map<string, number>();
    const latestFinish = new Map<string, number>();

    // Forward pass
    data.forEach(row => {
      const predecessorWBS = (row.predecessors || '').split(',').filter(p => p.trim());
      let maxFinish = 0;
      
      predecessorWBS.forEach(predWBS => {
        const predFinish = earliestFinish.get(predWBS.trim()) || 0;
        maxFinish = Math.max(maxFinish, predFinish);
      });
      
      earliestStart.set(row.wbs, maxFinish);
      earliestFinish.set(row.wbs, maxFinish + row.duration);
    });

    let projectEnd = 0;
    data.forEach(row => {
      const finish = earliestFinish.get(row.wbs) || 0;
      projectEnd = Math.max(projectEnd, finish);
    });

    // Backward pass
    [...data].reverse().forEach(row => {
      const successorWBS = (row.successors || '').split(',').filter(s => s.trim());
      
      if (successorWBS.length === 0) {
        latestFinish.set(row.wbs, projectEnd);
      } else {
        let minStart = projectEnd;
        successorWBS.forEach(succWBS => {
          const succStart = latestStart.get(succWBS.trim());
          if (succStart !== undefined) {
            minStart = Math.min(minStart, succStart);
          }
        });
        latestFinish.set(row.wbs, minStart);
      }
      
      latestStart.set(row.wbs, (latestFinish.get(row.wbs) || 0) - row.duration);
    });

    return data.map(row => {
      const es = earliestStart.get(row.wbs) || 0;
      const ls = latestStart.get(row.wbs) || 0;
      const slack = ls - es;
      return { ...row, isCritical: slack === 0, slack, totalSlack: slack };
    });
  }, []);

  const recalculateCriticalPath = useCallback(() => {
    setRows(prev => calculateCriticalPath(prev));
  }, [calculateCriticalPath]);

  // Get visible rows
  const visibleRows = useMemo(() => {
    const result: WBSRow[] = [];
    const hiddenParents = new Set<string>();

    rows.forEach(row => {
      let isHidden = false;
      
      // If parent is hidden, or if parent is collapsed, we hide this row
      if (row.parentId && hiddenParents.has(row.parentId)) {
        isHidden = true;
      }

      if (!isHidden) {
        result.push(row);
      }
      
      // A row is considered a 'hidden parent' for its children if:
      // 1. It is hidden itself OR
      // 2. It is collapsed
      if (isHidden || (row.isParent && !row.expanded)) {
        hiddenParents.add(row.id);
      }
    });

    return result;
  }, [rows]);

  const visibleColumns = columns.filter(c => c.visible);

  const toggleRowExpand = (id: string) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, expanded: !row.expanded } : row
    ));
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllRows = () => {
    if (selectedRows.size === visibleRows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(visibleRows.map(r => r.id)));
    }
  };

  const updateCell = (rowId: string, field: keyof WBSRow, value: any) => {
    const updates: any = {}; // Use any to avoid strict Partial<Task> issues with internal grid state
    if (field === 'taskName') updates.title = value as string;
    if (field === 'statusId') updates.statusId = value as string;
    if (field === 'priority') updates.priority = value as TaskPriority;
    if (field === 'assigneeId') {
      const user = users.find(u => u.id === value);
      if (user) updates.assignee = user;
    }
    
    // Optimistic UI
    setRows(prev => prev.map(row => {
      if (row.id === rowId) {
        return { ...row, [field]: value };
      }
      return row;
    }));

    if (Object.keys(updates).length > 0) {
      updateTaskContext(rowId, updates);
    }
    
    setHasChanges(true); // Still keep this for path recalculation if desired
    setEditingCell(null);
  };

  const toggleColumn = (columnId: string) => {
    setColumns(prev => prev.map(c => 
      c.id === columnId ? { ...c, visible: !c.visible } : c
    ));
  };

  const saveChanges = () => {
    recalculateCriticalPath();
    setHasChanges(false);
    showToast({ title: 'Changes saved', description: 'Critical path recalculated', type: 'success' });
  };



  const getPriorityColor = (priority: TaskPriority) => {
    const colors: Record<TaskPriority, string> = {
      'critical': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'low': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return colors[priority];
  };

  const getRiskColor = (risk: string) => {
    const colors: Record<string, string> = {
      'low': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'critical': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[risk] || 'bg-muted text-muted-foreground';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'milestone': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'summary': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'task': 'bg-muted text-muted-foreground',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const renderCell = (row: WBSRow, column: ColumnConfig) => {
    const field = column.id as keyof WBSRow;
    const value = row[field];
    const isEditing = editingCell?.rowId === row.id && editingCell?.field === field;

    if (column.type === 'actions') {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6">
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem><Copy className="size-3.5 mr-2" />Duplicate</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive"><Trash2 className="size-3.5 mr-2" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (column.type === 'progress') {
      return (
        <div className="flex items-center gap-2 px-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                (value as number) === 100 ? 'bg-green-500' : 'bg-primary'
              )}
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground w-10 text-right">{value}%</span>
        </div>
      );
    }

    if (column.type === 'avatar' && field === 'assigneeId') {
      const user = users.find(u => u.id === value);
      return (
        <div className="flex flex-col gap-0.5 px-2 py-0.5">
          {user ? (
            <div className="flex items-center gap-1.5">
              <UserAvatar user={user} size="xs" />
              <span className="text-xs truncate">{user.name.split(' ')[0]}</span>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground">-</span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1 text-[9px] font-medium text-blue-700 dark:text-blue-300 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700 rounded px-1.5 py-0.5 w-fit transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="size-2.5" />
                Assign
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  updateCell(row.id, 'assigneeId', currentUser.id);
                  showToast({ title: 'Assigned to you', type: 'success' });
                }}
                className="flex items-center gap-2 text-primary font-medium"
              >
                <UserCheck className="size-3.5 shrink-0 text-primary" />
                <span className="text-xs">Assign to me</span>
                {value === currentUser.id && (
                  <UserCheck className="size-3 ml-auto text-primary" />
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {users.map((u) => (
                <DropdownMenuItem
                  key={u.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateCell(row.id, 'assigneeId', u.id);
                    showToast({ title: `Assigned to ${u.name}`, type: 'success' });
                  }}
                  className="flex items-center gap-2"
                >
                  <UserAvatar user={u} size="xs" />
                  <span className="text-xs">{u.name}</span>
                  {value === u.id && <UserCheck className="size-3 ml-auto text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    if (column.type === 'badge') {
      if (field === 'priority') {
        return <Badge className={cn('text-[10px] px-1.5', getPriorityColor(value as TaskPriority))}>{String(value)}</Badge>;
      }
      if (field === 'statusId') {
        const status = workflowStatuses.find(s => s.id === String(value));
        return (
          <Badge 
            variant="secondary"
            className="text-[10px] px-1.5"
            style={{ backgroundColor: (status?.color || '#94a3b8') + '20', color: status?.color || '#94a3b8' }}
          >
            <div className="flex items-center gap-1">
              <div className="size-1.5 rounded-full" style={{ backgroundColor: status?.color || '#94a3b8' }} />
              {status?.name || 'Unknown'}
            </div>
          </Badge>
        );
      }
      if (field === 'taskType') {
        return <Badge className={cn('text-[10px] px-1.5', getTypeColor(String(value)))}>{String(value)}</Badge>;
      }
      if (field === 'riskLevel') {
        return <Badge className={cn('text-[10px] px-1.5', getRiskColor(String(value)))}>{String(value)}</Badge>;
      }
    }

    if (column.type === 'checkbox') {
      return <Checkbox checked={!!value} onCheckedChange={(checked) => updateCell(row.id, field, !!checked)} />;
    }

    if (column.type === 'number') {
      if (field === 'cost' || field === 'actualCost') {
        return <span className="text-xs px-2">${(value as number).toLocaleString()}</span>;
      }
      return <span className="text-xs px-2 text-center">{value}</span>;
    }

    if (isEditing) {
      return (
        <Input
          autoFocus
          defaultValue={String(value)}
          className="h-6 text-xs px-1"
          onBlur={(e) => updateCell(row.id, field, column.type === 'number' ? Number(e.target.value) : e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') updateCell(row.id, field, column.type === 'number' ? Number(e.currentTarget.value) : e.currentTarget.value);
            if (e.key === 'Escape') setEditingCell(null);
          }}
        />
      );
    }

    return (
      <div 
        className={cn(
          "px-2 py-0.5 cursor-pointer hover:bg-muted/50 rounded text-xs truncate",
          field === 'endDate' && row.isOverdue && "text-destructive font-medium"
        )}
        onClick={() => setEditingCell({ rowId: row.id, field })}
      >
        {String(value) || '-'}
      </div>
    );
  };

  const totalWidth = visibleColumns.reduce((sum, c) => sum + c.width, 0) + 42; // +42 for checkbox column

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-card rounded-lg border overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 gap-1" onClick={() => openModal('create-task', { projectId })}>
              <Plus className="size-3.5" />
              Add Task
            </Button>
            <div className="h-4 w-px bg-border" />
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7"
              onClick={() => {
                if (selectedRows.size > 0) {
                  const idsToDelete = Array.from(selectedRows);
                  idsToDelete.forEach(id => deleteTaskContext(id));
                  setSelectedRows(new Set());
                  showToast({ title: `${idsToDelete.length} tasks removed`, type: 'success' });
                }
              }}
              disabled={selectedRows.size === 0}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showCriticalPath ? 'default' : 'outline'}
              className="h-7 gap-1"
              onClick={() => setShowCriticalPath(!showCriticalPath)}
            >
              <Route className="size-3.5" />
              Critical Path
            </Button>
            
            <DropdownMenu open={showColumnPicker} onOpenChange={setShowColumnPicker}>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 gap-1">
                  <Columns className="size-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
                {columns.map(col => (
                  <DropdownMenuItem key={col.id} onClick={() => toggleColumn(col.id as string)} className="gap-2">
                    <Checkbox checked={col.visible} className="size-4" />
                    <span className="text-xs">{col.label || col.id}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {hasChanges && (
              <>
                <Button size="sm" className="h-7 gap-1" onClick={saveChanges}>
                  <Save className="size-3.5" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Grid with horizontal scroll */}
        <div className="flex-1 overflow-auto">
          <div style={{ minWidth: `${totalWidth}px` }}>
            {/* Header */}
            <div className="flex items-center border-b bg-muted/50 sticky top-0 z-10">
              <div className="w-[42px] flex items-center justify-center p-2 border-r shrink-0">
                <Checkbox 
                  checked={selectedRows.size === visibleRows.length && visibleRows.length > 0}
                  onCheckedChange={selectAllRows}
                />
              </div>
              {visibleColumns.map(col => (
                <div 
                  key={col.id}
                  style={{ width: col.width }}
                  className={cn(
                    "px-2 py-2 text-xs font-medium border-r shrink-0 truncate",
                    col.frozen && "bg-muted/80"
                  )}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Rows */}
            {visibleRows.map((row) => (
              <div 
                key={row.id}
                className={cn(
                  'flex items-center border-b hover:bg-muted/30 transition-colors',
                  selectedRows.has(row.id) && 'bg-primary/5',
                  row.isOverdue && 'bg-destructive/5 hover:bg-destructive/10 dark:bg-destructive/10 dark:hover:bg-destructive/20',
                  showCriticalPath && row.isCritical && 'bg-red-50 dark:bg-red-950/20 border-l-2 border-l-red-500'
                )}
              >
                <div className="w-[42px] flex items-center justify-center p-2 border-r shrink-0">
                  <Checkbox 
                    checked={selectedRows.has(row.id)}
                    onCheckedChange={() => toggleRowSelection(row.id)}
                  />
                </div>
                
                {visibleColumns.map(col => {
                  // Special handling for WBS and Task Name (frozen columns with expand/collapse)
                  if (col.id === 'wbs') {
                    return (
                      <div 
                        key={col.id}
                        style={{ width: col.width }}
                        className={cn("px-2 py-1 text-xs font-mono border-r flex items-center gap-1 shrink-0", col.frozen && "bg-card")}
                      >
                        {showCriticalPath && row.isCritical && (
                          <Tooltip>
                            <TooltipTrigger><AlertTriangle className="size-3 text-red-500" /></TooltipTrigger>
                            <TooltipContent>Critical Path</TooltipContent>
                          </Tooltip>
                        )}
                        {row.wbs}
                      </div>
                    );
                  }
                  
                  if (col.id === 'taskName') {
                    return (
                      <div 
                        key={col.id}
                        style={{ width: col.width, paddingLeft: `${row.indent * 16 + 8}px` }}
                        className={cn("py-1 border-r flex items-center justify-between shrink-0 group/wbs-title", col.frozen && "bg-card")}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          {row.isParent && (
                            <button onClick={() => toggleRowExpand(row.id)} className="p-0.5 hover:bg-muted rounded shrink-0">
                              {row.expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                            </button>
                          )}
                          <span className={cn(
                            "text-xs truncate flex items-center gap-1", 
                            row.isParent && "font-medium",
                            row.isOverdue && "text-destructive font-medium"
                          )}>
                            {row.milestoneFlag && (
                              <Star className="size-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                            )}
                            {row.taskName}
                          </span>
                        </div>
                        <div className="flex items-center opacity-0 group-hover/wbs-title:opacity-100 transition-opacity pr-1">
                           <TaskWatchButton taskId={row.id} size="xs" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={col.id}
                      style={{ width: col.width }}
                      className="border-r flex items-center shrink-0"
                    >
                      {renderCell(row, col)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-4">
            <span>{visibleRows.length} tasks</span>
            {selectedRows.size > 0 && <span>{selectedRows.size} selected</span>}
            {showCriticalPath && (
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-sm" />
                {rows.filter(r => r.isCritical).length} critical path items
              </span>
            )}
          </div>
          <div>{visibleColumns.length} of {columns.length} columns visible - Scroll horizontally to see all</div>
        </div>
      </div>
    </TooltipProvider>
  );
}
