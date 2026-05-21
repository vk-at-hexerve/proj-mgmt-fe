'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  MoreHorizontal,
  Calendar,
  Bug,
  BookOpen,
  Zap,
  ListTodo,
  Maximize2,
  Minimize2,
  Users,
  Pencil,
  Check,
  Workflow,
  PlusCircle,
  Settings,
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import type { Task, TaskPriority, WorkflowStatus, WorkflowGroupKey } from '@/lib/types';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────────────────────────

const GROUP_ORDER: Record<WorkflowGroupKey, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  ON_HOLD: 2,
  CLOSED: 3,
};

const GROUP_PROGRESS_MAP: Record<WorkflowGroupKey, number> = {
  OPEN: 0,
  IN_PROGRESS: 50,
  ON_HOLD: 80,
  CLOSED: 100,
};

const GROUP_BACKGROUND_STYLES: Record<WorkflowGroupKey, string> = {
  OPEN: 'bg-slate-100/85 border-slate-200/70',
  IN_PROGRESS: 'bg-indigo-100/85 border-indigo-200/70',
  ON_HOLD: 'bg-amber-100/85 border-amber-200/70',
  CLOSED: 'bg-emerald-100/85 border-emerald-200/70',
};

const GROUP_LABELS: Record<WorkflowGroupKey, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  CLOSED: 'Closed',
};

const GROUP_TEXT_COLOR: Record<WorkflowGroupKey, string> = {
  OPEN: 'text-slate-500/90 dark:text-slate-400',
  IN_PROGRESS: 'text-indigo-600/90 dark:text-indigo-400',
  ON_HOLD: 'text-amber-600/90 dark:text-amber-400',
  CLOSED: 'text-emerald-600/90 dark:text-emerald-400',
};

const COLOR_PRESETS = [
  '#94a3b8', // slate
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
];

const priorityBorder: Record<TaskPriority, string> = {
  critical: 'border-l-destructive',
  high: 'border-l-warning',
  medium: 'border-l-accent',
  low: 'border-l-muted-foreground',
};

const priorityDots: Record<TaskPriority, string> = {
  critical: 'bg-destructive',
  high: 'bg-warning',
  medium: 'bg-accent',
  low: 'bg-muted-foreground',
};

const typeIcons: Record<Task['type'], React.ReactNode> = {
  epic: <Zap className="size-4 text-primary" />,
  story: <BookOpen className="size-4 text-accent" />,
  task: <ListTodo className="size-4 text-muted-foreground" />,
  subtask: <ListTodo className="size-4 text-muted-foreground" />,
  bug: <Bug className="size-4 text-destructive" />,
};

// ─── Components ─────────────────────────────────────────────────────────────

interface KanbanCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onEdit: () => void;
  onAssign: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
}

