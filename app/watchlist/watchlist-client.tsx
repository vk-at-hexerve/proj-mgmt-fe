'use client';


import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Eye,
  EyeOff,
  Bug,
  BookOpen,
  Zap,
  ListTodo,
  ChevronUp,
  ChevronDown,
  Inbox,
  UserCheck,
} from 'lucide-react';
import type { Task, TaskPriority } from '@/lib/types';
import { getStatusName } from '@/lib/status-utils';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

const priorityConfig: Record<TaskPriority, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-destructive text-destructive-foreground' },
  high: { label: 'High', className: 'bg-warning text-warning-foreground' },
  medium: { label: 'Medium', className: 'bg-accent text-accent-foreground' },
  low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
};

const typeIcons: Record<Task['type'], React.ReactNode> = {
  epic: <Zap className="size-4 text-primary" />,
  story: <BookOpen className="size-4 text-accent" />,
  task: <ListTodo className="size-4 text-muted-foreground" />,
  subtask: <ListTodo className="size-3 text-muted-foreground" />,
  bug: <Bug className="size-4 text-destructive" />,
  lead: <UserCheck className="size-4 text-indigo-500" />,
};

type SortField = 'key' | 'title' | 'project' | 'status' | 'priority' | 'assignee' | 'updatedAt';

export default function WatchlistClient() {
  const router = useRouter();
  const {
    tasks,
    projects,
    toggleWatchTask,
    getStatusGroup,
    workflowStatuses,
    isTaskOverdue,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Derive watched tasks reactively from global state
  const watchedTasks = useMemo(() => {
    return tasks.filter((t) => t.isWatching);
  }, [tasks]);

  // Apply search + filters
  const filteredTasks = useMemo(() => {
    return watchedTasks.filter((task) => {
      const matchesSearch =
        searchQuery === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.key.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || getStatusGroup(task.statusId) === statusFilter;

      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter;

      const matchesProject =
        projectFilter === 'all' || task.projectId === projectFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    });
  }, [watchedTasks, searchQuery, statusFilter, priorityFilter, projectFilter, getStatusGroup]);

  // Apply sorting
  const sortedTasks = useMemo(() => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...filteredTasks].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'key':
          cmp = a.key.localeCompare(b.key);
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'project': {
          const pA = projects.find((p) => p.id === a.projectId)?.name || '';
          const pB = projects.find((p) => p.id === b.projectId)?.name || '';
          cmp = pA.localeCompare(pB);
          break;
        }
        case 'status': {
          const sA = getStatusGroup(a.statusId) || '';
          const sB = getStatusGroup(b.statusId) || '';
          cmp = sA.localeCompare(sB);
          break;
        }
        case 'priority':
          cmp = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
          break;
        case 'assignee':
          cmp = (a.assignee?.name || '').localeCompare(b.assignee?.name || '');
          break;
        case 'updatedAt':
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredTasks, sortField, sortDirection, projects, getStatusGroup]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="size-3.5 ml-1 inline" />
    ) : (
      <ChevronDown className="size-3.5 ml-1 inline" />
    );
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || 'Unknown';
  };

  const getProjectKey = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.key || '???';
  };

  const getStatusDisplay = (statusId: string) => {
    const ws = workflowStatuses.find((s) => s.id === statusId);
    if (!ws) return { name: 'Unknown', color: 'hsl(var(--muted))' };
    return { name: ws.name, color: ws.color };
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="My Watchlist"
          subtitle={`${watchedTasks.length} task${watchedTasks.length === 1 ? '' : 's'} you're watching`}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-border bg-card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search watched tasks..."
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
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
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
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground tabular-nums">
              {sortedTasks.length} of {watchedTasks.length} shown
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {sortedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                <div className="p-4 rounded-full bg-muted/50">
                  <Inbox className="size-10 opacity-50" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-lg font-medium">
                    {watchedTasks.length === 0
                      ? 'Your watchlist is empty'
                      : 'No tasks match your filters'}
                  </p>
                  <p className="text-sm max-w-sm">
                    {watchedTasks.length === 0
                      ? 'Start watching tasks by clicking the eye icon on any task across your projects.'
                      : 'Try adjusting your search or filter criteria.'}
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-[56px]">Type</TableHead>
                    <TableHead
                      className="w-[100px] cursor-pointer select-none"
                      onClick={() => handleSort('key')}
                    >
                      ID <SortIcon field="key" />
                    </TableHead>
                    <TableHead
                      className="min-w-[200px] cursor-pointer select-none"
                      onClick={() => handleSort('title')}
                    >
                      Title <SortIcon field="title" />
                    </TableHead>
                    <TableHead
                      className="w-[120px] cursor-pointer select-none"
                      onClick={() => handleSort('project')}
                    >
                      Project <SortIcon field="project" />
                    </TableHead>
                    <TableHead
                      className="w-[130px] cursor-pointer select-none"
                      onClick={() => handleSort('status')}
                    >
                      Status <SortIcon field="status" />
                    </TableHead>
                    <TableHead
                      className="w-[100px] cursor-pointer select-none"
                      onClick={() => handleSort('priority')}
                    >
                      Priority <SortIcon field="priority" />
                    </TableHead>
                    <TableHead
                      className="w-[140px] cursor-pointer select-none"
                      onClick={() => handleSort('assignee')}
                    >
                      Assignee <SortIcon field="assignee" />
                    </TableHead>
                    <TableHead
                      className="w-[140px] cursor-pointer select-none"
                      onClick={() => handleSort('updatedAt')}
                    >
                      Last Updated <SortIcon field="updatedAt" />
                    </TableHead>
                    <TableHead className="w-[56px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((task) => {
                    const overdue = isTaskOverdue(task);
                    const statusDisplay = getStatusDisplay(task.statusId);
                    const priCfg = priorityConfig[task.priority];

                    return (
                      <TableRow
                        key={task.id}
                        className={cn(
                          'cursor-pointer transition-colors',
                          overdue && 'bg-destructive/5 hover:bg-destructive/10',
                        )}
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        {/* Type */}
                        <TableCell className="text-center">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>{typeIcons[task.type]}</span>
                              </TooltipTrigger>
                              <TooltipContent className="capitalize">{task.type}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>

                        {/* Key */}
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">
                            {task.key}
                          </span>
                        </TableCell>

                        {/* Title */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate max-w-[300px]">
                              {task.title}
                            </span>
                            {overdue && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Project */}
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {getProjectKey(task.projectId)}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge
                            className="text-xs"
                            style={{
                              backgroundColor: statusDisplay.color,
                              color: '#fff',
                            }}
                          >
                            {statusDisplay.name}
                          </Badge>
                        </TableCell>

                        {/* Priority */}
                        <TableCell>
                          <Badge className={cn('text-xs', priCfg.className)}>
                            {priCfg.label}
                          </Badge>
                        </TableCell>

                        {/* Assignee */}
                        <TableCell>
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <UserAvatar user={task.assignee} size="xs" />
                              <span className="text-sm truncate max-w-[90px]">
                                {task.assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              Unassigned
                            </span>
                          )}
                        </TableCell>

                        {/* Last Updated */}
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {format(new Date(task.updatedAt), 'PPpp')}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>

                        {/* Unwatch */}
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="p-1 rounded hover:bg-muted text-primary transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleWatchTask(task.id);
                                  }}
                                >
                                  <EyeOff className="size-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Stop watching</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
