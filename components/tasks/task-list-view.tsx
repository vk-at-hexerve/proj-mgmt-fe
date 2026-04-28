'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useApp } from '@/lib/app-context';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  AlertCircle,
  Calendar,
  Bug,
  Bookmark,
  CheckSquare,
  Layers,
  Pencil,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  CornerDownRight,
  UserCheck,
} from 'lucide-react';
import type { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface TaskListViewProps {
  projectId?: string;
}

interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  sortable: boolean;
  visible: boolean;
}

const priorityConfig: Record<TaskPriority, { icon: React.ReactNode; color: string; label: string }> = {
  critical: { icon: <AlertCircle className="size-4" />, color: 'text-destructive', label: 'Critical' },
  high: { icon: <ArrowUp className="size-4" />, color: 'text-warning', label: 'High' },
  medium: { icon: <ArrowRight className="size-4" />, color: 'text-primary', label: 'Medium' },
  low: { icon: <ArrowDown className="size-4" />, color: 'text-muted-foreground', label: 'Low' },
};

const typeConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  epic: { icon: <Layers className="size-4" />, color: 'text-purple-500' },
  story: { icon: <Bookmark className="size-4" />, color: 'text-green-500' },
  task: { icon: <CheckSquare className="size-4" />, color: 'text-blue-500' },
  subtask: { icon: <CheckSquare className="size-3" />, color: 'text-blue-400' },
  bug: { icon: <Bug className="size-4" />, color: 'text-red-500' },
};

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  'open': { label: 'Open', color: 'bg-muted text-muted-foreground' },
  'assigned': { label: 'Assigned', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  'in-progress': { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  'pending-approval': { label: 'Pending Review', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  'on-hold': { label: 'On Hold', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' },
  'closed': { label: 'Done', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
};

const defaultColumns: ColumnConfig[] = [
  { id: 'type', label: 'Type', width: 56, minWidth: 40, sortable: false, visible: true },
  { id: 'key', label: 'Key', width: 100, minWidth: 80, sortable: true, visible: true },
  { id: 'title', label: 'Title', width: 280, minWidth: 150, sortable: true, visible: true },
  { id: 'status', label: 'Status', width: 130, minWidth: 100, sortable: true, visible: true },
  { id: 'progress', label: '% Complete', width: 120, minWidth: 90, sortable: true, visible: true },
  { id: 'priority', label: 'Priority', width: 110, minWidth: 80, sortable: true, visible: true },
  { id: 'assignee', label: 'Assignee', width: 160, minWidth: 100, sortable: false, visible: true },
  { id: 'dueDate', label: 'Due Date', width: 120, minWidth: 90, sortable: true, visible: true },
  { id: 'points', label: 'Points', width: 80, minWidth: 60, sortable: false, visible: true },
];

export function TaskListView({ projectId }: TaskListViewProps) {
  const { tasks: allTasks, openModal, selectTask, selectedTasks, selectAllTasks, clearSelectedTasks, addTask, showToast, currentUser, assignTask, users } = useApp();
  const [sortField, setSortField] = useState<string>('key');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [resizing, setResizing] = useState<string | null>(null);
  const [inlineCreateOpen, setInlineCreateOpen] = useState(false);
  const [inlineSubtaskParent, setInlineSubtaskParent] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'task' | 'bug' | 'story'>('task');
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  const tasks = projectId
    ? allTasks.filter(t => t.projectId === projectId)
    : allTasks;

  // Group tasks: parent tasks with their subtasks
  const getHierarchicalTasks = () => {
    const parentTasks = tasks.filter(t => !t.parentId);
    const subtaskMap = new Map<string, Task[]>();

    tasks.filter(t => t.parentId).forEach(subtask => {
      const existing = subtaskMap.get(subtask.parentId!) || [];
      subtaskMap.set(subtask.parentId!, [...existing, subtask]);
    });

    return { parentTasks, subtaskMap };
  };

  const { parentTasks, subtaskMap } = getHierarchicalTasks();

  const toggleExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const hasSubtasks = (taskId: string) => {
    return (subtaskMap.get(taskId)?.length || 0) > 0;
  };

  const sortedParentTasks = [...parentTasks].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'key':
        comparison = a.key.localeCompare(b.key);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'dueDate':
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleTask = (taskId: string) => {
    selectTask(taskId);
  };

  const toggleAll = () => {
    if (selectedTasks.length === tasks.length && tasks.length > 0) {
      clearSelectedTasks();
    } else {
      selectAllTasks(tasks.map(t => t.id));
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const startEditingColumn = (columnId: string) => {
    const column = columns.find(c => c.id === columnId);
    if (column) {
      setEditingColumn(columnId);
      setEditingLabel(column.label);
    }
  };

  const saveColumnLabel = () => {
    if (editingColumn && editingLabel.trim()) {
      setColumns(prev => prev.map(c =>
        c.id === editingColumn ? { ...c, label: editingLabel.trim() } : c
      ));
    }
    setEditingColumn(null);
    setEditingLabel('');
  };

  const handleResizeStart = useCallback((e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const column = columns.find(c => c.id === columnId);
    if (!column) return;

    setResizing(columnId);
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = column.width;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX.current;
      const newWidth = Math.max(column.minWidth, resizeStartWidth.current + diff);
      setColumns(prev => prev.map(c =>
        c.id === columnId ? { ...c, width: newWidth } : c
      ));
    };

    const handleMouseUp = () => {
      setResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columns]);

  const formatDate = (date?: string) => {
    if (!date) return '-';
    const d = new Date(date);
    const today = new Date('2026-01-20');
    const diff = d.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) {
      return <span className="text-destructive font-medium">Overdue</span>;
    }
    if (days === 0) {
      return <span className="text-warning font-medium">Today</span>;
    }
    if (days === 1) {
      return <span className="text-warning">Tomorrow</span>;
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleTaskAction = (action: string, taskId: string) => {
    switch (action) {
      case 'view':
        openModal('task-detail', { taskId });
        break;
      case 'edit':
        openModal('edit-task', { taskId });
        break;
      case 'status':
        openModal('change-status', { taskId });
        break;
      case 'assign':
        openModal('assign-task', { taskId });
        break;
      case 'delete':
        openModal('confirm-delete', { taskId });
        break;
      case 'subtask':
        setInlineSubtaskParent(taskId);
        setNewTaskTitle('');
        break;
    }
  };

  const handleInlineCreate = () => {
    if (!newTaskTitle.trim()) return;

    const isSubtask = !!inlineSubtaskParent;
    const parentTask = isSubtask ? tasks.find(t => t.id === inlineSubtaskParent) : null;

    // Subtasks always inherit the project from their parent task
    const taskProjectId = isSubtask && parentTask
      ? parentTask.projectId
      : (projectId || 'proj-1');

    // Subtasks inherit the parent's type and priority
    // If parent is epic, subtask becomes task; otherwise inherits parent type
    const inheritedType = isSubtask && parentTask
      ? (parentTask.type === 'epic' ? 'task' : parentTask.type === 'subtask' ? 'subtask' : parentTask.type)
      : newTaskType;

    addTask({
      title: newTaskTitle.trim(),
      type: isSubtask ? inheritedType : newTaskType,
      priority: isSubtask && parentTask ? parentTask.priority : 'medium',
      status: 'open',
      projectId: taskProjectId,
      parentId: inlineSubtaskParent || undefined,
      reporter: currentUser,
      tags: [],
    });

    showToast({
      title: isSubtask ? 'Subtask created' : 'Task created',
      description: `${newTaskTitle.trim()}${parentTask ? ` under ${parentTask.key}` : ''}`,
      type: 'success'
    });

    setNewTaskTitle('');
    setInlineCreateOpen(false);
    setInlineSubtaskParent(null);
  };

  const cancelInlineCreate = () => {
    setNewTaskTitle('');
    setInlineCreateOpen(false);
    setInlineSubtaskParent(null);
  };

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    setColumns(prev => {
      const newColumns = [...prev];
      const draggedIndex = newColumns.findIndex(c => c.id === draggedColumn);
      const targetIndex = newColumns.findIndex(c => c.id === targetColumnId);

      const [removed] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, removed);

      return newColumns;
    });

    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const sortedTasks = tasks; // Declare sortedTasks variable

  return (
    <div className="h-full flex flex-col bg-card rounded-lg border border-border overflow-hidden">
      {/* Selected Actions Bar */}
      {selectedTasks.length > 0 && (
        <div className="px-4 py-2 bg-primary/10 border-b border-border flex items-center gap-4 shrink-0">
          <span className="text-sm font-medium">{selectedTasks.length} selected</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal('change-status', { taskIds: selectedTasks })}
            >
              Change Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openModal('assign-task', { taskIds: selectedTasks })}
            >
              Assign To
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive bg-transparent"
              onClick={() => openModal('confirm-delete', { taskIds: selectedTasks })}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table with horizontal scroll */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="border-b-2 border-border">
                <TableHead className="w-10 border-r-2 border-border/60">
                  <Checkbox
                    checked={selectedTasks.length === tasks.length && tasks.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                {columns.filter(c => c.visible).map((column) => (
                  <TableHead
                    key={column.id}
                    style={{ width: column.width }}
                    className={cn(
                      'relative border-r-2 border-border/60 last:border-r-0 group select-none',
                      column.sortable && 'cursor-pointer hover:bg-muted/50',
                      resizing === column.id && 'bg-muted/50',
                      draggedColumn === column.id && 'opacity-50 bg-muted',
                      dragOverColumn === column.id && 'border-l-2 border-l-primary'
                    )}
                    draggable
                    onDragStart={(e) => handleDragStart(e, column.id)}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="flex items-center justify-between gap-1 pr-2">
                      {editingColumn === column.id ? (
                        <Input
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          onBlur={saveColumnLabel}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveColumnLabel();
                            if (e.key === 'Escape') {
                              setEditingColumn(null);
                              setEditingLabel('');
                            }
                          }}
                          className="h-6 text-xs px-1 w-full"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="flex items-center gap-1 flex-1"
                          onClick={() => column.sortable && handleSort(column.id)}
                        >
                          <span className="text-xs font-medium">{column.label}</span>
                          {sortField === column.id && (
                            sortDirection === 'asc'
                              ? <ChevronUp className="size-3" />
                              : <ChevronDown className="size-3" />
                          )}
                        </div>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil className="size-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="start">
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Column Options</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs"
                              onClick={() => startEditingColumn(column.id)}
                            >
                              <Pencil className="size-3 mr-2" />
                              Rename Column
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {/* Resize handle */}
                    <div
                      className={cn(
                        'absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors',
                        resizing === column.id && 'bg-primary'
                      )}
                      onMouseDown={(e) => handleResizeStart(e, column.id)}
                    />
                  </TableHead>
                ))}
                <TableHead className="w-12 border-l border-border"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Inline Create Row */}
              {inlineCreateOpen && !inlineSubtaskParent && (
                <TableRow className="bg-primary/5 border-b-2 border-primary/20">
                  <TableCell className="border-r-2 border-border/60">
                    <Plus className="size-4 text-primary" />
                  </TableCell>
                  <TableCell className="border-r-2 border-border/60">
                    <Select value={newTaskType} onValueChange={(v) => setNewTaskType(v as 'task' | 'bug' | 'story')}>
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="bug">Bug</SelectItem>
                        <SelectItem value="story">Story</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="border-r-2 border-border/60">
                    <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                      NEW
                    </Badge>
                  </TableCell>
                  <TableCell className="border-r-2 border-border/60" colSpan={5}>
                    <div className="flex items-center gap-2">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Enter task title and press Enter..."
                        className="h-8 flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleInlineCreate();
                          if (e.key === 'Escape') cancelInlineCreate();
                        }}
                      />
                      <Button size="sm" className="h-8" onClick={handleInlineCreate} disabled={!newTaskTitle.trim()}>
                        Create
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={cancelInlineCreate}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}

              {sortedParentTasks.map((task) => {
                const priority = priorityConfig[task.priority];
                const type = typeConfig[task.type];
                const status = statusConfig[task.status];
                const isSelected = selectedTasks.includes(task.id);
                const isCreatingSubtask = inlineSubtaskParent === task.id;
                const taskSubtasks = subtaskMap.get(task.id) || [];
                const isExpanded = expandedTasks.has(task.id);
                const hasChildren = taskSubtasks.length > 0;

                return (
                  <React.Fragment key={task.id}>
                    <TableRow
                      className={cn(
                        'cursor-pointer hover:bg-muted/50 group',
                        isSelected && 'bg-primary/5'
                      )}
                      onClick={() => openModal('task-detail', { taskId: task.id })}
                    >
                      <TableCell className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {hasChildren ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-5 text-muted-foreground hover:text-primary"
                              onClick={() => toggleExpand(task.id)}
                            >
                              <ChevronRight className={cn(
                                'size-4 transition-transform',
                                isExpanded && 'rotate-90'
                              )} />
                            </Button>
                          ) : (
                            <span className="w-5" />
                          )}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTask(task.id)}
                          />
                        </div>
                      </TableCell>
                      <TableCell style={{ width: columns[0].width }} className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <span className={type.color}>{type.icon}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                            onClick={() => handleTaskAction('subtask', task.id)}
                            title="Add subtask"
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell style={{ width: columns[1].width }} className="border-r-2 border-border/60">
                        <Badge variant="outline" className="font-mono text-xs">
                          {task.key}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ width: columns[2].width }} className="border-r-2 border-border/60">
                        <div className="max-w-full">
                          <p className="font-medium truncate">{task.title}</p>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              {task.tags.slice(0, 2).map(tag => (
                                <Badge
                                  key={tag.id}
                                  variant="outline"
                                  className="text-xs px-1.5"
                                  style={{ borderColor: tag.color, color: tag.color }}
                                >
                                  {tag.name}
                                </Badge>
                              ))}
                              {task.tags.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{task.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={{ width: columns[3].width }} className="border-r-2 border-border/60">
                        <Badge className={cn('text-xs', status.color)}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ width: columns[4].width }} className="border-r-2 border-border/60">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                task.status === 'closed' ? 'bg-green-500' : 'bg-primary'
                              )}
                              style={{ width: `${task.status === 'closed' ? 100 : task.status === 'in-progress' ? 50 : task.status === 'pending-approval' ? 80 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10">
                            {task.status === 'closed' ? 100 : task.status === 'in-progress' ? 50 : task.status === 'pending-approval' ? 80 : 0}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell style={{ width: columns[5].width }} className="border-r-2 border-border/60">
                        <div className={cn('flex items-center gap-1.5', priority.color)}>
                          {priority.icon}
                          <span className="text-sm">{priority.label}</span>
                        </div>
                      </TableCell>
                      <TableCell style={{ width: columns[6].width }} className="border-r-2 border-border/60">
                        <div className="flex flex-col gap-1 py-0.5">
                          {task.assignee ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="size-5 shrink-0">
                                <AvatarImage src={task.assignee.avatar || '/placeholder.svg'} />
                                <AvatarFallback className="text-[10px]">
                                  {task.assignee.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate">{task.assignee.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">Unassigned</span>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="flex items-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-300 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 border border-blue-300 dark:border-blue-700 rounded px-1.5 py-0.5 w-fit transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Plus className="size-2.5" />
                                Assign
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  assignTask(task.id, currentUser.id);
                                }}
                                className="flex items-center gap-2 text-primary font-medium"
                              >
                                <UserCheck className="size-4 shrink-0 text-primary" />
                                <span className="text-sm">Assign to me</span>
                                {task.assignee?.id === currentUser.id && (
                                  <UserCheck className="size-3.5 ml-auto text-primary" />
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {users.map((u) => (
                                <DropdownMenuItem
                                  key={u.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    assignTask(task.id, u.id);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Avatar className="size-5 shrink-0">
                                    <AvatarImage src={u.avatar || '/placeholder.svg'} />
                                    <AvatarFallback className="text-[10px]">
                                      {u.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{u.name}</span>
                                  {task.assignee?.id === u.id && (
                                    <UserCheck className="size-3.5 ml-auto text-primary" />
                                  )}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                      <TableCell style={{ width: columns[7].width }} className="border-r-2 border-border/60">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          {formatDate(task.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell style={{ width: columns[8].width }} className="border-r-2 border-border/60">
                        {task.storyPoints && (
                          <Badge variant="secondary" className="text-xs">
                            {task.storyPoints} pts
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTaskAction('view', task.id)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTaskAction('edit', task.id)}>
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTaskAction('status', task.id)}>
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTaskAction('assign', task.id)}>
                              Assign To
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleTaskAction('subtask', task.id)}>
                              <CornerDownRight className="size-4 mr-2" />
                              Add Subtask
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleTaskAction('delete', task.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* Render Subtasks when expanded */}
                    {isExpanded && taskSubtasks.map((subtask) => {
                      const subtaskPriority = priorityConfig[subtask.priority];
                      const subtaskType = typeConfig[subtask.type];
                      const subtaskStatus = statusConfig[subtask.status];
                      const isSubtaskSelected = selectedTasks.includes(subtask.id);

                      return (
                        <TableRow
                          key={subtask.id}
                          className={cn(
                            'cursor-pointer hover:bg-muted/50 group bg-muted/20',
                            isSubtaskSelected && 'bg-primary/5'
                          )}
                          onClick={() => openModal('task-detail', { taskId: subtask.id })}
                        >
                          <TableCell className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1 pl-6">
                              <Checkbox
                                checked={isSubtaskSelected}
                                onCheckedChange={() => toggleTask(subtask.id)}
                              />
                            </div>
                          </TableCell>
                          <TableCell style={{ width: columns[0].width }} className="border-r-2 border-border/60">
                            <div className="flex items-center gap-1 pl-4">
                              <CornerDownRight className="size-3 text-muted-foreground" />
                              <span className={subtaskType.color}>{subtaskType.icon}</span>
                            </div>
                          </TableCell>
                          <TableCell style={{ width: columns[1].width }} className="border-r-2 border-border/60">
                            <Badge variant="outline" className="font-mono text-xs">
                              {subtask.key}
                            </Badge>
                          </TableCell>
                          <TableCell style={{ width: columns[2].width }} className="border-r-2 border-border/60">
                            <div className="max-w-full pl-2">
                              <p className="font-medium truncate text-sm">{subtask.title}</p>
                            </div>
                          </TableCell>
                          <TableCell style={{ width: columns[3].width }} className="border-r-2 border-border/60">
                            <Badge className={cn('text-xs', subtaskStatus.color)}>
                              {subtaskStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell style={{ width: columns[4].width }} className="border-r-2 border-border/60">
                            <div className={cn('flex items-center gap-1.5', subtaskPriority.color)}>
                              {subtaskPriority.icon}
                              <span className="text-sm">{subtaskPriority.label}</span>
                            </div>
                          </TableCell>
                          <TableCell style={{ width: columns[5].width }} className="border-r-2 border-border/60">
                            {subtask.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="size-6">
                                  <AvatarImage src={subtask.assignee.avatar || '/placeholder.svg'} />
                                  <AvatarFallback className="text-xs">
                                    {subtask.assignee.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm truncate">{subtask.assignee.name}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell style={{ width: columns[6].width }} className="border-r-2 border-border/60">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Calendar className="size-3.5 text-muted-foreground" />
                              {formatDate(subtask.dueDate)}
                            </div>
                          </TableCell>
                          <TableCell style={{ width: columns[7].width }} className="border-r-2 border-border/60">
                            {subtask.storyPoints && (
                              <Badge variant="secondary" className="text-xs">
                                {subtask.storyPoints} pts
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleTaskAction('view', subtask.id)}>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTaskAction('edit', subtask.id)}>
                                  Edit Subtask
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTaskAction('status', subtask.id)}>
                                  Change Status
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleTaskAction('assign', subtask.id)}>
                                  Assign To
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleTaskAction('delete', subtask.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {/* Inline Subtask Create Row */}
                    {isCreatingSubtask && (
                      <TableRow className="bg-accent/5 border-b border-accent/20">
                        <TableCell className="border-r-2 border-border/60">
                          <div className="pl-6">
                            <CornerDownRight className="size-4 text-accent" />
                          </div>
                        </TableCell>
                        <TableCell className="border-r-2 border-border/60">
                          <div className="pl-4 flex items-center gap-1">
                            <CornerDownRight className="size-3 text-muted-foreground" />
                            <span className="text-blue-400">{typeConfig.subtask.icon}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border-r-2 border-border/60">
                          <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                            SUB
                          </Badge>
                        </TableCell>
                        <TableCell className="border-r-2 border-border/60" colSpan={5}>
                          <div className="flex items-center gap-2 pl-2">
                            <Input
                              value={newTaskTitle}
                              onChange={(e) => setNewTaskTitle(e.target.value)}
                              placeholder={`Add subtask to ${task.key}...`}
                              className="h-8 flex-1"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleInlineCreate();
                                if (e.key === 'Escape') cancelInlineCreate();
                              }}
                            />
                            <Button size="sm" className="h-8" onClick={handleInlineCreate} disabled={!newTaskTitle.trim()}>
                              Create
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8" onClick={cancelInlineCreate}>
                              <X className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Add New Task Row - Always Last */}
              {!inlineCreateOpen && !inlineSubtaskParent && (
                <TableRow
                  className="hover:bg-muted/30 cursor-pointer border-t border-border"
                  onClick={() => setInlineCreateOpen(true)}
                >
                  <TableCell colSpan={columns.filter(c => c.visible).length + 2} className="py-3">
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                      <Plus className="size-4" />
                      <span className="text-sm">Add new task...</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-sm text-muted-foreground shrink-0">
        <span>{tasks.length} tasks</span>
        <span>
          Total: {tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} story points
        </span>
      </div>
    </div>
  );
}