function KanbanCard({ task, onDragStart, onEdit, onAssign, onDelete, onViewDetail }: KanbanCardProps) {
  const { getStatusGroup } = useApp();
  const group = getStatusGroup(task.statusId);
  const progressPct = group ? GROUP_PROGRESS_MAP[group] : 0;
  const isDone = group === 'CLOSED';

  return (
    <Card
      className={cn(
        'cursor-grab active:cursor-grabbing border-l-4 hover:shadow-md transition-shadow group py-2 gap-2',
        priorityBorder[task.priority]
      )}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onViewDetail}
    >
      <CardContent className="p-3 pt-3 space-y-2.5">
        {/* Top row: type icon + key + menu */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {typeIcons[task.type]}
            <span className="text-xs font-mono leading-none text-muted-foreground">{task.key}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-1 -mt-1"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>Edit task</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssign(); }}>Assign to...</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title */}
        <p className="text-sm font-medium leading-snug line-clamp-2">{task.title}</p>

        {/* Footer row: tags + priority dot + due date + assignee */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {task.tags.slice(0, 1).map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs px-2 py-0.5 h-5 leading-none shrink-0 font-medium"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {task.tags.length > 1 && (
              <span className="text-xs text-muted-foreground font-medium">+{task.tags.length - 1}</span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto shrink-0 leading-none font-medium">
                <Calendar className="size-3.5" />
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className={cn('size-2 rounded-full', priorityDots[task.priority])} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {task.assignee ? (
                    <UserAvatar user={task.assignee} size="sm" />
                  ) : (
                    <div className="size-6 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center">
                      <Users className="size-3 text-muted-foreground/40" />
                    </div>
                  )}
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {task.assignee ? task.assignee.name : 'Unassigned'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Slim progress bar */}
        {progressPct > 0 && (
          <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', isDone ? 'bg-success' : 'bg-primary')}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface KanbanColumnProps {
  status: WorkflowStatus;
  tasks: Task[];
  isFullscreen: boolean;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, statusId: string) => void;
  onAddTask: () => void;
  onEditTask: (taskId: string) => void;
  onAssignTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTaskDetail: (taskId: string) => void;
  onEditStatus: () => void;
}

function KanbanColumn({
  status,
  tasks,
  isFullscreen,
  onDragStart,
  onDragOver,
  onDrop,
  onAddTask,
  onEditTask,
  onAssignTask,
  onDeleteTask,
  onViewTaskDetail,
  onEditStatus,
}: KanbanColumnProps) {
  return (
    <div
      className={cn(
        'flex flex-col bg-background/70 rounded-lg group/column shrink-0 border border-border/40 backdrop-blur-[1px]',
        isFullscreen ? 'min-w-[310px] max-w-[310px]' : 'min-w-[290px] max-w-[290px]'
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status.id)}
    >
      <CardHeader className="p-3.5 pb-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
            <div className="flex items-center gap-1.5 min-w-0 flex-1 group/header">
              <h3 className="font-semibold text-sm truncate">{status.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover/header:opacity-100 transition-opacity shrink-0"
                onClick={onEditStatus}
              >
                <Pencil className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              variant="secondary"
              className="text-xs px-2 py-0.5 h-5 shrink-0 font-medium"
            >
              {tasks.length}
            </Badge>
            <Button variant="ghost" size="icon" className="size-7" onClick={onAddTask}>
              <Plus className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <div
        className={cn(
          'flex-1 p-3 pt-1.5 space-y-2.5 overflow-y-auto custom-scrollbar',
          isFullscreen ? 'max-h-[calc(100vh-120px)]' : 'max-h-[calc(100vh-220px)]'
        )}
      >
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onEdit={() => onEditTask(task.id)}
            onAssign={() => onAssignTask(task.id)}
            onDelete={() => onDeleteTask(task.id)}
            onViewDetail={() => onViewTaskDetail(task.id)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Workflow Status Dialog Component ──────────────────────────────────────────

interface WorkflowStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: WorkflowStatus | null; // null means Create mode
  projectId: string;
  onSave: (name: string, groupKey: WorkflowGroupKey, color: string) => void;
}

function WorkflowStatusModal({ isOpen, onClose, status, projectId, onSave }: WorkflowStatusModalProps) {
  const [name, setName] = useState('');
  const [groupKey, setGroupKey] = useState<WorkflowGroupKey>('OPEN');
  const [color, setColor] = useState(COLOR_PRESETS[0]);

  // Synchronize internal state when the modal is opened or changes mode
  React.useEffect(() => {
    if (isOpen) {
      if (status) {
        setName(status.name);
        setGroupKey(status.groupKey);
        setColor(status.color);
      } else {
        setName('');
        setGroupKey('OPEN');
        setColor(COLOR_PRESETS[0]);
      }
    }
  }, [isOpen, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), groupKey, color);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{status ? 'Edit Status' : 'Add New Status'}</DialogTitle>
          <DialogDescription>
            {status
              ? 'Update this workflow stage for this project'
              : 'Create a custom workflow stage for this project'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="modal-status-name" className="text-[10px] uppercase font-bold text-slate-500">Name</Label>
              <Input
                id="modal-status-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. In Review"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Group</Label>
              <Select value={groupKey} onValueChange={(v) => setGroupKey(v as WorkflowGroupKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-500">Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={cn(
                      "size-6 rounded-full border-2 transition-all",
                      color === p ? "border-primary scale-110 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                    style={{ backgroundColor: p }}
                    onClick={() => setColor(p)}
                  >
                    {color === p && <Check className="size-3 text-white mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2" disabled={!name.trim()}>
              <Check className="size-4" />
              {status ? 'Save Changes' : 'Create Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main KanbanBoard ───────────────────────────────────────────────────────

interface KanbanBoardProps {
  projectId?: string;
  isFullscreen?: boolean;
  setIsFullscreen?: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export function KanbanBoard({
  projectId,
  isFullscreen: propIsFullscreen,
  setIsFullscreen: propSetIsFullscreen,
}: KanbanBoardProps) {
  const {
    tasks,
    updateTaskStatus,
    openModal,
    getProjectStatuses,
    addWorkflowStatus,
    updateWorkflowStatus,
  } = useApp();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  
  // Local fallback if props are not passed
  const [localIsFullscreen, setLocalIsFullscreen] = useState(false);
  const isFullscreen = propIsFullscreen !== undefined ? propIsFullscreen : localIsFullscreen;
  const setIsFullscreen = propSetIsFullscreen !== undefined ? propSetIsFullscreen : setLocalIsFullscreen;

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, setIsFullscreen]);

  // Unified modal-based status editing state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<WorkflowStatus | null>(null);

  // Derive columns dynamically from project statuses
  const columns = useMemo(() => {
    if (!projectId) return [];
    const statuses = getProjectStatuses(projectId);
    return [...statuses].sort((a, b) => {
      // Sort by group order first
      if (GROUP_ORDER[a.groupKey] !== GROUP_ORDER[b.groupKey]) {
        return GROUP_ORDER[a.groupKey] - GROUP_ORDER[b.groupKey];
      }
      // Then by position within group
      return a.position - b.position;
    });
  }, [getProjectStatuses, projectId]);

  const groupedColumns = useMemo(() => {
    const orderedGroupKeys: WorkflowGroupKey[] = ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'CLOSED'];

    return orderedGroupKeys
      .map((groupKey) => ({
        groupKey,
        statuses: columns.filter((status) => status.groupKey === groupKey),
      }))
      .filter((group) => group.statuses.length > 0);
  }, [columns]);

  const filteredTasks = projectId
    ? tasks.filter((t) => t.projectId === projectId)
    : tasks;

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatusId: string) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    updateTaskStatus(draggedTaskId, newStatusId);
    setDraggedTaskId(null);
  };

  const handleAddTask = (statusId: string) => {
    openModal('create-task', { projectId, initialStatusId: statusId });
  };

  const handleEditTask = (taskId: string) => openModal('edit-task', { taskId });
  const handleAssignTask = (taskId: string) => openModal('assign-task', { taskId });
  const handleDeleteTask = (taskId: string) => openModal('confirm-delete', { taskId });
  const handleViewTaskDetail = (taskId: string) => openModal('task-detail', { taskId });

  const handleOpenAddStatus = () => {
    setEditingStatus(null);
    setStatusModalOpen(true);
  };

  const handleSaveStatus = (name: string, groupKey: WorkflowGroupKey, color: string) => {
    if (!projectId) return;
    if (editingStatus) {
      // Update existing workflow status
      updateWorkflowStatus(editingStatus.id, { name, groupKey, color });
    } else {
      // Add new workflow status
      addWorkflowStatus(projectId, { name, groupKey, color });
    }
  };

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-xl bg-muted/20">
        <Workflow className="size-10 text-muted-foreground/30 mb-4" />
        <h3 className="text-sm font-semibold text-muted-foreground">Select a project to view its board</h3>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-0 w-full max-w-full h-full min-w-0 overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 bg-background p-4'
      )}
    >
      {isFullscreen && (
        <div className="flex items-center justify-between mb-4 shrink-0 px-2">
          <h2 className="text-base font-semibold text-muted-foreground tracking-wide uppercase">Project Board (Fullscreen)</h2>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-sm bg-transparent"
            onClick={() => setIsFullscreen(false)}
          >
            <Minimize2 className="size-4" />
            Exit Fullscreen
          </Button>
        </div>
      )}

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-0 w-full">
        {groupedColumns.map((group) => (
          <div
            key={group.groupKey}
            className={cn(
              'flex flex-col shrink-0 rounded-lg border p-3 gap-3 shadow-sm',
              GROUP_BACKGROUND_STYLES[group.groupKey]
            )}
          >
            <div className="flex items-center justify-between px-1.5 py-0.5 select-none">
              <span className={cn(
                'text-xs font-bold tracking-wider uppercase',
                GROUP_TEXT_COLOR[group.groupKey]
              )}>
                {GROUP_LABELS[group.groupKey]}
              </span>
            </div>

            <div className="flex gap-4 shrink-0 flex-1">
              {group.statuses.map((status) => (
                <KanbanColumn
                  key={status.id}
                  status={status}
                  tasks={filteredTasks.filter((t) => t.statusId === status.id)}
                  isFullscreen={isFullscreen}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onAddTask={() => handleAddTask(status.id)}
                  onEditTask={handleEditTask}
                  onAssignTask={handleAssignTask}
                  onDeleteTask={handleDeleteTask}
                  onViewTaskDetail={handleViewTaskDetail}
                  onEditStatus={() => {
                    setEditingStatus(status);
                    setStatusModalOpen(true);
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Add Status Button */}
        <div className="flex items-start pt-0 shrink-0">
          <Button
            variant="outline"
            className={cn(
              "h-12 border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 group transition-all",
              isFullscreen ? 'min-w-[310px] max-w-[310px]' : 'min-w-[290px] max-w-[290px]'
            )}
            onClick={handleOpenAddStatus}
          >
            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary">
              <PlusCircle className="size-4" />
              <span className="text-sm font-medium">Add Status</span>
            </div>
          </Button>
        </div>
      </div>

      <WorkflowStatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        status={editingStatus}
        projectId={projectId}
        onSave={handleSaveStatus}
      />
    </div>
  );
}

