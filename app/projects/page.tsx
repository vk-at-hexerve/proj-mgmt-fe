'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { TaskListView } from '@/components/tasks/task-list-view';
import { GanttChart } from '@/components/gantt/gantt-chart';
import { ProjectGridView } from '@/components/project-grid/project-grid-view';
import { ProjectCalendarView } from '@/components/calendar/project-calendar-view';
import { AICopilot } from '@/components/ai/ai-copilot';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutGrid,
  List,
  GanttChartSquare,
  Calendar,
  Filter,
  Users,
  Sparkles,
  X,
  Table2,
  Layers,
  Plus,
  Play,
  Archive,
  MoreHorizontal,
  Pencil,
  Check,
  Workflow,
  PlusCircle,
  Settings,
  MoveRight,
  Maximize2,
  Minimize2,
  Save,
} from 'lucide-react';
import { getStatusName } from '@/lib/status-utils';
// import { sprints as initialSprints, generateCalendarEvents, users } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/ui/user-avatar';
import type { Sprint } from '@/lib/types';

import { ProjectFilter } from '@/components/filters/project-filter';

type ViewType = 'kanban' | 'list' | 'gantt' | 'calendar' | 'grid' | 'backlog';

const viewOptions: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'kanban', label: 'Board View', icon: <LayoutGrid className="size-4" /> },
  { id: 'list', label: 'List View', icon: <List className="size-4" /> },
  { id: 'gantt', label: 'Gantt View', icon: <GanttChartSquare className="size-4" /> },
  { id: 'calendar', label: 'Calendar View', icon: <Calendar className="size-4" /> },
  { id: 'grid', label: 'Grid View', icon: <Table2 className="size-4" /> },
  { id: 'backlog', label: 'Backlog', icon: <Layers className="size-4" /> },
];

