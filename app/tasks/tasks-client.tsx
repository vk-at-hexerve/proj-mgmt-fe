'use client';

import React, { useState, useRef, useCallback } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AICopilot } from '@/components/ai/ai-copilot';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Search,
  MoreHorizontal,
  Bug,
  BookOpen,
  Zap,
  ListTodo,
  Calendar,
  Plus,
  Clock,
  Edit,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  Eye,
  Pencil,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  X,
  CornerDownRight,
} from 'lucide-react';
import type { Task, TaskPriority } from '@/lib/types';
import { getStatusName } from '@/lib/status-utils';
import { cn } from '@/lib/utils';
import { TaskWatchButton } from '@/components/tasks/task-watch-button';

const priorityStyles: Record<TaskPriority, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-warning text-warning-foreground',
  medium: 'bg-accent text-accent-foreground',
  low: 'bg-muted text-muted-foreground',
};


const typeIcons: Record<Task['type'], React.ReactNode> = {
  epic: <Zap className="size-4 text-primary" />,
  story: <BookOpen className="size-4 text-accent" />,
  task: <ListTodo className="size-4 text-muted-foreground" />,
  subtask: <ListTodo className="size-3 text-muted-foreground" />,
  bug: <Bug className="size-4 text-destructive" />,
};

interface ColumnConfig {
  id: string;
  label: string;
  width: number;
  minWidth: number;
  sortable: boolean;
}

const defaultColumns: ColumnConfig[] = [
  { id: 'type', label: 'Type', width: 56, minWidth: 40, sortable: false },
  { id: 'key', label: 'Key', width: 96, minWidth: 70, sortable: true },
  { id: 'title', label: 'Task', width: 200, minWidth: 120, sortable: true },
  { id: 'status', label: 'Status', width: 128, minWidth: 90, sortable: true },
  { id: 'priority', label: 'Priority', width: 96, minWidth: 70, sortable: true },
  { id: 'points', label: 'Points', width: 80, minWidth: 60, sortable: false },
  { id: 'dueDate', label: 'Due Date', width: 112, minWidth: 80, sortable: true },
  { id: 'project', label: 'Project', width: 96, minWidth: 70, sortable: false },
  { id: 'assignee', label: 'Assignee', width: 128, minWidth: 90, sortable: false },
];

