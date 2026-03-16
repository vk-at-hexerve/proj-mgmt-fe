'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { TaskListView } from '@/components/tasks/task-list-view';
import { GanttChart } from '@/components/gantt/gantt-chart';
import { ProjectGridView } from '@/components/project-grid/project-grid-view';
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
  MoveRight,
  Check,
} from 'lucide-react';
import { sprints as initialSprints, generateCalendarEvents, users } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Sprint } from '@/lib/types';

type ViewType = 'kanban' | 'list' | 'gantt' | 'calendar' | 'grid' | 'backlog';

interface FilterState {
  assignees: string[];
  priorities: string[];
  types: string[];
}

const viewOptions: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'kanban',  label: 'Board View',    icon: <LayoutGrid className="size-4" /> },
  { id: 'list',    label: 'List View',     icon: <List className="size-4" /> },
  { id: 'gantt',   label: 'Gantt View',    icon: <GanttChartSquare className="size-4" /> },
  { id: 'calendar',label: 'Calendar View', icon: <Calendar className="size-4" /> },
  { id: 'grid',    label: 'Grid View',     icon: <Table2 className="size-4" /> },
  { id: 'backlog', label: 'Backlog',       icon: <Layers className="size-4" /> },
];

export default function ProjectsPage() {
  const { projects, tasks: allTasks, showToast, teams, currentProject: currentProjectId } = useApp();
  const [currentView, setCurrentView] = useState<ViewType>('kanban');
  const [filters, setFilters] = useState<FilterState>({ assignees: [], priorities: [], types: [] });
  const [filterOpen, setFilterOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [sprints, setSprints] = useState<Sprint[]>(initialSprints);
  const [newSprint, setNewSprint] = useState({ name: '', goal: '', startDate: '', endDate: '' });
  const [selectedBacklogTasks, setSelectedBacklogTasks] = useState<string[]>([]);
  const [localTasks, setLocalTasks] = useState(allTasks);

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];
  const activeSprint = sprints.find((s) => s.status === 'active');
  const calendarEvents = generateCalendarEvents().filter(e => e.projectId === currentProject?.id);
  const projectTeam = teams[0];

  const backlogTasks = localTasks.filter(t =>
    t.projectId === currentProject?.id && !t.sprintId
  );

  const activeFiltersCount = filters.assignees.length + filters.priorities.length + filters.types.length;
  const clearFilters = () => setFilters({ assignees: [], priorities: [], types: [] });
  const toggleFilter = (type: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value],
    }));
  };

  const handleCreateSprint = () => {
    if (!newSprint.name.trim() || !newSprint.startDate || !newSprint.endDate) return;
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
    setSprints(prev => [...prev, sprint]);
    // Move selected backlog tasks to this sprint
    if (selectedBacklogTasks.length > 0) {
      setLocalTasks(prev => prev.map(t =>
        selectedBacklogTasks.includes(t.id) ? { ...t, sprintId } : t
      ));
    }
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
    setLocalTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, sprintId: sprintId || undefined } : t
    ));
    showToast({ 
      title: sprintId ? 'Task moved to sprint' : 'Task moved to backlog', 
      type: 'success' 
    });
  };

  const toggleBacklogTaskSelection = (taskId: string) => {
    setSelectedBacklogTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleStartSprint = (sprintId: string) => {
    setSprints(prev => prev.map(s =>
      s.id === sprintId ? { ...s, status: 'active' } :
      s.status === 'active' ? { ...s, status: 'completed' } : s
    ));
    showToast({ title: 'Sprint started', type: 'success' });
  };

  const handleCompleteSprint = (sprintId: string) => {
    setSprints(prev => prev.map(s =>
      s.id === sprintId ? { ...s, status: 'completed' } : s
    ));
    showToast({ title: 'Sprint completed', type: 'success' });
  };

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
          <div className="px-6 py-3 border-b border-border bg-card flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">

              {/* View Toggle — icon + label */}
              <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1 gap-0.5">
                {viewOptions.map(v => (
                  <Button
                    key={v.id}
                    variant={currentView === v.id ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-2.5 gap-1.5 text-xs"
                    onClick={() => setCurrentView(v.id)}
                  >
                    {v.icon}
                    <span>{v.label}</span>
                  </Button>
                ))}
              </div>

              {/* Sprint Selector + Create Sprint */}
              <div className="flex items-center gap-1">
                <Select defaultValue={activeSprint?.id}>
                  <SelectTrigger className="w-[170px] h-8">
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
                  className="h-8 gap-1.5 bg-transparent"
                  onClick={() => setSprintDialogOpen(true)}
                >
                  <Plus className="size-3.5" />
                  New Sprint
                </Button>
              </div>

              {/* Filter */}
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn('h-8 gap-2 bg-transparent', activeFiltersCount > 0 && 'border-primary')}>
                    <Filter className="size-4" />
                    Filter
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">{activeFiltersCount}</Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-4" align="start">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Filter Tasks</h4>
                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearFilters}>
                        <X className="size-3 mr-1" /> Clear
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Priority</Label>
                      <div className="space-y-1.5">
                        {['critical', 'high', 'medium', 'low'].map((priority) => (
                          <label key={priority} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={filters.priorities.includes(priority)}
                              onCheckedChange={() => toggleFilter('priorities', priority)}
                            />
                            <span className="text-sm capitalize">{priority}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <div className="space-y-1.5">
                        {['task', 'bug', 'story', 'epic'].map((type) => (
                          <label key={type} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={filters.types.includes(type)}
                              onCheckedChange={() => toggleFilter('types', type)}
                            />
                            <span className="text-sm capitalize">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4" size="sm" onClick={() => {
                    setFilterOpen(false);
                    showToast({ title: 'Filters applied', description: `${activeFiltersCount} filter(s) active`, type: 'success' });
                  }}>
                    Apply Filters
                  </Button>
                </PopoverContent>
              </Popover>

              {/* Group By */}
              <Select defaultValue="status">
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Group by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="assignee">Assignee</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              {/* AI Suggestions */}
              <Button variant="outline" size="sm" className="h-8 gap-2 text-primary border-primary/30 hover:bg-primary/10 bg-transparent">
                <Sparkles className="size-4" />
                AI Suggestions
                <Badge variant="secondary" className="ml-1 text-xs">3</Badge>
              </Button>

              {/* Team */}
              <Popover open={teamOpen} onOpenChange={setTeamOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2 bg-transparent">
                    <Users className="size-4" />
                    Team
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4" align="end">
                  <h4 className="font-medium text-sm mb-3">Project Team</h4>
                  {projectTeam ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                        <Avatar className="size-8">
                          <AvatarImage src={projectTeam.lead.avatar || '/placeholder.svg'} />
                          <AvatarFallback className="text-xs">
                            {projectTeam.lead.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{projectTeam.lead.name}</p>
                          <p className="text-xs text-muted-foreground">Team Lead</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Members ({projectTeam.members.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {projectTeam.members.slice(0, 6).map((member) => (
                            <Avatar key={member.id} className="size-7" title={member.name}>
                              <AvatarImage src={member.avatar || '/placeholder.svg'} />
                              <AvatarFallback className="text-xs">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
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
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-6">
            {currentView === 'kanban' && <KanbanBoard projectId={currentProject.id} />}
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
                  const sprintTasks = localTasks.filter(t => t.sprintId === sprint.id && t.projectId === currentProject.id);
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
                                <Badge variant="outline" className="text-xs capitalize hidden sm:flex">{task.status.replace('-', ' ')}</Badge>
                                <Badge variant="outline" className="text-xs capitalize hidden md:flex">{task.priority}</Badge>
                                {task.assignee ? (
                                  <Avatar className="size-6">
                                    <AvatarImage src={task.assignee.avatar || '/placeholder.svg'} />
                                    <AvatarFallback className="text-[10px]">{task.assignee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
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
                            <Badge variant="outline" className="text-xs capitalize hidden sm:flex">{task.status.replace('-', ' ')}</Badge>
                            <Badge variant="outline" className="text-xs capitalize hidden md:flex">{task.priority}</Badge>
                            {task.assignee ? (
                              <Avatar className="size-6">
                                <AvatarImage src={task.assignee.avatar || '/placeholder.svg'} />
                                <AvatarFallback className="text-[10px]">{task.assignee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
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
              <Card className="h-full flex flex-col">
                <CardContent className="flex-1 p-6">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Project Calendar</h3>
                      <Link href="/calendar">
                        <Button variant="outline" size="sm">Open Full Calendar</Button>
                      </Link>
                    </div>
                    <div className="flex-1 grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">{day}</div>
                      ))}
                      {Array.from({ length: 35 }, (_, i) => {
                        const date = new Date('2026-01-01');
                        date.setDate(date.getDate() + i - 3);
                        const dayEvents = calendarEvents.filter(e => {
                          const eventDate = new Date(e.start);
                          return eventDate.toDateString() === date.toDateString();
                        });
                        const isToday = date.toDateString() === new Date('2026-01-20').toDateString();
                        return (
                          <div key={i} className={cn('min-h-[80px] p-2 rounded-lg border border-border', isToday && 'ring-2 ring-primary bg-primary/5')}>
                            <span className={cn('text-sm', isToday && 'font-semibold text-primary')}>{date.getDate()}</span>
                            <div className="mt-1 space-y-1">
                              {dayEvents.slice(0, 2).map((event) => (
                                <div key={event.id} className="text-xs px-1 py-0.5 rounded truncate" style={{ backgroundColor: `${event.color}20`, color: event.color }}>
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && <span className="text-xs text-muted-foreground">+{dayEvents.length - 2}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        <AICopilot />
      </div>

      {/* Create Sprint Dialog */}
      <Dialog open={sprintDialogOpen} onOpenChange={(open) => {
        setSprintDialogOpen(open);
        if (!open) setSelectedBacklogTasks([]);
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
    </div>
  );
}