export default function ProjectsPage() {
  const {
    projects, tasks: allTasks, showToast, teams, currentProject: currentProjectId, sprints: contextSprints, users, addSprint, updateSprint, openModal, workflowStatuses, updateTask, getFilteredTasks,
    taskFilters, taskSort, customFilters, activeCustomFilterId, addCustomFilter, applyCustomFilter
  } = useApp();
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [selectedBacklogTasks, setSelectedBacklogTasks] = useState<string[]>([]);
  const [dateError, setDateError] = useState('');
  const [customFilterName, setCustomFilterName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFilterPopoverOpen, setSaveFilterPopoverOpen] = useState(false);

  // Confirmation state for moving tasks between sprints/backlog
  const [confirmMoveDialogOpen, setConfirmMoveDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{ taskId: string; sprintId: string | null } | null>(null);


  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];
  const sprints = contextSprints.filter(s => s.projectId === currentProject?.id);
  const activeSprint = sprints.find((s) => s.status === 'active');
  const projectTeam = teams.find(t => t.projects.some(p => p.id === currentProject?.id)) || teams[0];

  const backlogTasks = currentProject ? getFilteredTasks(currentProject.id).filter(t => !t.sprintId) : [];

  const handleCreateSprint = () => {
    if (!newSprint.name.trim() || !newSprint.startDate || !newSprint.endDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Use local time to evaluate inputs
    const [startYear, startMonth, startDay] = newSprint.startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = newSprint.endDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    if (start < today) {
      setDateError("Start date cannot be in the past.");
      return;
    }

    if (end < start) {
      setDateError("End date cannot be before start date.");
      return;
    }

    setDateError('');

    const sprintId = `sprint-${Date.now()}`;
    const sprint: Sprint = {
      id: sprintId,
      name: newSprint.name.trim(),
      goal: newSprint.goal.trim() || undefined,
      startDate: newSprint.startDate,
      endDate: newSprint.endDate,
      status: 'planning',
      projectId: currentProject.id,
    };
    addSprint(sprint, selectedBacklogTasks);
    setSprintDialogOpen(false);
    setNewSprint({ name: '', goal: '', startDate: '', endDate: '' });
    setSelectedBacklogTasks([]);
    showToast({
      title: 'Sprint created',
      description: `${sprint.name} with ${selectedBacklogTasks.length} task(s)`,
      type: 'success'
    });
  };

  const handleMoveToSprint = (taskId: string, sprintId: string | null) => {
    setPendingMove({ taskId, sprintId });
    setConfirmMoveDialogOpen(true);
  };

  const executeMoveToSprint = () => {
    if (!pendingMove) return;
    const { taskId, sprintId } = pendingMove;
    updateTask(taskId, { sprintId: sprintId || undefined });
    showToast({
      title: sprintId ? 'Task moved to sprint' : 'Task moved to backlog',
      type: 'success'
    });
    setConfirmMoveDialogOpen(false);
    setPendingMove(null);
  };

  const toggleBacklogTaskSelection = (taskId: string) => {
    setSelectedBacklogTasks((prev: string[]) =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleStartSprint = (sprintId: string) => {
    updateSprint(sprintId, { status: 'active' });
    // If there was another active sprint, complete it (simplified logic for now)
    const active = contextSprints.find(s => s.status === 'active' && s.id !== sprintId);
    if (active) updateSprint(active.id, { status: 'completed' });
    showToast({ title: 'Sprint started', type: 'success' });
  };

  const handleCompleteSprint = (sprintId: string) => {
    updateSprint(sprintId, { status: 'completed' });
    showToast({ title: 'Sprint completed', type: 'success' });
  };

  const handleSaveCustomFilter = async () => {
    if (!customFilterName.trim() || !currentProject) return;
    setIsSaving(true);
    await addCustomFilter(currentProject.id, customFilterName.trim(), taskFilters, taskSort);
    setCustomFilterName('');
    setIsSaving(false);
    setSaveFilterPopoverOpen(false);
  };



  const activeFiltersCount =
    (taskFilters.assignees?.length || 0) +
    (taskFilters.priorities?.length || 0) +
    (taskFilters.types?.length || 0) +
    (taskFilters.statuses?.length || 0) +
    (taskFilters.isMilestone !== undefined && taskFilters.isMilestone !== null ? 1 : 0) +
    (taskFilters.startDateAfter ? 1 : 0) +
    (taskFilters.endDateBefore ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0 || taskSort.field !== 'title' || taskSort.direction !== 'asc';

  if (!currentProject) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <p className="text-muted-foreground">No projects available</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title={currentProject.name}
          subtitle={`${currentProject.key} - ${currentProject.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
        />
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Toolbar */}
          {/* Row 1: Navigation & Filtering Controls */}
          <div className="px-6 py-2.5 bg-card flex items-center gap-3 overflow-x-auto shrink-0 border-b border-border/10">

            {/* View Toggle — icon + label */}
            <div className="flex items-center rounded-md border border-border bg-muted/50 p-0.5 gap-0.5 shrink-0 h-8">
              {viewOptions.map(v => (
                <Button
                  key={v.id}
                  variant={currentView === v.id ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 gap-1.5 text-sm font-medium rounded-sm"
                  disabled={v.id === 'grid'}
                  onClick={() => setCurrentView(v.id)}
                >
                  {v.icon}
                  <span>{v.label}</span>
                </Button>
              ))}
            </div>

            {/* Sprint Selector + Create Sprint */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Select defaultValue={activeSprint?.id}>
                <SelectTrigger size="sm" className="w-[150px] text-sm font-medium rounded-md">
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.id} value={sprint.id}>
                      <div className="flex items-center gap-2">
                        {sprint.name}
                        {sprint.status === 'active' && (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                        {sprint.status === 'planning' && (
                          <Badge variant="outline" className="text-xs">Planning</Badge>
                        )}
                        {sprint.status === 'completed' && (
                          <Badge variant="secondary" className="text-xs">Done</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="backlog">
                    <div className="flex items-center gap-2">
                      <Archive className="size-3.5" />
                      Backlog
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-1.5 bg-transparent text-sm font-medium rounded-md border-border"
                onClick={() => setSprintDialogOpen(true)}
              >
                <Plus className="size-3.5" />
                New Sprint
              </Button>
            </div>

            {/* Filter */}
            <ProjectFilter projectId={currentProject.id} />
          </div>

          {/* Row 2: Secondary Action Controls */}
          <div className="px-6 py-2.5 bg-card flex items-center gap-3 overflow-x-auto shrink-0 border-b border-border">
            {/* AI Suggestions */}
            <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 text-primary border-primary/30 hover:bg-primary/10 bg-transparent text-sm font-medium rounded-md">
              <Sparkles className="size-4" />
              AI Suggestions
              <span className="ml-1 px-1 h-4 min-w-[16px] flex items-center justify-center text-[10px] font-semibold rounded-full bg-secondary text-secondary-foreground">0</span>
            </Button>

            {/* Team */}
            <Popover open={teamOpen} onOpenChange={setTeamOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 gap-1.5 bg-transparent text-sm font-medium rounded-md border-border">
                  <Users className="size-4" />
                  Team
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="end">
                <h4 className="font-medium text-sm mb-3">Project Team</h4>
                {projectTeam ? (
                  <div className="space-y-4">
                    {/* Project Manager (Mandatory) */}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <UserAvatar user={projectTeam.projectManager} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{projectTeam.projectManager.name}</p>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-primary/70">Project Manager</p>
                      </div>
                    </div>

                    {/* Team Lead (Optional) */}
                    {projectTeam.lead && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                        <UserAvatar user={projectTeam.lead} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{projectTeam.lead.name}</p>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Team Lead</p>
                        </div>
                      </div>
                    )}

                    {/* Product Manager (Optional) */}
                    {projectTeam.productManager && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
                        <UserAvatar user={projectTeam.productManager} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{projectTeam.productManager.name}</p>
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Product Manager</p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Members ({projectTeam.members.length})</p>
                      <div className="flex flex-wrap gap-1">
                        {projectTeam.members.slice(0, 6).map((member: any) => (
                          <UserAvatar key={member.id} user={member} size="sm" className="ring-1 ring-background" />
                        ))}
                        {projectTeam.members.length > 6 && (
                          <div className="size-7 rounded-full bg-muted flex items-center justify-center text-xs">
                            +{projectTeam.members.length - 6}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => {
                      setTeamOpen(false);
                      showToast({ title: 'View Team', description: 'Opening team management...', type: 'info' });
                    }}>
                      Manage Team
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No team assigned</p>
                )}
              </PopoverContent>
            </Popover>

            {/* Project Settings */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 gap-1.5 bg-transparent text-sm font-medium rounded-md border-border"
              onClick={() => openModal('status-settings', { projectId: currentProject.id })}
            >
              <Workflow className="size-4" />
              Workflow Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 gap-1.5 bg-transparent text-sm font-medium rounded-md border-border"
              onClick={() => openModal('edit-project', { projectId: currentProject.id })}
            >
              <Settings className="size-4" />
              Settings
            </Button>

            {/* Save Filter Controls */}
            {hasActiveFilters && !activeCustomFilterId && (
              <Popover open={saveFilterPopoverOpen} onOpenChange={setSaveFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 gap-1.5 bg-transparent text-sm font-medium rounded-md border-border text-primary hover:text-primary hover:bg-primary/10"
                  >
                    <Save className="size-4" />
                    Save Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-3" align="start">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Save Custom Filter</h4>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="Filter name..."
                        value={customFilterName}
                        onChange={(e) => setCustomFilterName(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" className="h-8 shrink-0 text-xs" onClick={handleSaveCustomFilter} disabled={!customFilterName.trim() || isSaving}>
                        Save
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {activeCustomFilterId && (
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-md border border-border/50 h-8 shrink-0">
                <div className="flex items-center gap-1.5 min-w-0 max-w-[150px]">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Active</span>
                  <span className="text-xs font-medium truncate">{customFilters.find(f => f.id === activeCustomFilterId)?.name}</span>
                </div>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-xs hover:bg-background shrink-0 text-muted-foreground hover:text-foreground" onClick={() => applyCustomFilter(null)}>
                  Clear Filter
                </Button>
              </div>
            )}

            {/* Board Specific Controls: Full Screen */}
            {currentView === 'kanban' && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 gap-1.5 bg-transparent text-sm font-medium rounded-md border-border animate-in fade-in zoom-in duration-200"
                onClick={() => setIsFullscreen((f) => !f)}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="size-4" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="size-4" />
                    Fullscreen
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6">
            {currentView === 'kanban' && (
              <KanbanBoard
                projectId={currentProject.id}
                isFullscreen={isFullscreen}
                setIsFullscreen={setIsFullscreen}
              />
            )}
            {currentView === 'list' && <TaskListView projectId={currentProject.id} />}
            {currentView === 'grid' && <ProjectGridView projectId={currentProject.id} projectKey={currentProject.key} />}
            {currentView === 'gantt' && (
              <Card className="h-full">
                <CardContent className="p-0 h-full">
                  <GanttChart projectId={currentProject.id} />
                </CardContent>
              </Card>
            )}
            {currentView === 'backlog' && (
              <div className="h-full flex flex-col gap-4 overflow-auto">
                {/* Sprint sections */}
                {sprints.map(sprint => {
                  const sprintTasks = currentProject ? getFilteredTasks(currentProject.id).filter(t => t.sprintId === sprint.id) : [];
                  return (
                    <Card key={sprint.id} className="shrink-0">
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-sm">{sprint.name}</h3>
                          {sprint.status === 'active' && <Badge variant="default" className="text-xs">Active</Badge>}
                          {sprint.status === 'planning' && <Badge variant="outline" className="text-xs">Planning</Badge>}
                          {sprint.status === 'completed' && <Badge variant="secondary" className="text-xs">Completed</Badge>}
                          <span className="text-xs text-muted-foreground">
                            {new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' — '}
                            {new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <Badge variant="outline" className="text-xs">{sprintTasks.length} tasks</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {sprint.status === 'planning' && (
                            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => handleStartSprint(sprint.id)}>
                              <Play className="size-3" />
                              Start Sprint
                            </Button>
                          )}
                          {sprint.status === 'active' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleCompleteSprint(sprint.id)}>
                              Complete Sprint
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-0">
                        {sprintTasks.length === 0 ? (
                          <p className="text-sm text-muted-foreground px-4 py-3">No tasks in this sprint</p>
                        ) : (
                          <div className="divide-y divide-border">
                            {sprintTasks.map(task => (
                              <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors group">
                                <span className={cn('text-xs font-mono px-1.5 py-0.5 rounded border', {
                                  'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400': task.type === 'bug',
                                  'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400': task.type === 'epic',
                                  'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400': task.type === 'story',
                                  'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400': task.type === 'task' || task.type === 'subtask',
                                })}>
                                  {task.key}
                                </span>
                                <span className="flex-1 text-sm truncate">{task.title}</span>
                                <Badge variant="outline" className="text-xs capitalize hidden sm:flex">{getStatusName(workflowStatuses, task.statusId)}</Badge>
                                <Badge variant="outline" className="text-xs capitalize hidden md:flex">{task.priority}</Badge>
                                {task.assignee ? (
                                  <UserAvatar user={task.assignee} size="sm" />
                                ) : (
                                  <div className="size-6 rounded-full bg-muted border border-dashed border-border flex items-center justify-center">
                                    <Users className="size-3 text-muted-foreground" />
                                  </div>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleMoveToSprint(task.id, null)}>
                                      <Archive className="size-4 mr-2" />
                                      Move to Backlog
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {sprints.filter(s => s.id !== sprint.id).map(s => (
                                      <DropdownMenuItem key={s.id} onClick={() => handleMoveToSprint(task.id, s.id)}>
                                        <MoveRight className="size-4 mr-2" />
                                        Move to {s.name}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Backlog section */}
                <Card className="shrink-0">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Archive className="size-4 text-muted-foreground" />
                      <h3 className="font-semibold text-sm">Backlog</h3>
                      <Badge variant="outline" className="text-xs">{backlogTasks.length} tasks</Badge>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs bg-transparent" onClick={() => setSprintDialogOpen(true)}>
                      <Plus className="size-3" />
                      Create Sprint
                    </Button>
                  </div>
                  <CardContent className="p-0">
                    {backlogTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground px-4 py-3">No tasks in backlog</p>
                    ) : (
                      <div className="divide-y divide-border">
                        {backlogTasks.map(task => (
                          <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors group">
                            <Checkbox
                              checked={selectedBacklogTasks.includes(task.id)}
                              onCheckedChange={() => toggleBacklogTaskSelection(task.id)}
                              className="shrink-0"
                            />
                            <span className={cn('text-xs font-mono px-1.5 py-0.5 rounded border', {
                              'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400': task.type === 'bug',
                              'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400': task.type === 'epic',
                              'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400': task.type === 'story',
                              'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400': task.type === 'task' || task.type === 'subtask',
                            })}>
                              {task.key}
                            </span>
                            <span className="flex-1 text-sm truncate">{task.title}</span>
                            {task.storyPoints && (
                              <Badge variant="secondary" className="text-xs hidden lg:flex">{task.storyPoints} pts</Badge>
                            )}
                            <Badge variant="outline" className="text-xs capitalize hidden sm:flex">{getStatusName(workflowStatuses, task.statusId)}</Badge>
                            <Badge variant="outline" className="text-xs capitalize hidden md:flex">{task.priority}</Badge>
                            {task.assignee ? (
                              <UserAvatar user={task.assignee} size="sm" />
                            ) : (
                              <div className="size-6 rounded-full bg-muted border border-dashed border-border flex items-center justify-center">
                                <Users className="size-3 text-muted-foreground" />
                              </div>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {sprints.map(s => (
                                  <DropdownMenuItem key={s.id} onClick={() => handleMoveToSprint(task.id, s.id)}>
                                    <MoveRight className="size-4 mr-2" />
                                    Move to {s.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            {currentView === 'calendar' && (
              <ProjectCalendarView projectId={currentProject.id} />
            )}
          </div>
        </div>
        <AICopilot />
      </div>

      {/* Create Sprint Dialog */}
      <Dialog open={sprintDialogOpen} onOpenChange={(open) => {
        setSprintDialogOpen(open);
        if (!open) {
          setSelectedBacklogTasks([]);
          setDateError('');
        }
      }}>

        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Sprint</DialogTitle>
            <DialogDescription>Define the sprint details and select tasks from the backlog.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sprint-name">Sprint Name *</Label>
              <Input
                id="sprint-name"
                placeholder={`Sprint ${sprints.length + 1}`}
                value={newSprint.name}
                onChange={e => setNewSprint(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sprint-goal">Sprint Goal</Label>
              <Textarea
                id="sprint-goal"
                placeholder="What does the team aim to achieve?"
                value={newSprint.goal}
                onChange={e => setNewSprint(p => ({ ...p, goal: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sprint-start">Start Date *</Label>
                <Input
                  id="sprint-start"
                  type="date"
                  value={newSprint.startDate}
                  onChange={e => setNewSprint(p => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sprint-end">End Date *</Label>
                <Input
                  id="sprint-end"
                  type="date"
                  value={newSprint.endDate}
                  onChange={e => setNewSprint(p => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Backlog Task Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Backlog Tasks</Label>
                {selectedBacklogTasks.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedBacklogTasks.length} selected
                    {' '}
                    ({backlogTasks.filter(t => selectedBacklogTasks.includes(t.id)).reduce((sum, t) => sum + (t.storyPoints || 0), 0)} pts)
                  </Badge>
                )}
              </div>
              <ScrollArea className="h-48 border rounded-lg">
                {backlogTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4 text-center">No tasks in backlog</p>
                ) : (
                  <div className="divide-y divide-border">
                    {backlogTasks.map(task => (
                      <label
                        key={task.id}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedBacklogTasks.includes(task.id) && "bg-primary/5"
                        )}
                      >
                        <Checkbox
                          checked={selectedBacklogTasks.includes(task.id)}
                          onCheckedChange={() => toggleBacklogTaskSelection(task.id)}
                        />
                        <span className={cn('text-[10px] font-mono px-1 py-0.5 rounded border shrink-0', {
                          'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400': task.type === 'bug',
                          'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400': task.type === 'epic',
                          'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400': task.type === 'story',
                          'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400': task.type === 'task' || task.type === 'subtask',
                        })}>
                          {task.key}
                        </span>
                        <span className="flex-1 text-sm truncate">{task.title}</span>
                        {task.storyPoints && (
                          <Badge variant="outline" className="text-[10px] shrink-0">{task.storyPoints} pts</Badge>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
            {dateError && <p className="text-sm text-destructive mt-2">{dateError}</p>}
          </div>
          <DialogFooter>

            <Button variant="outline" onClick={() => { setSprintDialogOpen(false); setSelectedBacklogTasks([]); }}>Cancel</Button>
            <Button
              onClick={handleCreateSprint}
              disabled={!newSprint.name.trim() || !newSprint.startDate || !newSprint.endDate}
            >
              Create Sprint {selectedBacklogTasks.length > 0 && `(${selectedBacklogTasks.length} tasks)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Task Confirmation Dialog */}
      <Dialog open={confirmMoveDialogOpen} onOpenChange={setConfirmMoveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <Workflow className="size-5" />
              Confirm Task Move
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-muted-foreground">
              Moving this task may change its workflow, sprint flow, or status. This can affect active sprint commitments, team velocity calculations, and board visualization.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm font-medium">
              Are you sure you want to move this task?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setConfirmMoveDialogOpen(false);
                setPendingMove(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={executeMoveToSprint}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
