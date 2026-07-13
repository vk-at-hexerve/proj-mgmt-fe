'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { PermissionGate } from '@/lib/permission-guard';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

import { UserAvatar } from '@/components/ui/user-avatar';
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
  Settings,
  Tag as TagIcon,
  FolderKanban,
  Check,
  Star,
} from 'lucide-react';
import type { Task, TaskPriority } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getStatusName, getStatusColor, getStatusGroup, GROUP_PROGRESS_MAP } from '@/lib/status-utils';
import { tags as availableTags } from '@/lib/mock-data';
import { TaskWatchButton } from '@/components/tasks/task-watch-button';

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


const defaultColumns: ColumnConfig[] = [
  { id: 'type', label: 'Type', width: 56, minWidth: 40, sortable: false, visible: true },
  { id: 'milestone', label: 'Milestone', width: 72, minWidth: 56, sortable: false, visible: true },
  { id: 'key', label: 'Key', width: 100, minWidth: 80, sortable: true, visible: true },
  { id: 'title', label: 'Title', width: 280, minWidth: 150, sortable: true, visible: true },
  { id: 'status', label: 'Status', width: 130, minWidth: 100, sortable: true, visible: true },
  { id: 'progress', label: '% Complete', width: 120, minWidth: 90, sortable: true, visible: true },
  { id: 'priority', label: 'Priority', width: 110, minWidth: 80, sortable: true, visible: true },
  { id: 'assignee', label: 'Assignee', width: 160, minWidth: 100, sortable: false, visible: true },
  { id: 'startDate', label: 'Start Date', width: 120, minWidth: 90, sortable: true, visible: true },
  { id: 'dueDate', label: 'Due Date', width: 120, minWidth: 90, sortable: true, visible: true },
  { id: 'points', label: 'Points', width: 80, minWidth: 60, sortable: false, visible: true },
  { id: 'group', label: 'Group', width: 130, minWidth: 80, sortable: true, visible: true },
  { id: 'tags', label: 'Tags', width: 160, minWidth: 100, sortable: false, visible: true },
];