export default function TasksClient() {
  const { tasks, projects, openModal, currentUser, selectTask, selectedTasks, selectAllTasks, clearSelectedTasks, addTask, showToast, isTaskDone, getStatusGroup, workflowStatuses, getProjectStatuses } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [sortField, setSortField] = useState<string>('key');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  const myTasks = tasks.filter(task =>
    task.assignee?.id === currentUser.id
  );

  const filteredTasks = myTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || getStatusGroup(task.statusId) === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.projectId === projectFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  // Group tasks: parent tasks with their subtasks
  const getHierarchicalTasks = () => {
    const parentTasks = filteredTasks.filter(t => !t.parentId);
    const subtaskMap = new Map<string, Task[]>();

    filteredTasks.filter(t => t.parentId).forEach(subtask => {
      const existing = subtaskMap.get(subtask.parentId!) || [];
      subtaskMap.set(subtask.parentId!, [...existing, subtask]);
    });

    return { parentTasks, subtaskMap };
  };

  const { parentTasks, subtaskMap } = getHierarchicalTasks();

  const hasSubtasks = (taskId: string) => {
    return (subtaskMap.get(taskId)?.length || 0) > 0;
  };

  const handleSelectTask = (taskId: string) => {
    selectTask(taskId);
  };

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      clearSelectedTasks();
    } else {
      selectAllTasks(filteredTasks.map(t => t.id));
    }
  };

  const handleBulkEdit = () => {
    if (selectedTasks.length > 0) {
      openModal('change-status', { taskIds: selectedTasks });
    }
  };

  const handleBulkAssign = () => {
    if (selectedTasks.length > 0) {
      openModal('assign-task', { taskIds: selectedTasks });
    }
  };

  const handleBulkDelete = () => {
    if (selectedTasks.length > 0) {
      openModal('confirm-delete', { taskIds: selectedTasks });
    }
  };

  const handleInlineCreate = () => {
    if (!newTaskTitle.trim()) return;

    const isSubtask = !!inlineSubtaskParent;
    const parentTask = isSubtask ? filteredTasks.find(t => t.id === inlineSubtaskParent) : null;

    // Determine project ID - subtasks inherit from parent, otherwise use filter or default
    const taskProjectId = isSubtask && parentTask
      ? parentTask.projectId
      : (projectFilter !== 'all' ? projectFilter : 'proj-1');

    // Subtasks inherit the parent's type and priority
    // If parent is epic, subtask becomes task; otherwise inherits parent type
    const inheritedType = isSubtask && parentTask
      ? (parentTask.type === 'epic' ? 'task' : parentTask.type === 'subtask' ? 'subtask' : parentTask.type)
      : newTaskType;

    const projectStatuses = getProjectStatuses(taskProjectId);
    const defaultOpenStatus = projectStatuses.find((s: any) => getStatusGroup(s.id) === 'OPEN') || projectStatuses[0];

    addTask({
      title: newTaskTitle.trim(),
      type: isSubtask ? inheritedType : newTaskType,
      priority: isSubtask && parentTask ? parentTask.priority : 'medium',
      statusId: defaultOpenStatus ? defaultOpenStatus.id : '',
      projectId: taskProjectId,
      parentId: inlineSubtaskParent || undefined,
      reporter: currentUser,
      tags: [],
    });

    const project = projects.find((p: any) => p.id === taskProjectId);
    showToast({
      title: isSubtask ? 'Subtask created' : 'Task created',
      description: `${newTaskTitle.trim()} added to ${project?.name || 'project'}`,
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

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="My Tasks"
          subtitle={`${filteredTasks.length} tasks assigned to you`}
        />
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-border bg-card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {selectedTasks.length > 0 && (
                <div className="flex items-center gap-2 mr-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedTasks.length} selected
                  </span>
                  <Button variant="outline" size="sm" className="h-8 bg-transparent" onClick={handleBulkEdit}>
                    Change Status
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 bg-transparent" onClick={handleBulkAssign}>
                    Assign
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 bg-transparent text-destructive" onClick={handleBulkDelete}>
                    Delete
                  </Button>
                </div>
              )}
              <Button size="sm" className="gap-1" onClick={() => openModal('create-task')}>
                <Plus className="size-4" />
                Create Task
              </Button>
            </div>
          </div>

          {/* Task Table with horizontal scroll */}
          <div className="flex-1 overflow-auto">
            <div className="min-w-max">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="border-b-2 border-border">
                    <TableHead className="w-10 border-r-2 border-border/60">
                      <Checkbox
                        checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {columns.map((column) => (
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
                      <TableCell className="border-r-2 border-border/60" colSpan={6}>
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

                  {parentTasks.length > 0 ? (
                    parentTasks.map(task => {
                      const project = projects.find((p: any) => p.id === task.projectId);
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isTaskDone(task);
                      const isSelected = selectedTasks.includes(task.id);
                      const isCreatingSubtask = inlineSubtaskParent === task.id;
                      const taskSubtasks = subtaskMap.get(task.id) || [];
                      const isExpanded = expandedTasks.has(task.id);
                      const hasChildren = taskSubtasks.length > 0;
                      const status = workflowStatuses.find(s => s.id === task.statusId);

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
                                  onCheckedChange={() => handleSelectTask(task.id)}
                                />
                              </div>
                            </TableCell>
                            <TableCell style={{ width: columns[0].width }} className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                {typeIcons[task.type]}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                  onClick={() => setInlineSubtaskParent(task.id)}
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
                              <div className="max-w-full flex items-center gap-2 group/title">
                                <p className={cn(
                                  'font-medium truncate',
                                  isTaskDone(task) && 'line-through text-muted-foreground'
                                )}>
                                  {task.title}
                                </p>
                                <div className="opacity-0 group-hover/title:opacity-100 transition-opacity">
                                  <TaskWatchButton taskId={task.id} size="xs" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell style={{ width: columns[3].width }} className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                              <Badge
                                variant="secondary"
                                className="text-xs cursor-pointer"
                                onClick={() => openModal('change-status', { taskId: task.id })}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="size-2 rounded-full" style={{ backgroundColor: status?.color || '#94a3b8' }} />
                                  <span className="truncate">{status?.name || 'Unknown'}</span>
                                </div>
                              </Badge>
                            </TableCell>
                            <TableCell style={{ width: columns[4].width }} className="border-r-2 border-border/60">
                              <Badge className={cn('text-xs', priorityStyles[task.priority])}>
                                {task.priority}
                              </Badge>
                            </TableCell>
                            <TableCell style={{ width: columns[5].width }} className="border-r-2 border-border/60 text-center">
                              {task.storyPoints ? (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">
                                  {task.storyPoints}
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell style={{ width: columns[6].width }} className="border-r-2 border-border/60">
                              {task.dueDate ? (
                                <div className={cn(
                                  'flex items-center gap-1 text-xs',
                                  isOverdue ? 'text-destructive' : 'text-muted-foreground'
                                )}>
                                  <Calendar className="size-3" />
                                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              ) : '-'}
                            </TableCell>
                            <TableCell style={{ width: columns[7].width }} className="border-r-2 border-border/60">
                              <Badge variant="outline" className="text-xs">
                                {project?.key}
                              </Badge>
                            </TableCell>
                            <TableCell style={{ width: columns[8].width }} className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                              {task.assignee ? (
                                <div
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={() => openModal('assign-task', { taskId: task.id })}
                                >
                                  <UserAvatar user={task.assignee} size="sm" />
                                  <span className="text-sm truncate">{task.assignee.name}</span>
                                </div>
                              ) : (
                                <span
                                  className="text-muted-foreground cursor-pointer hover:text-primary"
                                  onClick={() => openModal('assign-task', { taskId: task.id })}
                                >
                                  Unassigned
                                </span>
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
                                  <DropdownMenuItem onClick={() => openModal('task-detail', { taskId: task.id })} className="gap-2">
                                    <Eye className="size-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openModal('edit-task', { taskId: task.id })} className="gap-2">
                                    <Edit className="size-4" />
                                    Edit Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openModal('assign-task', { taskId: task.id })} className="gap-2">
                                    <UserPlus className="size-4" />
                                    Assign To...
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openModal('change-status', { taskId: task.id })} className="gap-2">
                                    <ArrowRightLeft className="size-4" />
                                    Change Status
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openModal('log-time', { taskId: task.id })} className="gap-2">
                                    <Clock className="size-4" />
                                    Log Time
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setInlineSubtaskParent(task.id)} className="gap-2">
                                    <CornerDownRight className="size-4" />
                                    Add Subtask
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openModal('confirm-delete', { taskId: task.id })} className="gap-2 text-destructive">
                                    <Trash2 className="size-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>

                          {/* Render Subtasks when expanded */}
                          {isExpanded && taskSubtasks.map((subtask) => {
                            const subtaskProject = projects.find((p: any) => p.id === subtask.projectId);
                            const isSubtaskOverdue = subtask.dueDate && new Date(subtask.dueDate) < new Date() && !isTaskDone(subtask);
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
                                      onCheckedChange={() => handleSelectTask(subtask.id)}
                                    />
                                  </div>
                                </TableCell>
                                <TableCell style={{ width: columns[0].width }} className="border-r-2 border-border/60">
                                  <div className="flex items-center gap-1 pl-4">
                                    <CornerDownRight className="size-3 text-muted-foreground" />
                                    {typeIcons[subtask.type]}
                                  </div>
                                </TableCell>
                                <TableCell style={{ width: columns[1].width }} className="border-r-2 border-border/60">
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {subtask.key}
                                  </Badge>
                                </TableCell>
                                <TableCell style={{ width: columns[2].width }} className="border-r-2 border-border/60">
                                  <div className="max-w-full pl-2 flex items-center gap-2 group/title">
                                    <p className={cn(
                                      'font-medium truncate text-sm',
                                      isTaskDone(subtask) && 'line-through text-muted-foreground'
                                    )}>
                                      {subtask.title}
                                    </p>
                                    <div className="opacity-0 group-hover/title:opacity-100 transition-opacity">
                                      <TaskWatchButton taskId={subtask.id} size="xs" />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell style={{ width: columns[3].width }} className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs cursor-pointer"
                                    onClick={() => openModal('change-status', { taskId: subtask.id })}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="size-2 rounded-full" style={{ backgroundColor: workflowStatuses.find(s => s.id === subtask.statusId)?.color || '#94a3b8' }} />
                                      <span className="truncate">{getStatusName(workflowStatuses, subtask.statusId)}</span>
                                    </div>
                                  </Badge>
                                </TableCell>
                                <TableCell style={{ width: columns[4].width }} className="border-r-2 border-border/60">
                                  <Badge className={cn('text-xs', priorityStyles[subtask.priority])}>
                                    {subtask.priority}
                                  </Badge>
                                </TableCell>
                                <TableCell style={{ width: columns[5].width }} className="border-r-2 border-border/60 text-center">
                                  {subtask.storyPoints ? (
                                    <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">
                                      {subtask.storyPoints}
                                    </span>
                                  ) : '-'}
                                </TableCell>
                                <TableCell style={{ width: columns[6].width }} className="border-r-2 border-border/60">
                                  {subtask.dueDate ? (
                                    <div className={cn(
                                      'flex items-center gap-1 text-xs',
                                      isSubtaskOverdue ? 'text-destructive' : 'text-muted-foreground'
                                    )}>
                                      <Calendar className="size-3" />
                                      {new Date(subtask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                  ) : '-'}
                                </TableCell>
                                <TableCell style={{ width: columns[7].width }} className="border-r-2 border-border/60">
                                  <Badge variant="outline" className="text-xs">
                                    {subtaskProject?.key}
                                  </Badge>
                                </TableCell>
                                <TableCell style={{ width: columns[8].width }} className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                                  {subtask.assignee ? (
                                    <div
                                      className="flex items-center gap-2 cursor-pointer"
                                      onClick={() => openModal('assign-task', { taskId: subtask.id })}
                                    >
                                      <UserAvatar user={subtask.assignee} size="sm" />
                                      <span className="text-sm truncate">{subtask.assignee.name}</span>
                                    </div>
                                  ) : (
                                    <span
                                      className="text-muted-foreground cursor-pointer hover:text-primary"
                                      onClick={() => openModal('assign-task', { taskId: subtask.id })}
                                    >
                                      Unassigned
                                    </span>
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
                                      <DropdownMenuItem onClick={() => openModal('task-detail', { taskId: subtask.id })} className="gap-2">
                                        <Eye className="size-4" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openModal('edit-task', { taskId: subtask.id })} className="gap-2">
                                        <Edit className="size-4" />
                                        Edit Subtask
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openModal('assign-task', { taskId: subtask.id })} className="gap-2">
                                        <UserPlus className="size-4" />
                                        Assign To...
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openModal('change-status', { taskId: subtask.id })} className="gap-2">
                                        <ArrowRightLeft className="size-4" />
                                        Change Status
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => openModal('confirm-delete', { taskId: subtask.id })} className="gap-2 text-destructive">
                                        <Trash2 className="size-4" />
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
                                  {typeIcons.subtask}
                                </div>
                              </TableCell>
                              <TableCell className="border-r-2 border-border/60">
                                <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                                  SUB
                                </Badge>
                              </TableCell>
                              <TableCell className="border-r-2 border-border/60" colSpan={6}>
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
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length + 2} className="h-64">
                        <div className="flex items-center justify-center text-muted-foreground">
                          <div className="text-center">
                            <ListTodo className="size-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No tasks found</p>
                            <p className="text-sm">Try adjusting your filters or create a new task</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Also show orphaned subtasks (subtasks whose parents are filtered out) */}
                  {filteredTasks.filter(t => t.parentId && !parentTasks.find(p => p.id === t.parentId)).map(subtask => {
                    const subtaskProject = projects.find(p => p.id === subtask.projectId);
                    const isSubtaskOverdue = subtask.dueDate && new Date(subtask.dueDate) < new Date() && !isTaskDone(subtask);
                    const isSubtaskSelected = selectedTasks.includes(subtask.id);
                    const parentTask = tasks.find(t => t.id === subtask.parentId);

                    return (
                      <TableRow
                        key={subtask.id}
                        className={cn(
                          'cursor-pointer hover:bg-muted/50 group bg-muted/10',
                          isSubtaskSelected && 'bg-primary/5'
                        )}
                        onClick={() => openModal('task-detail', { taskId: subtask.id })}
                      >
                        <TableCell className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1 pl-6">
                            <Checkbox
                              checked={isSubtaskSelected}
                              onCheckedChange={() => handleSelectTask(subtask.id)}
                            />
                          </div>
                        </TableCell>
                        <TableCell style={{ width: columns[0].width }} className="border-r-2 border-border/60">
                          <div className="flex items-center gap-1 pl-4">
                            <CornerDownRight className="size-3 text-muted-foreground" />
                            {typeIcons[subtask.type]}
                          </div>
                        </TableCell>
                        <TableCell style={{ width: columns[1].width }} className="border-r-2 border-border/60">
                          <Badge variant="outline" className="font-mono text-xs">
                            {subtask.key}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ width: columns[2].width }} className="border-r-2 border-border/60">
                          <div className="max-w-full pl-2">
                            <p className={cn(
                              'font-medium truncate text-sm',
                              isTaskDone(subtask) && 'line-through text-muted-foreground'
                            )}>
                              {subtask.title}
                            </p>
                            {parentTask && (
                              <p className="text-xs text-muted-foreground">Parent: {parentTask.key}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell style={{ width: columns[3].width }} className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                          <Badge
                            variant="secondary"
                            className="text-xs cursor-pointer"
                            onClick={() => openModal('change-status', { taskId: subtask.id })}
                          >
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full" style={{ backgroundColor: workflowStatuses.find(s => s.id === subtask.statusId)?.color || '#94a3b8' }} />
                              <span className="truncate">{getStatusName(workflowStatuses, subtask.statusId)}</span>
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell style={{ width: columns[4].width }} className="border-r-2 border-border/60">
                          <Badge className={cn('text-xs', priorityStyles[subtask.priority])}>
                            {subtask.priority}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ width: columns[5].width }} className="border-r-2 border-border/60 text-center">
                          {subtask.storyPoints ? (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">
                              {subtask.storyPoints}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell style={{ width: columns[6].width }} className="border-r-2 border-border/60">
                          {subtask.dueDate ? (
                            <div className={cn(
                              'flex items-center gap-1 text-xs',
                              isSubtaskOverdue ? 'text-destructive' : 'text-muted-foreground'
                            )}>
                              <Calendar className="size-3" />
                              {new Date(subtask.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell style={{ width: columns[7].width }} className="border-r-2 border-border/60">
                          <Badge variant="outline" className="text-xs">
                            {subtaskProject?.key}
                          </Badge>
                        </TableCell>
                        <TableCell style={{ width: columns[8].width }} className="border-r-2 border-border/60" onClick={(e) => e.stopPropagation()}>
                          {subtask.assignee ? (
                            <div
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={() => openModal('assign-task', { taskId: subtask.id })}
                            >
                              <UserAvatar user={subtask.assignee} size="sm" />
                              <span className="text-sm truncate">{subtask.assignee.name}</span>
                            </div>
                          ) : (
                            <span
                              className="text-muted-foreground cursor-pointer hover:text-primary"
                              onClick={() => openModal('assign-task', { taskId: subtask.id })}
                            >
                              Unassigned
                            </span>
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
                              <DropdownMenuItem onClick={() => openModal('task-detail', { taskId: subtask.id })} className="gap-2">
                                <Eye className="size-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openModal('edit-task', { taskId: subtask.id })} className="gap-2">
                                <Edit className="size-4" />
                                Edit Subtask
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openModal('confirm-delete', { taskId: subtask.id })} className="gap-2 text-destructive">
                                <Trash2 className="size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Add New Task Row - Always Last */}
                  {!inlineCreateOpen && !inlineSubtaskParent && (
                    <TableRow
                      className="hover:bg-muted/30 cursor-pointer border-t border-border"
                      onClick={() => setInlineCreateOpen(true)}
                    >
                      <TableCell colSpan={columns.length + 2} className="py-3">
                        <div className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
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
            <span>{filteredTasks.length} tasks</span>
            <span>
              Total: {filteredTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)} story points
            </span>
          </div>
        </main>
        <AICopilot />
      </div>
    </div>
  );
}
