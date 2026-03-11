'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import type { Task, TaskStatus, TaskPriority } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Column {
  id: TaskStatus;
  title: string;
  color: string;
  wipLimit?: number;
}

const columns: Column[] = [
  { id: 'open', title: 'Open', color: 'bg-muted-foreground' },
  { id: 'assigned', title: 'Assigned', color: 'bg-accent' },
  { id: 'in-progress', title: 'In Progress', color: 'bg-primary', wipLimit: 5 },
  { id: 'pending-approval', title: 'Pending Approval', color: 'bg-warning' },
  { id: 'closed', title: 'Closed', color: 'bg-success' },
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

interface KanbanCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onEdit: () => void;
  onAssign: () => void;
  onDelete: () => void;
  onViewDetail: () => void;
}

function KanbanCard({ task, onDragStart, onEdit, onAssign, onDelete, onViewDetail }: KanbanCardProps) {
  const progressPct =
    task.status === 'closed' ? 100
    : task.status === 'in-progress' ? 50
    : task.status === 'pending-approval' ? 80
    : 0;

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
              className={cn('h-full rounded-full', task.status === 'closed' ? 'bg-success' : 'bg-primary')}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  isFullscreen: boolean;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onAddTask: () => void;
  onEditTask: (taskId: string) => void;
  onAssignTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onViewTaskDetail: (taskId: string) => void;
}

function KanbanColumn({
  column,
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
}: KanbanColumnProps) {
  const isOverLimit = column.wipLimit && tasks.length > column.wipLimit;

  return (
    <div
      className={cn(
        'flex flex-col bg-muted/30 rounded-lg',
        isFullscreen ? 'min-w-[280px] max-w-[280px]' : 'min-w-[260px] max-w-[260px]'
      )}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <CardHeader className="p-2.5 pb-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={cn('size-2 rounded-full', column.color)} />
            <h3 className="font-medium text-xs">{column.title}</h3>
            <Badge
              variant="secondary"
              className={cn('text-[10px] px-1.5 py-0 h-4', isOverLimit && 'bg-destructive/20 text-destructive')}
            >
              {tasks.length}{column.wipLimit && `/${column.wipLimit}`}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="size-6" onClick={onAddTask}>
            <Plus className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
      <div
        className={cn(
          'flex-1 p-2 pt-1 space-y-1.5 overflow-y-auto',
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

interface KanbanBoardProps {
  projectId?: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { tasks, updateTaskStatus, openModal } = useApp();
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

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

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    updateTaskStatus(draggedTaskId, newStatus);
    setDraggedTaskId(null);
  };

  const handleAddTask = () => openModal('create-task', { projectId });
  const handleEditTask = (taskId: string) => openModal('edit-task', { taskId });
  const handleAssignTask = (taskId: string) => openModal('assign-task', { taskId });
  const handleDeleteTask = (taskId: string) => openModal('confirm-delete', { taskId });
  const handleViewTaskDetail = (taskId: string) => openModal('task-detail', { taskId });

  return (
    <div
      className={cn(
        'flex flex-col gap-0',
        isFullscreen && 'fixed inset-0 z-50 bg-background p-4'
      )}
    >
      {/* Fullscreen toolbar */}
      <div className="flex items-center justify-end mb-2">
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

      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={filteredTasks.filter((t) => t.status === column.id)}
            isFullscreen={isFullscreen}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onAssignTask={handleAssignTask}
            onDeleteTask={handleDeleteTask}
            onViewTaskDetail={handleViewTaskDetail}
          />
        ))}
      </div>
    </div>
  );
}