export function TaskListView({ projectId }: TaskListViewProps) {
  const { tasks: allTasks, openModal, selectTask, selectedTasks, selectAllTasks, clearSelectedTasks, addTask, updateTask, showToast, currentUser, assignTask, users, isTaskDone, isTaskOverdue, getStatusGroup, workflowStatuses, getProjectStatuses, projects, getFilteredTasks, taskSort, setTaskSort, teams, taskFilters, setTaskFilters } = useApp();
  const projectTeam = React.useMemo(() => teams?.find((t: any) => t.projects.some((p: any) => p.id === projectId)) || teams?.[0], [teams, projectId]);
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [editingColumn, setEditingColumn] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [resizing, setResizing] = useState<string | null>(null);
  const [inlineCreateOpen, setInlineCreateOpen] = useState(false);
  const [inlineSubtaskParent, setInlineSubtaskParent] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<'task' | 'bug' | 'story'>('task');
  const [editingField, setEditingField] = useState<{ taskId: string; field: 'title' | 'points' } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroupInputTaskId, setShowNewGroupInputTaskId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [showNewTagInputTaskId, setShowNewTagInputTaskId] = useState<string | null>(null);
  const tagPresetColors = ['#3B82F6', '#EF4444', '#22C55E', '#F59E0B', '#7B68EE', '#8B5CF6', '#EC4899', '#14B8A6'];
  const resizeStartX = useRef(0);

  const getProjectGroups = useCallback((taskProjectId: string) => {
    if (typeof window === 'undefined') return [];
    try {
      const groupsRaw = localStorage.getItem(`pmtool:project:${taskProjectId}:groups`);
      return groupsRaw ? (JSON.parse(groupsRaw) as { id: string; name: string }[]) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }, []);

  const getGroupName = useCallback((taskProjectId: string, groupId?: string) => {
    if (!groupId) return '';
    const groups = getProjectGroups(taskProjectId);
    const found = groups.find(g => g.id === groupId);
    return found ? found.name : groupId;
  }, [getProjectGroups]);

  const generateGroupId = () => `g-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const getProjectTags = useCallback((taskProjectId: string) => {
    if (typeof window === 'undefined') return availableTags;
    try {
      const customTagsRaw = localStorage.getItem(`pmtool:project:${taskProjectId}:tags`);
      const customTags = customTagsRaw ? (JSON.parse(customTagsRaw) as { id: string; name: string; color: string }[]) : [];
      return [...availableTags, ...customTags];
    } catch (e) {
      console.error(e);
      return availableTags;
    }
  }, []);
  const resizeStartWidth = useRef(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pmtool_column_config');
      if (stored) {
        const parsed = JSON.parse(stored) as ColumnConfig[];
        const merged = parsed
          .map(storedCol => {
            const defCol = defaultColumns.find(c => c.id === storedCol.id);
            if (!defCol) return null;
            return {
              ...defCol,
              width: typeof storedCol.width === 'number' ? storedCol.width : defCol.width,
              visible: typeof storedCol.visible === 'boolean' ? storedCol.visible : defCol.visible,
              label: storedCol.label || defCol.label,
            };
          })
          .filter(Boolean) as ColumnConfig[];

        // Add any new default columns that were not in stored config
        defaultColumns.forEach(defCol => {
          if (!merged.some(c => c.id === defCol.id)) {
            merged.push(defCol);
          }
        });

        setColumns(merged);
      }
    } catch (e) {
      console.error('Failed to load column config', e);
    }
  }, []);

  const tasks = projectId
    ? getFilteredTasks(projectId)
    : allTasks;

  // Group tasks: parent tasks with their subtasks
  const getHierarchicalTasks = () => {
    const taskIds = new Set(tasks.map(t => t.id));

    // A task is a parent task (root) if it has no parentId OR its parent is not in the filtered results
    const parentTasks = tasks.filter(t => !t.parentId || !taskIds.has(t.parentId));
    const subtaskMap = new Map<string, Task[]>();

    // A task is a subtask if its parentId is present in the filtered results
    tasks.filter(t => t.parentId && taskIds.has(t.parentId)).forEach(subtask => {
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

  const sortedParentTasks = parentTasks;

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
    if (taskSort.field === field) {
      setTaskSort(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }));
    } else {
      setTaskSort({ field: field as any, direction: 'asc' });
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
      setColumns(prev => {
        const updated = prev.map(c =>
          c.id === editingColumn ? { ...c, label: editingLabel.trim() } : c
        );
        try {
          localStorage.setItem('pmtool_column_config', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });
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

      setColumns(prev => {
        try {
          localStorage.setItem('pmtool_column_config', JSON.stringify(prev));
        } catch (e) {
          console.error(e);
        }
        return prev;
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columns]);

  const getLocalDateString = (date?: Date) => {
    if (!date) return undefined;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

    // Subtasks should always be of type 'subtask'
    const inheritedType = isSubtask ? 'subtask' : newTaskType;

    const projectStatuses = workflowStatuses.filter(s => s.projectId === taskProjectId);
    const defaultStatus = projectStatuses.find(s => s.isDefault) || projectStatuses[0];
    const defaultStatusId = defaultStatus?.id || 'open';

    addTask({
      title: newTaskTitle.trim(),
      type: isSubtask ? inheritedType : newTaskType,
      priority: isSubtask && parentTask ? parentTask.priority : 'medium',
      statusId: defaultStatusId,
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

      try {
        localStorage.setItem('pmtool_column_config', JSON.stringify(newColumns));
      } catch (err) {
        console.error(err);
      }

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
            <PermissionGate permission="tasks:update">
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
            </PermissionGate>
            <PermissionGate permission="tasks:delete">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive bg-transparent"
                onClick={() => openModal('confirm-delete', { taskIds: selectedTasks })}
              >
                Delete
              </Button>
            </PermissionGate>
          </div>
        </div>
      )}

      {/* Table with horizontal scroll */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="border-b-2 border-border">
                <TableHead className="w-16 border-r-2 border-border/60 bg-card px-0">
                  <div className="flex items-center justify-center w-full h-full">
                    <Checkbox
                      checked={selectedTasks.length === tasks.length && tasks.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </div>
                </TableHead>
                {columns.filter(c => c.visible).map((column) => (
                  <TableHead
                    key={column.id}
                    style={{ width: column.width }}
                    className={cn(
                      'relative border-r-2 border-border/60 last:border-r-0 group select-none bg-card',
                      column.sortable && 'cursor-pointer hover:bg-muted/50',
                      resizing === column.id && 'bg-muted/50',
                      draggedColumn === column.id && 'opacity-50 bg-muted',
                      dragOverColumn === column.id && 'border-l-4 border-l-primary/70 bg-primary/5 transition-all'
                    )}
                    draggable
                    onDragStart={(e) => handleDragStart(e, column.id)}
                    onDragOver={(e) => handleDragOver(e, column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className={cn(
                      "flex items-center gap-1 pr-2 w-full",
                      column.id === 'title' ? "justify-start pl-2" : "justify-center"
                    )}>
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
                          className="h-7 text-sm px-1 w-full"
                          autoFocus
                        />
                      ) : (
                        <div
                          className={cn(
                            "flex items-center gap-1 flex-1",
                            column.id === 'title' ? "justify-start" : "justify-center"
                          )}
                          onClick={() => column.sortable && handleSort(column.id)}
                        >
                          <span className="text-sm font-semibold">{column.label}</span>
                          {taskSort.field === column.id && (
                            taskSort.direction === 'asc'
                              ? <ChevronUp className="size-3" />
                              : <ChevronDown className="size-3" />
                          )}
                        </div>
                      )}
                      <Popover>
                        <PopoverTrigger asChild>
                          {['assignee', 'priority', 'status', 'type'].includes(column.id) ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronDown className="size-3" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Pencil className="size-3" />
                            </Button>
                          )}
                        </PopoverTrigger>
                        <PopoverContent className={cn("w-48", ['assignee', 'priority', 'status', 'type'].includes(column.id) ? "p-0" : "p-2")} align="start">
                          {column.id === 'assignee' ? (
                            <div className="flex flex-col max-h-60">
                              <div className="flex items-center justify-between p-2 border-b border-border bg-muted/20">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={projectTeam?.members?.length > 0 && taskFilters.assignees?.length === projectTeam?.members?.length}
                                    onCheckedChange={(checked) => {
                                      setTaskFilters((prev: any) => ({
                                        ...prev,
                                        assignees: checked && projectTeam ? projectTeam.members.map((m: any) => m.id) : []
                                      }));
                                    }}
                                  />
                                  <span className="text-xs font-medium">Select All</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setTaskFilters((prev: any) => ({ ...prev, assignees: [] }))}
                                  className="text-[10px] font-semibold hover:underline underline-offset-2"
                                >
                                  Clear
                                </button>
                              </div>
                              <div className="overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                                {projectTeam?.members?.map((member: any) => (
                                  <label key={member.id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-md cursor-pointer">
                                    <Checkbox
                                      checked={(taskFilters.assignees || []).includes(member.id)}
                                      onCheckedChange={(checked) => {
                                        setTaskFilters((prev: any) => {
                                          const current = prev.assignees || [];
                                          const updated = checked
                                            ? [...current, member.id]
                                            : current.filter((id: string) => id !== member.id);
                                          return { ...prev, assignees: updated };
                                        });
                                      }}
                                    />
                                    <span className="text-xs truncate">{member.name}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="p-1 border-t border-border bg-muted/10">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-7"
                                  onClick={() => startEditingColumn(column.id)}
                                >
                                  Edit Column Name
                                  <Pencil className="size-3" />
                                </Button>
                              </div>
                            </div>
                          ) : column.id === 'priority' ? (
                            <div className="flex flex-col max-h-60">
                              <div className="flex items-center justify-between p-2 border-b border-border bg-muted/20">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={taskFilters.priorities?.length === 4}
                                    onCheckedChange={(checked) => {
                                      setTaskFilters((prev: any) => ({
                                        ...prev,
                                        priorities: checked ? ['critical', 'high', 'medium', 'low'] : []
                                      }));
                                    }}
                                  />
                                  <span className="text-xs font-medium">Select All</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setTaskFilters((prev: any) => ({ ...prev, priorities: [] }))}
                                  className="text-[10px] font-semibold hover:underline underline-offset-2"
                                >
                                  Clear
                                </button>
                              </div>
                              <div className="overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                                {(['critical', 'high', 'medium', 'low'] as const).map((priority) => (
                                  <label key={priority} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-md cursor-pointer">
                                    <Checkbox
                                      checked={(taskFilters.priorities || []).includes(priority)}
                                      onCheckedChange={(checked) => {
                                        setTaskFilters((prev: any) => {
                                          const current = prev.priorities || [];
                                          const updated = checked
                                            ? [...current, priority]
                                            : current.filter((p: string) => p !== priority);
                                          return { ...prev, priorities: updated };
                                        });
                                      }}
                                    />
                                    <span className={cn("text-xs capitalize", priorityConfig[priority].color)}>{priorityConfig[priority].label}</span>
                                  </label>
                                ))}
                              </div>
                              <div className="p-1 border-t border-border bg-muted/10">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-7"
                                  onClick={() => startEditingColumn(column.id)}
                                >
                                  Edit Column Name
                                  <Pencil className="size-3" />
                                </Button>
                              </div>
                            </div>
                          ) : column.id === 'status' ? (
                            (() => {
                              const projectStatuses = projectId ? workflowStatuses.filter((s: any) => s.projectId === projectId) : workflowStatuses;
                              return (
                                <div className="flex flex-col max-h-60">
                                  <div className="flex items-center justify-between p-2 border-b border-border bg-muted/20">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                      <Checkbox
                                        checked={projectStatuses.length > 0 && taskFilters.statuses?.length === projectStatuses.length}
                                        onCheckedChange={(checked) => {
                                          setTaskFilters((prev: any) => ({
                                            ...prev,
                                            statuses: checked ? projectStatuses.map((s: any) => s.id) : []
                                          }));
                                        }}
                                      />
                                      <span className="text-xs font-medium">Select All</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => setTaskFilters((prev: any) => ({ ...prev, statuses: [] }))}
                                      className="text-[10px] font-semibold hover:underline underline-offset-2"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                  <div className="overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                                    {projectStatuses.map((status: any) => (
                                      <label key={status.id} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-md cursor-pointer">
                                        <Checkbox
                                          checked={(taskFilters.statuses || []).includes(status.id)}
                                          onCheckedChange={(checked) => {
                                            setTaskFilters((prev: any) => {
                                              const current = prev.statuses || [];
                                              const updated = checked
                                                ? [...current, status.id]
                                                : current.filter((id: string) => id !== status.id);
                                              return { ...prev, statuses: updated };
                                            });
                                          }}
                                        />
                                        <span
                                          className="inline-block size-2 rounded-full shrink-0"
                                          style={{ backgroundColor: status.color || '#6B7280' }}
                                        />
                                        <span className="text-xs capitalize truncate">{status.name}</span>
                                      </label>
                                    ))}
                                  </div>
                                  <div className="p-1 border-t border-border bg-muted/10">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-7"
                                      onClick={() => startEditingColumn(column.id)}
                                    >
                                      Edit Column Name
                                      <Pencil className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })()
                          ) : column.id === 'type' ? (
                            <div className="flex flex-col max-h-60">
                              <div className="flex items-center justify-between p-2 border-b border-border bg-muted/20">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={taskFilters.types?.length === 5}
                                    onCheckedChange={(checked) => {
                                      setTaskFilters((prev: any) => ({
                                        ...prev,
                                        types: checked ? ['epic', 'story', 'task', 'subtask', 'bug'] : []
                                      }));
                                    }}
                                  />
                                  <span className="text-xs font-medium">Select All</span>
                                </label>
                                <button
                                  type="button"
                                  onClick={() => setTaskFilters((prev: any) => ({ ...prev, types: [] }))}
                                  className="text-[10px] font-semibold hover:underline underline-offset-2"
                                >
                                  Clear
                                </button>
                              </div>
                              <div className="overflow-y-auto custom-scrollbar p-1 space-y-0.5">
                                {(['epic', 'story', 'task', 'subtask', 'bug'] as const).map((taskType) => (
                                  <label key={taskType} className="flex items-center gap-2 p-1.5 hover:bg-muted/50 rounded-md cursor-pointer">
                                    <Checkbox
                                      checked={(taskFilters.types || []).includes(taskType)}
                                      onCheckedChange={(checked) => {
                                        setTaskFilters((prev: any) => {
                                          const current = prev.types || [];
                                          const updated = checked
                                            ? [...current, taskType]
                                            : current.filter((t: string) => t !== taskType);
                                          return { ...prev, types: updated };
                                        });
                                      }}
                                    />
                                    <span className={cn("flex items-center gap-1.5 text-xs capitalize", typeConfig[taskType]?.color)}>
                                      {typeConfig[taskType]?.icon}
                                      {taskType}
                                    </span>
                                  </label>
                                ))}
                              </div>
                              <div className="p-1 border-t border-border bg-muted/10">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-7"
                                  onClick={() => startEditingColumn(column.id)}
                                >
                                  Edit Column Name
                                  <Pencil className="size-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
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
                          )}
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
                <TableHead className="w-12 border-l border-border bg-card">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <Settings className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
                        Visible Columns
                      </div>
                      {columns.map((col) => (
                        <DropdownMenuItem
                          key={col.id}
                          className="flex items-center justify-between cursor-pointer"
                          onSelect={(e) => {
                            e.preventDefault();
                            const updated = columns.map(c =>
                              c.id === col.id ? { ...c, visible: !c.visible } : c
                            );
                            setColumns(updated);
                            try {
                              localStorage.setItem('pmtool_column_config', JSON.stringify(updated));
                            } catch (err) {
                              console.error(err);
                            }
                          }}
                        >
                          <span className="text-sm font-medium">{col.label}</span>
                          <Checkbox checked={col.visible} className="pointer-events-none" />
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive font-medium cursor-pointer"
                        onSelect={() => {
                          setColumns(defaultColumns);
                          try {
                            localStorage.removeItem('pmtool_column_config');
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      >
                        Reset Layout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Inline Create Row */}
              {inlineCreateOpen && !inlineSubtaskParent && (
                <TableRow className="bg-primary/5 border-b-2 border-primary/20">
                  <TableCell className="border-r-2 border-border/60 px-0 text-center align-middle">
                    <div className="flex items-center justify-center w-full">
                      <Plus className="size-4 text-primary" />
                    </div>
                  </TableCell>
                  {columns.filter(c => c.visible).map((column) => {
                    if (column.id === 'type') {
                      return (
                        <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60">
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
                      );
                    }
                    if (column.id === 'milestone') {
                      return (
                        <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60" />
                      );
                    }
                    if (column.id === 'key') {
                      return (
                        <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60">
                          <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                            NEW
                          </Badge>
                        </TableCell>
                      );
                    }
                    if (column.id === 'title') {
                      return (
                        <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60">
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
                      );
                    }
                    return (
                      <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60" />
                    );
                  })}
                  <TableCell></TableCell>
                </TableRow>
              )}

              {sortedParentTasks.map((task) => {
                const priority = priorityConfig[task.priority];
                const type = typeConfig[task.type];
                const status = workflowStatuses.find(s => s.id === task.statusId);
                const statusColor = status?.color || '#6B7280';
                const statusGroup = getStatusGroup(task.statusId);
                const progressPct = statusGroup ? GROUP_PROGRESS_MAP[statusGroup] : 0;
                const project = projects.find(p => p.id === task.projectId);
                const isSelected = selectedTasks.includes(task.id);
                const isCreatingSubtask = inlineSubtaskParent === task.id;
                const taskSubtasks = subtaskMap.get(task.id) || [];
                const isExpanded = expandedTasks.has(task.id);
                const hasChildren = taskSubtasks.length > 0;

                return (
                  <React.Fragment key={task.id}>
                    <TableRow
                      className={cn(
                        'hover:bg-muted/30 group',
                        isSelected && 'bg-primary/5',
                        isTaskOverdue(task) && 'bg-destructive/5 hover:bg-destructive/10 dark:bg-destructive/10 dark:hover:bg-destructive/20'
                      )}
                    >
                      <TableCell className="border-r-2 border-border/60 px-0 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1 w-full">
                          {hasChildren ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-5 text-muted-foreground hover:text-primary flex-shrink-0"
                              onClick={() => toggleExpand(task.id)}
                            >
                              <ChevronRight className={cn(
                                'size-4 transition-transform',
                                isExpanded && 'rotate-90'
                              )} />
                            </Button>
                          ) : null}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleTask(task.id)}
                          />
                        </div>
                      </TableCell>

                      {columns.filter(c => c.visible).map((column) => {
                        switch (column.id) {
                          case 'type':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1">
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
                            );
                          case 'milestone':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                <button
                                  title={task.isMilestone ? 'Remove milestone' : 'Mark as milestone'}
                                  onClick={() => updateTask(task.id, { isMilestone: !task.isMilestone })}
                                  className="flex items-center justify-center w-full h-full p-1 hover:scale-110 transition-transform focus:outline-none"
                                >
                                  <Star
                                    className={cn(
                                      'size-4 transition-colors',
                                      task.isMilestone
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground/30 hover:text-yellow-400'
                                    )}
                                  />
                                </button>
                              </TableCell>
                            );
                          case 'key':
                            return (
                              <TableCell
                                key={column.id}
                                style={{ width: column.width }}
                                className="border-r-2 border-border/60 hover:bg-muted/40 transition-colors cursor-pointer text-center align-middle"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal('edit-task', { taskId: task.id });
                                }}
                              >
                                <Badge variant="outline" className="font-mono text-xs hover:border-primary hover:text-primary transition-all">
                                  {task.key}
                                </Badge>
                              </TableCell>
                            );
                          case 'title':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-left align-middle pl-2" onClick={(e) => e.stopPropagation()}>
                                {editingField?.taskId === task.id && editingField?.field === 'title' ? (
                                  <div className="flex items-center gap-1 w-full pl-2">
                                    <Input
                                      autoFocus
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="h-8 py-1 px-2 text-sm w-full font-medium"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          updateTask(task.id, { title: editingValue });
                                          setEditingField(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingField(null);
                                        }
                                      }}
                                      onBlur={() => {
                                        updateTask(task.id, { title: editingValue });
                                        setEditingField(null);
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className="max-w-full flex items-center justify-between group/title cursor-pointer p-1 hover:bg-muted/40 rounded transition-colors"
                                    onClick={() => {
                                      setEditingField({ taskId: task.id, field: 'title' });
                                      setEditingValue(task.title);
                                    }}
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium truncate text-sm">{task.title}</p>
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
                                    <div className="flex items-center gap-1 opacity-0 group-hover/title:opacity-100 transition-opacity">
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <TaskWatchButton taskId={task.id} size="xs" />
                                      </div>
                                      <Pencil className="size-3.5 ml-1 text-muted-foreground shrink-0" />
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                            );
                          case 'status':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="flex items-center justify-center cursor-pointer focus:outline-none hover:opacity-80 transition-opacity w-full">
                                      <Badge
                                        className="text-xs"
                                        style={{
                                          backgroundColor: `${statusColor}20`,
                                          color: statusColor,
                                          borderColor: `${statusColor}40`
                                        }}
                                        variant="outline"
                                      >
                                        {status?.name || 'Unknown'}
                                      </Badge>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="min-w-40">
                                    {workflowStatuses
                                      .filter(s => s.projectId === task.projectId)
                                      .map((s) => (
                                        <DropdownMenuItem
                                          key={s.id}
                                          onClick={() => updateTask(task.id, { statusId: s.id })}
                                          className="flex items-center gap-2 cursor-pointer"
                                        >
                                          <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                                          <span className={cn("text-sm", s.id === task.statusId && "font-bold text-primary")}>
                                            {s.name}
                                          </span>
                                        </DropdownMenuItem>
                                      ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            );
                          case 'progress':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all",
                                        isTaskDone(task) ? 'bg-green-500' : 'bg-primary'
                                      )}
                                      style={{ width: `${progressPct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-10">
                                    {progressPct}%
                                  </span>
                                </div>
                              </TableCell>
                            );
                          case 'priority':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="flex items-center justify-center cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors focus:outline-none w-full">
                                      <div className={cn('flex items-center justify-center gap-1.5', priority.color)}>
                                        {priority.icon}
                                        <span className="text-sm font-medium">{priority.label}</span>
                                      </div>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-32">
                                    {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => {
                                      const pConf = priorityConfig[p];
                                      return (
                                        <DropdownMenuItem
                                          key={p}
                                          onClick={() => updateTask(task.id, { priority: p })}
                                          className="flex items-center gap-2 cursor-pointer"
                                        >
                                          <span className={pConf.color}>{pConf.icon}</span>
                                          <span className={cn("text-sm", task.priority === p && "font-bold text-primary")}>
                                            {pConf.label}
                                          </span>
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            );
                          case 'assignee':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="flex items-center justify-center w-full focus:outline-none hover:bg-muted/40 p-1 rounded transition-colors">
                                      {task.assignee ? (
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <UserAvatar user={task.assignee} size="xs" />
                                          <span className="text-sm truncate font-medium">{task.assignee.name}</span>
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground text-sm font-medium">Unassigned</span>
                                      )}
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-56 max-h-72 overflow-y-auto">
                                    {task.assignee && (
                                      <>
                                        <DropdownMenuItem
                                          onClick={() => assignTask(task.id, null)}
                                          className="flex items-center gap-2 text-destructive cursor-pointer"
                                        >
                                          <X className="size-4 shrink-0" />
                                          <span className="text-sm font-medium">Remove Assignee</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                      </>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => assignTask(task.id, currentUser.id)}
                                      className="flex items-center gap-2 text-primary font-medium cursor-pointer"
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
                                        onClick={() => assignTask(task.id, u.id)}
                                        className="flex items-center gap-2 cursor-pointer"
                                      >
                                        <UserAvatar user={u} size="xs" />
                                        <span className="text-sm">{u.name}</span>
                                        {task.assignee?.id === u.id && (
                                          <UserCheck className="size-3.5 ml-auto text-primary" />
                                        )}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            );
                          case 'startDate':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="flex items-center justify-center gap-1.5 text-sm hover:bg-muted/40 p-1.5 rounded transition-colors focus:outline-none w-full font-medium">
                                      <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                                      {formatDate(task.startDate)}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent align="start" className="w-auto p-0">
                                    <CalendarComponent
                                      mode="single"
                                      selected={task.startDate ? new Date(task.startDate) : undefined}
                                      onSelect={(date) => {
                                        updateTask(task.id, { startDate: date ? getLocalDateString(date) : undefined });
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            );
                          case 'dueDate':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className={cn(
                                      "flex items-center justify-center gap-1.5 text-sm hover:bg-muted/40 p-1.5 rounded transition-colors focus:outline-none w-full font-medium",
                                      isTaskOverdue(task) ? "text-destructive" : "text-muted-foreground"
                                    )}>
                                      <Calendar className={cn("size-3.5 shrink-0", isTaskOverdue(task) ? "text-destructive" : "text-muted-foreground")} />
                                      {formatDate(task.dueDate)}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent align="start" className="w-auto p-0">
                                    <CalendarComponent
                                      mode="single"
                                      selected={task.dueDate ? new Date(task.dueDate) : undefined}
                                      onSelect={(date) => {
                                        updateTask(task.id, { dueDate: date ? getLocalDateString(date) : undefined });
                                      }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            );
                          case 'points':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                {editingField?.taskId === task.id && editingField?.field === 'points' ? (
                                  <Input
                                    type="number"
                                    autoFocus
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    className="h-8 py-1 px-2 text-sm w-16 text-center"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = parseInt(editingValue, 10);
                                        updateTask(task.id, { storyPoints: isNaN(val) ? undefined : val });
                                        setEditingField(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingField(null);
                                      }
                                    }}
                                    onBlur={() => {
                                      const val = parseInt(editingValue, 10);
                                      updateTask(task.id, { storyPoints: isNaN(val) ? undefined : val });
                                      setEditingField(null);
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors text-center w-full min-h-[1.75rem] flex items-center justify-center font-medium text-sm group/points"
                                    onClick={() => {
                                      setEditingField({ taskId: task.id, field: 'points' });
                                      setEditingValue(task.storyPoints ? String(task.storyPoints) : '');
                                    }}
                                  >
                                    {task.storyPoints !== undefined && task.storyPoints !== null ? (
                                      <Badge variant="secondary" className="text-xs">
                                        {task.storyPoints} pts
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground opacity-20 group-hover/points:opacity-100 transition-opacity text-xs font-semibold">+ Pts</span>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                            );
                          case 'group':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                <Popover>
                                  {task.group ? (
                                    <PopoverTrigger asChild>
                                      <button className="flex items-center justify-center gap-1.5 hover:bg-muted/40 p-1 rounded transition-colors focus:outline-none w-full">
                                        <FolderKanban className="size-3.5 text-muted-foreground shrink-0" />
                                        <Badge variant="outline" className="text-xs font-medium truncate max-w-[100px] md:max-w-none">
                                          {getGroupName(task.projectId, task.group)}
                                        </Badge>
                                      </button>
                                    </PopoverTrigger>
                                  ) : (
                                    <PopoverTrigger asChild>
                                      <button className="flex items-center justify-center gap-1.5 hover:bg-muted/40 p-1 rounded transition-colors focus:outline-none w-full text-muted-foreground text-xs group/grp">
                                        <FolderKanban className="size-3.5 text-muted-foreground shrink-0 opacity-20 group-hover/grp:opacity-100 transition-opacity" />
                                        <span className="opacity-0 group-hover/grp:opacity-100 transition-opacity font-semibold text-xs text-primary">+ Group</span>
                                        <span className="group-hover/grp:hidden pl-1">—</span>
                                      </button>
                                    </PopoverTrigger>
                                  )}
                                  <PopoverContent className="w-56 p-2" align="start">
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold text-muted-foreground px-2 py-1 border-b border-border/50">Task Group</p>
                                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                                        {task.group && (
                                          <button
                                            onClick={() => {
                                              updateTask(task.id, { group: undefined });
                                            }}
                                            className="w-full text-left px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors font-medium flex items-center gap-1.5"
                                          >
                                            <X className="size-3.5" />
                                            Remove Group
                                          </button>
                                        )}
                                        {getProjectGroups(task.projectId).map((g) => (
                                          <button
                                            key={g.id}
                                            onClick={() => {
                                              updateTask(task.id, { group: g.id });
                                            }}
                                            className={cn(
                                              "w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between font-medium",
                                              task.group === g.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                            )}
                                          >
                                            <span className="truncate">{g.name}</span>
                                            {task.group === g.id && <Check className="size-3.5" />}
                                          </button>
                                        ))}
                                        {getProjectGroups(task.projectId).length === 0 && (
                                          <p className="text-xs text-muted-foreground px-2 py-1 italic">No groups created yet</p>
                                        )}
                                      </div>

                                      <div className="border-t border-border pt-2 mt-1">
                                        {showNewGroupInputTaskId === task.id ? (
                                          <div className="space-y-1.5 p-1">
                                            <Input
                                              placeholder="Group name"
                                              value={newGroupName}
                                              onChange={(e) => setNewGroupName(e.target.value)}
                                              className="h-7 text-xs px-2"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newGroupName.trim()) {
                                                  const newId = generateGroupId();
                                                  const currentGroups = getProjectGroups(task.projectId);
                                                  const updatedGroups = [...currentGroups, { id: newId, name: newGroupName.trim() }];
                                                  localStorage.setItem(`pmtool:project:${task.projectId}:groups`, JSON.stringify(updatedGroups));
                                                  updateTask(task.id, { group: newId });
                                                  setNewGroupName('');
                                                  setShowNewGroupInputTaskId(null);
                                                } else if (e.key === 'Escape') {
                                                  setShowNewGroupInputTaskId(null);
                                                  setNewGroupName('');
                                                }
                                              }}
                                            />
                                            <div className="flex gap-1">
                                              <Button
                                                size="sm"
                                                className="h-7 text-xs px-2 flex-1"
                                                disabled={!newGroupName.trim()}
                                                onClick={() => {
                                                  if (newGroupName.trim()) {
                                                    const newId = generateGroupId();
                                                    const currentGroups = getProjectGroups(task.projectId);
                                                    const updatedGroups = [...currentGroups, { id: newId, name: newGroupName.trim() }];
                                                    localStorage.setItem(`pmtool:project:${task.projectId}:groups`, JSON.stringify(updatedGroups));
                                                    updateTask(task.id, { group: newId });
                                                    setNewGroupName('');
                                                    setShowNewGroupInputTaskId(null);
                                                  }
                                                }}
                                              >
                                                Add
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 text-xs px-2"
                                                onClick={() => {
                                                  setShowNewGroupInputTaskId(null);
                                                  setNewGroupName('');
                                                }}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setShowNewGroupInputTaskId(task.id);
                                              setNewGroupName('');
                                            }}
                                            className="w-full text-left px-2 py-1.5 text-xs text-primary hover:bg-primary/5 rounded transition-colors font-semibold flex items-center gap-1"
                                          >
                                            <Plus className="size-3.5" />
                                            Create New Group...
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            );
                          case 'tags':
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                <Popover>
                                  {task.tags && task.tags.length > 0 ? (
                                    <PopoverTrigger asChild>
                                      <button className="flex items-center justify-center gap-1.5 hover:bg-muted/40 p-1 rounded transition-colors focus:outline-none w-full overflow-hidden">
                                        <TagIcon className="size-3.5 text-muted-foreground shrink-0" />
                                        <div className="flex items-center gap-1 flex-wrap truncate">
                                          {task.tags.slice(0, 2).map(tag => (
                                            <Badge
                                              key={tag.id}
                                              variant="outline"
                                              className="text-xs px-1.5 py-0.5 h-5 leading-none shrink-0 font-medium truncate max-w-[80px]"
                                              style={{ borderColor: tag.color, color: tag.color }}
                                            >
                                              {tag.name}
                                            </Badge>
                                          ))}
                                          {task.tags.length > 2 && (
                                            <span className="text-xs font-semibold text-muted-foreground shrink-0">
                                              +{task.tags.length - 2}
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    </PopoverTrigger>
                                  ) : (
                                    <PopoverTrigger asChild>
                                      <button className="flex items-center justify-center gap-1.5 hover:bg-muted/40 p-1 rounded transition-colors focus:outline-none w-full text-muted-foreground text-xs group/tag-btn">
                                        <TagIcon className="size-3.5 text-muted-foreground shrink-0 opacity-20 group-hover/tag-btn:opacity-100 transition-opacity" />
                                        <span className="opacity-0 group-hover/tag-btn:opacity-100 transition-opacity font-semibold text-xs text-primary">+ Tag</span>
                                        <span className="group-hover/tag-btn:hidden pl-1">—</span>
                                      </button>
                                    </PopoverTrigger>
                                  )}
                                  <PopoverContent className="w-56 p-2" align="start">
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold text-muted-foreground px-2 py-1 border-b border-border/50">Task Tags</p>
                                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                                        {getProjectTags(task.projectId).map((tag) => {
                                          const isSelected = (task.tags || []).some(t => t.id === tag.id);
                                          return (
                                            <button
                                              key={tag.id}
                                              onClick={() => {
                                                const updatedTags = isSelected
                                                  ? (task.tags || []).filter(t => t.id !== tag.id)
                                                  : [...(task.tags || []), tag];
                                                updateTask(task.id, { tags: updatedTags });
                                              }}
                                              className={cn(
                                                "w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between font-medium",
                                                isSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                                              )}
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                                                <span className="truncate" style={{ color: tag.color }}>{tag.name}</span>
                                              </div>
                                              {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                                            </button>
                                          );
                                        })}
                                      </div>

                                      <div className="border-t border-border pt-2 mt-1">
                                        {showNewTagInputTaskId === task.id ? (
                                          <div className="space-y-1.5 p-1">
                                            <Input
                                              placeholder="Tag name"
                                              value={newTagName}
                                              onChange={(e) => setNewTagName(e.target.value)}
                                              className="h-7 text-xs px-2"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newTagName.trim()) {
                                                  const newId = `tag-${Date.now().toString(36)}`;
                                                  const customTagsRaw = localStorage.getItem(`pmtool:project:${task.projectId}:tags`);
                                                  const customTags = customTagsRaw ? JSON.parse(customTagsRaw) : [];
                                                  const updatedTagsList = [...customTags, { id: newId, name: newTagName.trim(), color: newTagColor }];
                                                  localStorage.setItem(`pmtool:project:${task.projectId}:tags`, JSON.stringify(updatedTagsList));

                                                  const updatedTaskTags = [...(task.tags || []), { id: newId, name: newTagName.trim(), color: newTagColor }];
                                                  updateTask(task.id, { tags: updatedTaskTags });

                                                  setNewTagName('');
                                                  setShowNewTagInputTaskId(null);
                                                } else if (e.key === 'Escape') {
                                                  setShowNewTagInputTaskId(null);
                                                  setNewTagName('');
                                                }
                                              }}
                                            />
                                            <div className="flex items-center justify-between px-1">
                                              <span className="text-xs text-muted-foreground font-medium">Color:</span>
                                              <div className="flex gap-1">
                                                {tagPresetColors.map((color) => (
                                                  <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setNewTagColor(color)}
                                                    className={cn(
                                                      "size-3 rounded-full border transition-transform shrink-0",
                                                      newTagColor === color ? "scale-125 border-foreground" : "border-transparent hover:scale-110"
                                                    )}
                                                    style={{ backgroundColor: color }}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                            <div className="flex gap-1 pt-0.5">
                                              <Button
                                                size="sm"
                                                className="h-7 text-xs px-2 flex-1"
                                                disabled={!newTagName.trim()}
                                                onClick={() => {
                                                  if (newTagName.trim()) {
                                                    const newId = `tag-${Date.now().toString(36)}`;
                                                    const customTagsRaw = localStorage.getItem(`pmtool:project:${task.projectId}:tags`);
                                                    const customTags = customTagsRaw ? JSON.parse(customTagsRaw) : [];
                                                    const updatedTagsList = [...customTags, { id: newId, name: newTagName.trim(), color: newTagColor }];
                                                    localStorage.setItem(`pmtool:project:${task.projectId}:tags`, JSON.stringify(updatedTagsList));

                                                    const updatedTaskTags = [...(task.tags || []), { id: newId, name: newTagName.trim(), color: newTagColor }];
                                                    updateTask(task.id, { tags: updatedTaskTags });

                                                    setNewTagName('');
                                                    setShowNewTagInputTaskId(null);
                                                  }
                                                }}
                                              >
                                                Add
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 text-xs px-2"
                                                onClick={() => {
                                                  setShowNewTagInputTaskId(null);
                                                  setNewTagName('');
                                                }}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setShowNewTagInputTaskId(task.id);
                                              setNewTagName('');
                                              setNewTagColor('#3B82F6');
                                            }}
                                            className="w-full text-left px-2 py-1.5 text-xs text-primary hover:bg-primary/5 rounded transition-colors font-semibold flex items-center gap-1"
                                          >
                                            <Plus className="size-3.5" />
                                            Create New Tag...
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            );
                          default:
                            return null;
                        }
                      })}
                      <TableCell className="text-center align-middle" onClick={(e) => e.stopPropagation()}>
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
                      const subtaskStatus = workflowStatuses.find(s => s.id === subtask.statusId);
                      const subtaskColor = subtaskStatus?.color || '#6B7280';
                      const isSubtaskSelected = selectedTasks.includes(subtask.id);
                      const subtaskStatusGroup = getStatusGroup(subtask.statusId);
                      const subtaskProgressPct = subtaskStatusGroup ? GROUP_PROGRESS_MAP[subtaskStatusGroup] : 0;

                      return (
                        <TableRow
                          key={subtask.id}
                          className={cn(
                            'hover:bg-muted/30 group bg-muted/20',
                            isSubtaskSelected && 'bg-primary/5',
                            isTaskOverdue(subtask) && 'bg-destructive/5 hover:bg-destructive/10 dark:bg-destructive/10 dark:hover:bg-destructive/20'
                          )}
                        >
                          <TableCell className="border-r-2 border-border/60 px-0 text-center align-middle relative" onClick={(e) => e.stopPropagation()}>
                            {/* Tree connector vertical line */}
                            <div className="absolute top-0 bottom-0 left-[18px] w-px bg-border/80" />
                            {/* Tree connector horizontal line */}
                            <div className="absolute top-1/2 left-[18px] w-3 h-px bg-border/80" />
                            <div className="flex items-center justify-center w-full pl-8">
                              <Checkbox
                                checked={isSubtaskSelected}
                                onCheckedChange={() => toggleTask(subtask.id)}
                              />
                            </div>
                          </TableCell>

                          {columns.filter(c => c.visible).map((column) => {
                            switch (column.id) {
                              case 'type':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-1 pl-4">
                                      <CornerDownRight className="size-3.5 text-muted-foreground/60" />
                                      <span className={subtaskType.color}>{subtaskType.icon}</span>
                                    </div>
                                  </TableCell>
                                );
                              case 'milestone':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      title={subtask.isMilestone ? 'Remove milestone' : 'Mark as milestone'}
                                      onClick={() => updateTask(subtask.id, { isMilestone: !subtask.isMilestone })}
                                      className="flex items-center justify-center w-full h-full p-1 hover:scale-110 transition-transform focus:outline-none"
                                    >
                                      <Star
                                        className={cn(
                                          'size-4 transition-colors',
                                          subtask.isMilestone
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-muted-foreground/30 hover:text-yellow-400'
                                        )}
                                      />
                                    </button>
                                  </TableCell>
                                );
                              case 'key':
                                return (
                                  <TableCell
                                    key={column.id}
                                    style={{ width: column.width }}
                                    className="border-r-2 border-border/60 hover:bg-muted/40 transition-colors cursor-pointer text-center align-middle"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openModal('edit-task', { taskId: subtask.id });
                                    }}
                                  >
                                    <Badge variant="outline" className="font-mono text-xs hover:border-primary hover:text-primary transition-all">
                                      {subtask.key}
                                    </Badge>
                                  </TableCell>
                                );
                              case 'title':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-left align-middle pl-6" onClick={(e) => e.stopPropagation()}>
                                    {editingField?.taskId === subtask.id && editingField?.field === 'title' ? (
                                      <div className="flex items-center gap-1 w-full pl-2">
                                        <Input
                                          autoFocus
                                          value={editingValue}
                                          onChange={(e) => setEditingValue(e.target.value)}
                                          className="h-8 py-1 px-2 text-sm w-full font-medium"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              updateTask(subtask.id, { title: editingValue });
                                              setEditingField(null);
                                            } else if (e.key === 'Escape') {
                                              setEditingField(null);
                                            }
                                          }}
                                          onBlur={() => {
                                            updateTask(subtask.id, { title: editingValue });
                                            setEditingField(null);
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div
                                        className="max-w-full flex items-center justify-between group/title cursor-pointer p-1 hover:bg-muted/40 rounded transition-colors pl-2"
                                        onClick={() => {
                                          setEditingField({ taskId: subtask.id, field: 'title' });
                                          setEditingValue(subtask.title);
                                        }}
                                      >
                                        <p className="font-medium truncate text-sm flex-1 min-w-0">{subtask.title}</p>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/title:opacity-100 transition-opacity">
                                          <div onClick={(e) => e.stopPropagation()}>
                                            <TaskWatchButton taskId={subtask.id} size="xs" />
                                          </div>
                                          <Pencil className="size-3.5 ml-1 text-muted-foreground shrink-0" />
                                        </div>
                                      </div>
                                    )}
                                  </TableCell>
                                );
                              case 'status':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="flex items-center justify-center cursor-pointer focus:outline-none hover:opacity-85 transition-opacity w-full">
                                          <Badge
                                            className="text-xs"
                                            style={{
                                              backgroundColor: `${subtaskColor}20`,
                                              color: subtaskColor,
                                              borderColor: `${subtaskColor}40`
                                            }}
                                            variant="outline"
                                          >
                                            {subtaskStatus?.name || 'Unknown'}
                                          </Badge>
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="min-w-40">
                                        {workflowStatuses
                                          .filter(s => s.projectId === subtask.projectId)
                                          .map((s) => (
                                            <DropdownMenuItem
                                              key={s.id}
                                              onClick={() => updateTask(subtask.id, { statusId: s.id })}
                                              className="flex items-center gap-2 cursor-pointer"
                                            >
                                              <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                                              <span className={cn("text-sm", s.id === subtask.statusId && "font-bold text-primary")}>
                                                {s.name}
                                              </span>
                                            </DropdownMenuItem>
                                          ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                );
                              case 'progress':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle">
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                          className={cn(
                                            "h-full rounded-full transition-all",
                                            isTaskDone(subtask) ? 'bg-green-500' : 'bg-primary'
                                          )}
                                          style={{ width: `${subtaskProgressPct}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-muted-foreground w-10">
                                        {subtaskProgressPct}%
                                      </span>
                                    </div>
                                  </TableCell>
                                );
                              case 'priority':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="flex items-center justify-center cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors focus:outline-none w-full">
                                          <div className={cn('flex items-center justify-center gap-1.5', subtaskPriority.color)}>
                                            {subtaskPriority.icon}
                                            <span className="text-sm font-medium">{subtaskPriority.label}</span>
                                          </div>
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="w-32">
                                        {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => {
                                          const pConf = priorityConfig[p];
                                          return (
                                            <DropdownMenuItem
                                              key={p}
                                              onClick={() => updateTask(subtask.id, { priority: p })}
                                              className="flex items-center gap-2 cursor-pointer"
                                            >
                                              <span className={pConf.color}>{pConf.icon}</span>
                                              <span className={cn("text-sm", subtask.priority === p && "font-bold text-primary")}>
                                                {pConf.label}
                                              </span>
                                            </DropdownMenuItem>
                                          );
                                        })}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                );
                              case 'assignee':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="flex items-center justify-center w-full focus:outline-none hover:bg-muted/40 p-1 rounded transition-colors">
                                          {subtask.assignee ? (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <UserAvatar user={subtask.assignee} size="xs" />
                                              <span className="text-sm truncate font-medium">{subtask.assignee.name}</span>
                                            </div>
                                          ) : (
                                            <span className="text-muted-foreground text-sm font-medium">Unassigned</span>
                                          )}
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="w-56 max-h-72 overflow-y-auto">
                                        {subtask.assignee && (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() => assignTask(subtask.id, null)}
                                              className="flex items-center gap-2 text-destructive cursor-pointer"
                                            >
                                              <X className="size-4 shrink-0" />
                                              <span className="text-sm font-medium">Remove Assignee</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                          </>
                                        )}
                                        <DropdownMenuItem
                                          onClick={() => assignTask(subtask.id, currentUser.id)}
                                          className="flex items-center gap-2 text-primary font-medium cursor-pointer"
                                        >
                                          <UserCheck className="size-4 shrink-0 text-primary" />
                                          <span className="text-sm">Assign to me</span>
                                          {subtask.assignee?.id === currentUser.id && (
                                            <UserCheck className="size-3.5 ml-auto text-primary" />
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {users.map((u) => (
                                          <DropdownMenuItem
                                            key={u.id}
                                            onClick={() => assignTask(subtask.id, u.id)}
                                            className="flex items-center gap-2 cursor-pointer"
                                          >
                                            <UserAvatar user={u} size="xs" />
                                            <span className="text-sm">{u.name}</span>
                                            {subtask.assignee?.id === u.id && (
                                              <UserCheck className="size-3.5 ml-auto text-primary" />
                                            )}
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                );
                              case 'startDate':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button className="flex items-center justify-center gap-1.5 text-sm hover:bg-muted/40 p-1.5 rounded transition-colors focus:outline-none w-full font-medium">
                                          <Calendar className="size-3.5 text-muted-foreground shrink-0" />
                                          {formatDate(subtask.startDate)}
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent align="start" className="w-auto p-0">
                                        <CalendarComponent
                                          mode="single"
                                          selected={subtask.startDate ? new Date(subtask.startDate) : undefined}
                                          onSelect={(date) => {
                                            updateTask(subtask.id, { startDate: date ? getLocalDateString(date) : undefined });
                                          }}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </TableCell>
                                );
                              case 'dueDate':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button className={cn(
                                          "flex items-center justify-center gap-1.5 text-sm hover:bg-muted/40 p-1.5 rounded transition-colors focus:outline-none w-full font-medium",
                                          isTaskOverdue(subtask) ? "text-destructive" : "text-muted-foreground"
                                        )}>
                                          <Calendar className={cn("size-3.5 shrink-0", isTaskOverdue(subtask) ? "text-destructive" : "text-muted-foreground")} />
                                          {formatDate(subtask.dueDate)}
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent align="start" className="w-auto p-0">
                                        <CalendarComponent
                                          mode="single"
                                          selected={subtask.dueDate ? new Date(subtask.dueDate) : undefined}
                                          onSelect={(date) => {
                                            updateTask(subtask.id, { dueDate: date ? getLocalDateString(date) : undefined });
                                          }}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </TableCell>
                                );
                              case 'points':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                    {editingField?.taskId === subtask.id && editingField?.field === 'points' ? (
                                      <Input
                                        type="number"
                                        autoFocus
                                        value={editingValue}
                                        onChange={(e) => setEditingValue(e.target.value)}
                                        className="h-8 py-1 px-2 text-sm w-16 text-center"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const val = parseInt(editingValue, 10);
                                            updateTask(subtask.id, { storyPoints: isNaN(val) ? undefined : val });
                                            setEditingField(null);
                                          } else if (e.key === 'Escape') {
                                            setEditingField(null);
                                          }
                                        }}
                                        onBlur={() => {
                                          const val = parseInt(editingValue, 10);
                                          updateTask(subtask.id, { storyPoints: isNaN(val) ? undefined : val });
                                          setEditingField(null);
                                        }}
                                      />
                                    ) : (
                                      <div
                                        className="cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors text-center w-full min-h-[1.75rem] flex items-center justify-center font-medium text-sm group/points"
                                        onClick={() => {
                                          setEditingField({ taskId: subtask.id, field: 'points' });
                                          setEditingValue(subtask.storyPoints ? String(subtask.storyPoints) : '');
                                        }}
                                      >
                                        {subtask.storyPoints !== undefined && subtask.storyPoints !== null ? (
                                          <Badge variant="secondary" className="text-xs">
                                            {subtask.storyPoints} pts
                                          </Badge>
                                        ) : (
                                          <span className="text-muted-foreground opacity-20 group-hover/points:opacity-100 transition-opacity text-xs font-semibold">+ Pts</span>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                );
                              case 'group':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                    <Popover>
                                      {subtask.group ? (
                                        <PopoverTrigger asChild>
                                          <button className="flex items-center justify-center gap-1.5 hover:bg-muted/40 p-1 rounded transition-colors focus:outline-none w-full">
                                            <FolderKanban className="size-3.5 text-muted-foreground shrink-0" />
                                            <Badge variant="outline" className="text-xs font-medium truncate max-w-[100px] md:max-w-none">
                                              {getGroupName(subtask.projectId, subtask.group)}
                                            </Badge>
                                          </button>
                                        </PopoverTrigger>
                                      ) : (
                                        <PopoverTrigger asChild>
                                          <button className="flex items-center justify-center gap-1.5 hover:bg-muted/40 p-1 rounded transition-colors focus:outline-none w-full text-muted-foreground text-xs group/grp">
                                            <FolderKanban className="size-3.5 text-muted-foreground shrink-0 opacity-20 group-hover/grp:opacity-100 transition-opacity" />
                                            <span className="opacity-0 group-hover/grp:opacity-100 transition-opacity font-semibold text-xs text-primary">+ Group</span>
                                            <span className="group-hover/grp:hidden pl-1">—</span>
                                          </button>
                                        </PopoverTrigger>
                                      )}
                                      <PopoverContent className="w-56 p-2" align="start">
                                        <div className="space-y-2">
                                          <p className="text-xs font-semibold text-muted-foreground px-2 py-1 border-b border-border/50">Task Group</p>
                                          <div className="max-h-48 overflow-y-auto space-y-0.5">
                                            {subtask.group && (
                                              <button
                                                onClick={() => {
                                                  updateTask(subtask.id, { group: undefined });
                                                }}
                                                className="w-full text-left px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors font-medium flex items-center gap-1.5"
                                              >
                                                <X className="size-3.5" />
                                                Remove Group
                                              </button>
                                            )}
                                            {getProjectGroups(subtask.projectId).map((g) => (
                                              <button
                                                key={g.id}
                                                onClick={() => {
                                                  updateTask(subtask.id, { group: g.id });
                                                }}
                                                className={cn(
                                                  "w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between font-medium",
                                                  subtask.group === g.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                                )}
                                              >
                                                <span className="truncate">{g.name}</span>
                                                {subtask.group === g.id && <Check className="size-3.5" />}
                                              </button>
                                            ))}
                                            {getProjectGroups(subtask.projectId).length === 0 && (
                                              <p className="text-xs text-muted-foreground px-2 py-1 italic">No groups created yet</p>
                                            )}
                                          </div>

                                          <div className="border-t border-border pt-2 mt-1">
                                            {showNewGroupInputTaskId === subtask.id ? (
                                              <div className="space-y-1.5 p-1">
                                                <Input
                                                  placeholder="Group name"
                                                  value={newGroupName}
                                                  onChange={(e) => setNewGroupName(e.target.value)}
                                                  className="h-7 text-xs px-2"
                                                  autoFocus
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newGroupName.trim()) {
                                                      const newId = generateGroupId();
                                                      const currentGroups = getProjectGroups(subtask.projectId);
                                                      const updatedGroups = [...currentGroups, { id: newId, name: newGroupName.trim() }];
                                                      localStorage.setItem(`pmtool:project:${subtask.projectId}:groups`, JSON.stringify(updatedGroups));
                                                      updateTask(subtask.id, { group: newId });
                                                      setNewGroupName('');
                                                      setShowNewGroupInputTaskId(null);
                                                    } else if (e.key === 'Escape') {
                                                      setShowNewGroupInputTaskId(null);
                                                      setNewGroupName('');
                                                    }
                                                  }}
                                                />
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    className="h-7 text-xs px-2 flex-1"
                                                    disabled={!newGroupName.trim()}
                                                    onClick={() => {
                                                      if (newGroupName.trim()) {
                                                        const newId = generateGroupId();
                                                        const currentGroups = getProjectGroups(subtask.projectId);
                                                        const updatedGroups = [...currentGroups, { id: newId, name: newGroupName.trim() }];
                                                        localStorage.setItem(`pmtool:project:${subtask.projectId}:groups`, JSON.stringify(updatedGroups));
                                                        updateTask(subtask.id, { group: newId });
                                                        setNewGroupName('');
                                                        setShowNewGroupInputTaskId(null);
                                                      }
                                                    }}
                                                  >
                                                    Add
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs px-2"
                                                    onClick={() => {
                                                      setShowNewGroupInputTaskId(null);
                                                      setNewGroupName('');
                                                    }}
                                                  >
                                                    Cancel
                                                  </Button>
                                                </div>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => {
                                                  setShowNewGroupInputTaskId(subtask.id);
                                                  setNewGroupName('');
                                                }}
                                                className="w-full text-left px-2 py-1.5 text-xs text-primary hover:bg-primary/5 rounded transition-colors font-semibold flex items-center gap-1"
                                              >
                                                <Plus className="size-3.5" />
                                                Create New Group...
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </TableCell>
                                );
                              case 'tags':
                                return (
                                  <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                                    <Popover>
                                      {subtask.tags && subtask.tags.length > 0 ? (
                                        <PopoverTrigger asChild>
                                          <button className="flex items-center justify-center gap-1.5 hover:bg-muted/40 p-1 rounded transition-colors focus:outline-none w-full overflow-hidden">
                                            <TagIcon className="size-3.5 text-muted-foreground shrink-0" />
                                            <div className="flex items-center gap-1 flex-wrap truncate">
                                              {subtask.tags.slice(0, 2).map(tag => (
                                                <Badge
                                                  key={tag.id}
                                                  variant="outline"
                                                  className="text-xs px-1.5 py-0.5 h-5 leading-none shrink-0 font-medium truncate max-w-[80px]"
                                                  style={{ borderColor: tag.color, color: tag.color }}
                                                >
                                                  {tag.name}
                                                </Badge>
                                              ))}
                                              {subtask.tags.length > 2 && (
                                                <span className="text-xs font-semibold text-muted-foreground shrink-0">
                                                  +{subtask.tags.length - 2}
                                                </span>
                                              )}
                                            </div>
                                          </button>
                                        </PopoverTrigger>
                                      ) : (
                                        <PopoverTrigger asChild>
                                          <button className="flex items-center justify-center gap-1.5 hover:bg-muted/40 p-1 rounded transition-colors focus:outline-none w-full text-muted-foreground text-xs group/tag-btn">
                                            <TagIcon className="size-3.5 text-muted-foreground shrink-0 opacity-20 group-hover/tag-btn:opacity-100 transition-opacity" />
                                            <span className="opacity-0 group-hover/tag-btn:opacity-100 transition-opacity font-semibold text-xs text-primary">+ Tag</span>
                                            <span className="group-hover/tag-btn:hidden pl-1">—</span>
                                          </button>
                                        </PopoverTrigger>
                                      )}
                                      <PopoverContent className="w-56 p-2" align="start">
                                        <div className="space-y-2">
                                          <p className="text-xs font-semibold text-muted-foreground px-2 py-1 border-b border-border/50">Task Tags</p>
                                          <div className="max-h-48 overflow-y-auto space-y-0.5">
                                            {getProjectTags(subtask.projectId).map((tag) => {
                                              const isSelected = (subtask.tags || []).some(t => t.id === tag.id);
                                              return (
                                                <button
                                                  key={tag.id}
                                                  onClick={() => {
                                                    const updatedTags = isSelected
                                                      ? (subtask.tags || []).filter(t => t.id !== tag.id)
                                                      : [...(subtask.tags || []), tag];
                                                    updateTask(subtask.id, { tags: updatedTags });
                                                  }}
                                                  className={cn(
                                                    "w-full text-left px-2 py-1.5 text-xs rounded transition-colors flex items-center justify-between font-medium",
                                                    isSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                                                  )}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                                                    <span className="truncate" style={{ color: tag.color }}>{tag.name}</span>
                                                  </div>
                                                  {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                                                </button>
                                              );
                                            })}
                                          </div>

                                          <div className="border-t border-border pt-2 mt-1">
                                            {showNewTagInputTaskId === subtask.id ? (
                                              <div className="space-y-1.5 p-1">
                                                <Input
                                                  placeholder="Tag name"
                                                  value={newTagName}
                                                  onChange={(e) => setNewTagName(e.target.value)}
                                                  className="h-7 text-xs px-2"
                                                  autoFocus
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && newTagName.trim()) {
                                                      const newId = `tag-${Date.now().toString(36)}`;
                                                      const customTagsRaw = localStorage.getItem(`pmtool:project:${subtask.projectId}:tags`);
                                                      const customTags = customTagsRaw ? JSON.parse(customTagsRaw) : [];
                                                      const updatedTagsList = [...customTags, { id: newId, name: newTagName.trim(), color: newTagColor }];
                                                      localStorage.setItem(`pmtool:project:${subtask.projectId}:tags`, JSON.stringify(updatedTagsList));

                                                      const updatedTaskTags = [...(subtask.tags || []), { id: newId, name: newTagName.trim(), color: newTagColor }];
                                                      updateTask(subtask.id, { tags: updatedTaskTags });

                                                      setNewTagName('');
                                                      setShowNewTagInputTaskId(null);
                                                    } else if (e.key === 'Escape') {
                                                      setShowNewTagInputTaskId(null);
                                                      setNewTagName('');
                                                    }
                                                  }}
                                                />
                                                <div className="flex items-center justify-between px-1">
                                                  <span className="text-xs text-muted-foreground font-medium">Color:</span>
                                                  <div className="flex gap-1">
                                                    {tagPresetColors.map((color) => (
                                                      <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setNewTagColor(color)}
                                                        className={cn(
                                                          "size-3 rounded-full border transition-transform shrink-0",
                                                          newTagColor === color ? "scale-125 border-foreground" : "border-transparent hover:scale-110"
                                                        )}
                                                        style={{ backgroundColor: color }}
                                                      />
                                                    ))}
                                                  </div>
                                                </div>
                                                <div className="flex gap-1 pt-0.5">
                                                  <Button
                                                    size="sm"
                                                    className="h-7 text-xs px-2 flex-1"
                                                    disabled={!newTagName.trim()}
                                                    onClick={() => {
                                                      if (newTagName.trim()) {
                                                        const newId = `tag-${Date.now().toString(36)}`;
                                                        const customTagsRaw = localStorage.getItem(`pmtool:project:${subtask.projectId}:tags`);
                                                        const customTags = customTagsRaw ? JSON.parse(customTagsRaw) : [];
                                                        const updatedTagsList = [...customTags, { id: newId, name: newTagName.trim(), color: newTagColor }];
                                                        localStorage.setItem(`pmtool:project:${subtask.projectId}:tags`, JSON.stringify(updatedTagsList));

                                                        const updatedTaskTags = [...(subtask.tags || []), { id: newId, name: newTagName.trim(), color: newTagColor }];
                                                        updateTask(subtask.id, { tags: updatedTaskTags });

                                                        setNewTagName('');
                                                        setShowNewTagInputTaskId(null);
                                                      }
                                                    }}
                                                  >
                                                    Add
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs px-2"
                                                    onClick={() => {
                                                      setShowNewTagInputTaskId(null);
                                                      setNewTagName('');
                                                    }}
                                                  >
                                                    Cancel
                                                  </Button>
                                                </div>
                                              </div>
                                            ) : (
                                              <button
                                                onClick={() => {
                                                  setShowNewTagInputTaskId(subtask.id);
                                                  setNewTagName('');
                                                  setNewTagColor('#3B82F6');
                                                }}
                                                className="w-full text-left px-2 py-1.5 text-xs text-primary hover:bg-primary/5 rounded transition-colors font-semibold flex items-center gap-1"
                                              >
                                                <Plus className="size-3.5" />
                                                Create New Tag...
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </TableCell>
                                );
                              default:
                                return null;
                            }
                          })}
                          <TableCell className="text-center align-middle" onClick={(e) => e.stopPropagation()}>
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
                        <TableCell className="border-r-2 border-border/60 px-0 text-center align-middle">
                          <div className="flex items-center justify-center w-full">
                            <CornerDownRight className="size-4 text-accent" />
                          </div>
                        </TableCell>
                        {columns.filter(c => c.visible).map((column) => {
                          if (column.id === 'type') {
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60 text-center align-middle">
                                <div className="flex items-center justify-center gap-1">
                                  <CornerDownRight className="size-3 text-muted-foreground" />
                                  <span className="text-blue-400">{typeConfig.subtask.icon}</span>
                                </div>
                              </TableCell>
                            );
                          }
                          if (column.id === 'milestone') {
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60" />
                            );
                          }
                          if (column.id === 'key') {
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60">
                                <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                                  SUB
                                </Badge>
                              </TableCell>
                            );
                          }
                          if (column.id === 'title') {
                            return (
                              <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60">
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
                            );
                          }
                          return (
                            <TableCell key={column.id} style={{ width: column.width }} className="border-r-2 border-border/60" />
                          );
                        })}
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
