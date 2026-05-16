'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  epic: <Zap className="size-3 text-primary" />,
  story: <BookOpen className="size-3 text-accent" />,
  task: <ListTodo className="size-3 text-muted-foreground" />,
  subtask: <ListTodo className="size-3 text-muted-foreground" />,
  bug: <Bug className="size-3 text-destructive" />,
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
        'cursor-grab active:cursor-grabbing border-l-4 hover:shadow-md transition-shadow group',
        priorityBorder[task.priority]
      )}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onViewDetail}
    >
      <CardContent className="p-2.5 space-y-1.5">
        {/* Top row: type icon + key + menu */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {typeIcons[task.type]}
            <span className="text-[10px] font-mono text-muted-foreground">{task.key}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreHorizontal className="size-3.5" />
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
        <p className="text-xs font-medium leading-snug line-clamp-2">{task.title}</p>

        {/* Footer row: tags + priority dot + due date + assignee */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {task.tags.slice(0, 1).map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-[9px] px-1 py-0 leading-4 shrink-0"
                style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {task.tags.length > 1 && (
              <span className="text-[9px] text-muted-foreground">+{task.tags.length - 1}</span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground ml-auto shrink-0">
                <Calendar className="size-2.5" />
                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div className={cn('size-1.5 rounded-full', priorityDots[task.priority])} />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {task.assignee ? (
                    <Avatar className="size-5">
                      <AvatarImage src={task.assignee.avatar || '/placeholder.svg'} alt={task.assignee.name} />
                      <AvatarFallback className="text-[8px]">
                        {task.assignee.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="size-5 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center">
                      <Users className="size-2.5 text-muted-foreground/40" />
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
          <div className="h-0.5 bg-muted rounded-full overflow-hidden">
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
  onRename: (newName: string) => void;
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
  onRename,
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(status.name);

  const handleRenameSubmit = () => {
    if (editName.trim() && editName !== status.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-muted/30 rounded-lg group/column shrink-0',
        isFullscreen ? 'min-w-[280px] max-w-[280px]' : 'min-w-[260px] max-w-[260px]'
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status.id)}
    >
      <CardHeader className="p-2.5 pb-1.5">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                autoFocus
                className="h-6 text-xs py-0 px-1"
              />
            ) : (
              <div className="flex items-center gap-1 min-w-0 flex-1 group/header">
                <h3 className="font-medium text-xs truncate">{status.name}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-4 opacity-0 group-hover/header:opacity-100 transition-opacity"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-2.5 text-muted-foreground" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 shrink-0"
            >
              {tasks.length}
            </Badge>
            <Button variant="ghost" size="icon" className="size-6" onClick={onAddTask}>
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <div
        className={cn(
          'flex-1 p-2 pt-1 space-y-1.5 overflow-y-auto custom-scrollbar',
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
          <div className="flex items-center justify-center h-16 border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <p className="text-[10px] text-muted-foreground">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AddStatusButton({ projectId, onAdd }: { projectId: string; onAdd: (name: string, groupKey: WorkflowGroupKey, color: string) => void }) {
  const [name, setName] = useState('');
  const [groupKey, setGroupKey] = useState<WorkflowGroupKey>('OPEN');
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim(), groupKey, color);
      setName('');
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 min-w-[260px] max-w-[260px] border-dashed border-2 hover:bg-primary/5 hover:border-primary/50 group transition-all"
        >
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary">
            <PlusCircle className="size-4" />
            <span className="text-sm font-medium">Add Status</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">Add New Status</h4>
            <p className="text-[10px] text-muted-foreground">Create a custom workflow stage for this project</p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="status-name" className="text-[10px] uppercase font-bold text-slate-500">Name</Label>
              <Input
                id="status-name"
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
          <Button type="submit" className="w-full gap-2" disabled={!name.trim()}>
            <Check className="size-4" />
            Create Status
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main KanbanBoard ───────────────────────────────────────────────────────

interface KanbanBoardProps {
  projectId?: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const {
    tasks,
    updateTaskStatus,
    openModal,
    getProjectStatuses,
    addWorkflowStatus,
    updateWorkflowStatus,
  } = useApp();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const handleAddStatus = (name: string, groupKey: WorkflowGroupKey, color: string) => {
    if (projectId) {
      addWorkflowStatus(projectId, { name, groupKey, color });
    }
  };

  const handleRenameColumn = (statusId: string, newName: string) => {
    updateWorkflowStatus(statusId, { name: newName });
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
      <div className="flex items-center justify-end mb-4 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground mr-2"
          onClick={() => openModal('status-settings', { projectId })}
        >
          <Settings className="size-3.5" />
          Workflow Settings
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground"
          onClick={() => setIsFullscreen((f) => !f)}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="size-3.5" />
              Exit Fullscreen
            </>
          ) : (
            <>
              <Maximize2 className="size-3.5" />
              Fullscreen
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar min-h-0 w-full">
        {columns.map((status, idx) => {
          // Visual group separators
          const showGroupSeparator = idx === 0 || columns[idx - 1].groupKey !== status.groupKey;

          return (
            <React.Fragment key={status.id}>
              {showGroupSeparator && (
                <div className="flex flex-col gap-3 py-2 px-1 border-l border-border/50 first:border-l-0 shrink-0">
                  <div className="flex items-center justify-center min-w-[24px]">
                    <span className="[writing-mode:vertical-lr] rotate-180 text-[9px] font-bold tracking-[0.2em] text-muted-foreground/50 uppercase whitespace-nowrap">
                      {status.groupKey.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              )}
              <KanbanColumn
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
                onRename={(newName) => handleRenameColumn(status.id, newName)}
              />
            </React.Fragment>
          );
        })}

        {/* Add Status Button */}
        <div className="flex items-start pt-0 shrink-0">
          <AddStatusButton projectId={projectId} onAdd={handleAddStatus} />
        </div>
      </div>
    </div>
  );
}
