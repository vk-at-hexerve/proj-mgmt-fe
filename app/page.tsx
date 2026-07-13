'use client';

import { useState, useCallback, useEffect } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { UnassignedTasks } from '@/components/dashboard/unassigned-tasks';
import { ProjectsOverview } from '@/components/dashboard/projects-overview';
import { RecentTasks } from '@/components/dashboard/recent-tasks';
import { SprintProgress } from '@/components/dashboard/sprint-progress';
import { EmployeeTaskMetrics } from '@/components/dashboard/employee-task-metrics';
import { ProjectTaskMetrics } from '@/components/dashboard/project-task-metrics';
import { DueDateTaskWidget } from '@/components/dashboard/due-date-task-widget';
import { ChartWidget, ChartWidgetConfig, ChartFilters } from '@/components/dashboard/chart-widget';
import { AddWidgetModal, NewWidgetType } from '@/components/dashboard/add-widget-modal';
import { AICopilot } from '@/components/ai/ai-copilot';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FolderKanban,
  ListChecks,
  Clock,
  Users,
  Sparkles,
  Calendar,
  Settings2,
  GripVertical,
  Eye,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  X,
  UserX,
  BarChart3,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Widget configuration types
interface WidgetConfig {
  id: string;
  title: string;
  type: 'metric' | 'panel' | 'chart';
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
}

interface MetricConfig extends WidgetConfig {
  type: 'metric';
  metricKey: 'activeProjects' | 'tasksCompleted' | 'tasksInProgress' | 'overdueTasks' | 'teamUtilization' | 'unassignedTasksCount' | 'usersWithNoTasks' | 'avgTasksPerUser' | 'custom';
  icon: string;
  customValue?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  changeLabel?: string;
}

interface PanelConfig extends WidgetConfig {
  type: 'panel';
  component: 'projects' | 'tasks' | 'sprint' | 'unassignedTasks' | 'employeeMetrics' | 'projectMetrics' | 'dueDateTasks';
  columnSpan: 1 | 2;
}

interface ChartConfig extends WidgetConfig, ChartWidgetConfig {
  type: 'chart';
  columnSpan: 1 | 2;
}

type DashboardWidget = MetricConfig | PanelConfig | ChartConfig;

// Default dashboard configuration
const defaultMetrics: MetricConfig[] = [
  { id: 'metric-1', title: 'Active Projects', type: 'metric', metricKey: 'activeProjects', icon: 'FolderKanban', visible: true, order: 1, size: 'small' },
  { id: 'metric-2', title: 'Tasks Completed', type: 'metric', metricKey: 'tasksCompleted', icon: 'ListChecks', visible: true, order: 2, size: 'small' },
  { id: 'metric-3', title: 'In Progress', type: 'metric', metricKey: 'tasksInProgress', icon: 'Clock', visible: true, order: 3, size: 'small' },
  { id: 'metric-4', title: 'Overdue', type: 'metric', metricKey: 'overdueTasks', icon: 'Calendar', visible: true, order: 4, size: 'small' },
  { id: 'metric-5', title: 'Team Utilization', type: 'metric', metricKey: 'teamUtilization', icon: 'Users', visible: true, order: 5, size: 'small' },
  { id: 'metric-7', title: 'Idle Users', type: 'metric', metricKey: 'usersWithNoTasks', icon: 'UserX', visible: true, order: 6, size: 'small' },
  { id: 'metric-8', title: 'Avg Tasks/User', type: 'metric', metricKey: 'avgTasksPerUser', icon: 'BarChart3', visible: true, order: 7, size: 'small' },
];

const defaultPanels: PanelConfig[] = [
  { id: 'panel-1', title: 'Active Projects', type: 'panel', component: 'projects', visible: true, order: 1, size: 'large', columnSpan: 2 },
  { id: 'panel-2', title: 'Recent Tasks', type: 'panel', component: 'tasks', visible: true, order: 2, size: 'large', columnSpan: 2 },
  { id: 'panel-3', title: 'Sprint Progress', type: 'panel', component: 'sprint', visible: true, order: 3, size: 'medium', columnSpan: 1 },
  { id: 'panel-4', title: 'Unassigned Tasks', type: 'panel', component: 'unassignedTasks', visible: true, order: 4, size: 'medium', columnSpan: 1 },
  { id: 'panel-5', title: 'Team Workload', type: 'panel', component: 'employeeMetrics', visible: true, order: 5, size: 'medium', columnSpan: 2 },
  { id: 'panel-6', title: 'Project Metrics', type: 'panel', component: 'projectMetrics', visible: true, order: 6, size: 'medium', columnSpan: 1 },
  { id: 'panel-7', title: 'Due Date Tasks', type: 'panel', component: 'dueDateTasks', visible: true, order: 7, size: 'medium', columnSpan: 1 },
];

const defaultCharts: ChartConfig[] = [
  {
    id: 'chart-1', title: 'Task Status Distribution', type: 'chart', visible: true, order: 1, size: 'medium', columnSpan: 1,
    chartType: 'pie', dataSource: 'tasks-by-status', filters: {}
  },
  {
    id: 'chart-2', title: 'Active Workload', type: 'chart', visible: true, order: 2, size: 'medium', columnSpan: 1,
    chartType: 'bar', dataSource: 'user-workload', filters: {}
  }
];

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  FolderKanban: <FolderKanban className="size-6" />,
  ListChecks: <ListChecks className="size-6" />,
  Clock: <Clock className="size-6" />,
  Calendar: <Calendar className="size-6" />,
  Users: <Users className="size-6" />,
  Sparkles: <Sparkles className="size-6" />,
  UserX: <UserX className="size-6" />,
  BarChart3: <BarChart3 className="size-6" />,
};

export default function DashboardPage() {
  const { tasks, projects, users, currentUser, isMounted, isTaskDone, getStatusGroup } = useApp();

  const [isEditMode, setIsEditMode] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);

  const [metrics, setMetrics] = useState<MetricConfig[]>(defaultMetrics);
  const [panels, setPanels] = useState<PanelConfig[]>(defaultPanels);
  const [charts, setCharts] = useState<ChartConfig[]>(defaultCharts);

  // Load from localStorage on mount
  useEffect(() => {
    if (!isMounted || currentUser?.id === 'loading') return;

    try {
      const savedConfig = localStorage.getItem(`dashboard_config_${currentUser?.id}`);
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.metrics) {
          // Auto-migrate AI Confidence to Unassigned Tasks
          const migratedMetrics = parsed.metrics.map((m: any) => {
            if (m.metricKey === 'aiConfidenceScore') {
              return { ...m, metricKey: 'unassignedTasksCount', title: 'Unassigned Tasks', icon: 'UserX' };
            }
            return m;
          });
          setMetrics(migratedMetrics);
        }
        if (parsed.panels) setPanels(parsed.panels);
        if (parsed.charts) setCharts(parsed.charts);
      }
    } catch (e) {
      console.error('Failed to load dashboard config', e);
    }
  }, [isMounted, currentUser?.id]);

  // Save to localStorage when state changes (debounced)
  useEffect(() => {
    if (!isMounted || currentUser?.id === 'loading') return;

    const timeoutId = setTimeout(() => {
      localStorage.setItem(`dashboard_config_${currentUser?.id}`, JSON.stringify({
        metrics,
        panels,
        charts
      }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [metrics, panels, charts, isMounted, currentUser?.id]);

  // Derived metrics from real data
  const usersWithNoTasks = users.filter(u => {
    const activeTasks = tasks.filter(t => t.assignee?.id === u.id && !isTaskDone(t));
    return activeTasks.length === 0;
  }).length;

  const activeTaskCount = tasks.filter(t => t.assignee && !isTaskDone(t)).length;
  const avgTasksPerUser = users.length > 0 ? Math.round((activeTaskCount / users.length) * 10) / 10 : 0;

  const liveMetrics = {
    activeProjects: projects.filter(p => p.status === 'active').length,
    tasksCompleted: tasks.filter(t => isTaskDone(t)).length,
    tasksInProgress: tasks.filter(t => getStatusGroup(t.statusId) === 'IN_PROGRESS').length,
    overdueTasks: tasks.filter(t => !isTaskDone(t) && t.dueDate && new Date(t.dueDate) < new Date()).length,
    teamUtilization: users.length > 0 ? Math.round(((users.length - usersWithNoTasks) / users.length) * 100) : 0,
    unassignedTasksCount: tasks.filter(t => !t.assignee && !isTaskDone(t)).length,
    usersWithNoTasks,
    avgTasksPerUser,
  };

  const greeting = () => {
    if (!isMounted) return 'Hello';
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Generic move handler
  const moveItem = <T extends WidgetConfig>(items: T[], id: string, direction: 'up' | 'down'): T[] => {
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return items;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return items;

    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    return newItems.map((item, i) => ({ ...item, order: i + 1 }));
  };

  const handleToggleMetric = useCallback((id: string) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, visible: !m.visible } : m));
  }, []);

  const handleTogglePanel = useCallback((id: string) => {
    setPanels(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p));
  }, []);

  const handleToggleChart = useCallback((id: string) => {
    setCharts(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  }, []);

  const handleRemoveChart = useCallback((id: string) => {
    setCharts(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleMoveMetric = useCallback((id: string, dir: 'up' | 'down') => setMetrics(prev => moveItem(prev, id, dir)), []);
  const handleMovePanel = useCallback((id: string, dir: 'up' | 'down') => setPanels(prev => moveItem(prev, id, dir)), []);
  const handleMoveChart = useCallback((id: string, dir: 'up' | 'down') => setCharts(prev => moveItem(prev, id, dir)), []);

  const handleUpdateChartFilters = useCallback((id: string, filters: ChartFilters) => {
    setCharts(prev => prev.map(c => c.id === id ? { ...c, filters } : c));
  }, []);

  const handleAddWidget = useCallback((newWidget: NewWidgetType) => {
    if (newWidget.kind === 'chart') {
      const newChart: ChartConfig = {
        ...newWidget.config,
        id: `chart-${Date.now()}`,
        type: 'chart',
        visible: true,
        order: charts.length + 1,
        size: 'medium',
        columnSpan: 1
      };
      setCharts(prev => [...prev, newChart]);
    } else {
      // For panels, check if it already exists, if so make it visible and put at bottom
      const existing = panels.find(p => p.component === newWidget.component);
      if (existing) {
        setPanels(prev => {
          const others = prev.filter(p => p.id !== existing.id);
          return [...others, { ...existing, visible: true, order: prev.length + 1 }];
        });
      } else {
        // If it doesn't exist in the current state (e.g. newly added feature), find it in defaultPanels
        const defaultPanel = defaultPanels.find(p => p.component === newWidget.component);
        if (defaultPanel) {
          setPanels(prev => [...prev, { ...defaultPanel, id: `panel-${Date.now()}`, visible: true, order: prev.length + 1 }]);
        }
      }
    }
  }, [charts.length, panels]);

  const handleResetDashboard = useCallback(() => {
    setMetrics(defaultMetrics);
    setPanels(defaultPanels);
    setCharts(defaultCharts);
    localStorage.removeItem(`dashboard_config_${currentUser?.id}`);
  }, [currentUser?.id]);

  const getMetricValue = (metric: MetricConfig): string | number => {
    if (metric.customValue !== undefined) return metric.customValue;
    const value = liveMetrics[metric.metricKey as keyof typeof liveMetrics] || 0;
    if (metric.metricKey === 'teamUtilization') {
      return `${value}%`;
    }
    return value;
  };

  const visibleMetrics = metrics.filter(m => m.visible).sort((a, b) => a.order - b.order);
  const visiblePanels = panels.filter(p => p.visible).sort((a, b) => a.order - b.order);
  const visibleCharts = charts.filter(c => c.visible).sort((a, b) => a.order - b.order);

  const renderPanel = (panel: PanelConfig) => {
    switch (panel.component) {
      case 'projects': return <ProjectsOverview />;
      case 'tasks': return <RecentTasks />;
      case 'sprint': return <SprintProgress />;
      case 'unassignedTasks': return <UnassignedTasks />;
      case 'employeeMetrics': return <EmployeeTaskMetrics />;
      case 'projectMetrics': return <ProjectTaskMetrics />;
      case 'dueDateTasks': return <DueDateTaskWidget />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title={`${greeting()}, ${currentUser?.name?.split(' ')[0] || 'User'}`}
          subtitle="Here's what's happening with your projects today"
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Dashboard Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isEditMode && (
                  <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/30">
                    <Settings2 className="size-3" />
                    Edit Mode
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddWidgetModal(true)}
                  className="gap-2"
                >
                  <Plus className="size-4" />
                  Add Widget
                </Button>
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="gap-2"
                >
                  <Settings2 className="size-4" />
                  {isEditMode ? 'Done Editing' : 'Customize'}
                </Button>
                {isEditMode && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettingsModal(true)}
                      className="gap-2"
                    >
                      <Eye className="size-4" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetDashboard}
                      className="gap-2 text-muted-foreground"
                    >
                      <RotateCcw className="size-4" />
                      Reset
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {visibleMetrics.map((metric) => (
                <div key={metric.id} className="relative group">
                  {isEditMode && (
                    <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary" size="icon" className="size-6 rounded-full shadow-md"
                        onClick={() => handleMoveMetric(metric.id, 'up')} disabled={metric.order === 1}
                      >
                        <ChevronUp className="size-3" />
                      </Button>
                      <Button
                        variant="secondary" size="icon" className="size-6 rounded-full shadow-md"
                        onClick={() => handleMoveMetric(metric.id, 'down')} disabled={metric.order === visibleMetrics.length}
                      >
                        <ChevronDown className="size-3" />
                      </Button>
                      <Button
                        variant="destructive" size="icon" className="size-6 rounded-full shadow-md"
                        onClick={() => handleToggleMetric(metric.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  )}
                  <div className={cn("transition-all", isEditMode && "ring-2 ring-dashed ring-muted-foreground/30 rounded-lg")}>
                    <MetricCard
                      title={metric.title}
                      value={getMetricValue(metric)}
                      icon={iconMap[metric.icon]}
                      change={metric.change}
                      changeLabel={metric.changeLabel}
                      trend={metric.trend}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Group panels by their layout */}
              {visiblePanels.map((panel) => (
                <div
                  key={panel.id}
                  className={cn(
                    "relative group",
                    panel.columnSpan === 2 && "lg:col-span-2"
                  )}
                >
                  {isEditMode && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary" size="icon" className="size-7 rounded-full shadow-md"
                        onClick={() => handleMovePanel(panel.id, 'up')} disabled={panel.order === 1}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="secondary" size="icon" className="size-7 rounded-full shadow-md"
                        onClick={() => handleMovePanel(panel.id, 'down')} disabled={panel.order === visiblePanels.length}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Button
                        variant="destructive" size="icon" className="size-7 rounded-full shadow-md"
                        onClick={() => handleTogglePanel(panel.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                  <div className={cn("transition-all h-full", isEditMode && "ring-2 ring-dashed ring-muted-foreground/30 rounded-lg")}>
                    {renderPanel(panel)}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Widgets Section */}
            {visibleCharts.length > 0 && (
              <>
                <h3 className="font-medium text-muted-foreground mt-8 mb-2">Analytics Charts</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {visibleCharts.map((chart) => (
                    <div
                      key={chart.id}
                      className={cn("relative group", chart.columnSpan === 2 && "lg:col-span-2")}
                    >
                      {isEditMode && (
                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary" size="icon" className="size-7 rounded-full shadow-md"
                            onClick={() => handleMoveChart(chart.id, 'up')} disabled={chart.order === 1}
                          >
                            <ChevronUp className="size-4" />
                          </Button>
                          <Button
                            variant="secondary" size="icon" className="size-7 rounded-full shadow-md"
                            onClick={() => handleMoveChart(chart.id, 'down')} disabled={chart.order === visibleCharts.length}
                          >
                            <ChevronDown className="size-4" />
                          </Button>
                          <Button
                            variant="destructive" size="icon" className="size-7 rounded-full shadow-md"
                            onClick={() => handleRemoveChart(chart.id)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      )}
                      <div className={cn("transition-all h-full", isEditMode && "ring-2 ring-dashed ring-muted-foreground/30 rounded-lg")}>
                        <ChartWidget
                          config={chart}
                          onUpdateFilters={handleUpdateChartFilters}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {visibleCharts.length === 0 && visiblePanels.length === 0 && !isEditMode && (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground mb-4">Your dashboard is empty.</p>
                <Button onClick={() => setShowAddWidgetModal(true)}>
                  <Plus className="size-4 mr-2" /> Add Widgets
                </Button>
              </div>
            )}
          </div>
        </main>
        <AICopilot />
      </div>

      {/* Widget Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 shrink-0">
            <DialogTitle>Dashboard Widgets Settings</DialogTitle>
            <DialogDescription>
              Toggle visibility and reorder widgets on your dashboard
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-8 pr-2">
            {/* Metrics Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Metrics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {metrics.map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-6 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {iconMap[metric.icon]}
                      </div>
                      <span className="font-medium text-xs truncate">{metric.title}</span>
                    </div>
                    <Switch checked={metric.visible} onCheckedChange={() => handleToggleMetric(metric.id)} className="scale-75" />
                  </div>
                ))}
              </div>
            </div>

            {/* Panels Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Panels</h4>
              <div className="space-y-2">
                {panels.map((panel) => (
                  <div key={panel.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <GripVertical className="size-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{panel.title}</span>
                    </div>
                    <Switch checked={panel.visible} onCheckedChange={() => handleTogglePanel(panel.id)} />
                  </div>
                ))}
              </div>
            </div>

            {/* Charts Section */}
            {charts.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Charts</h4>
                <div className="space-y-2">
                  {charts.map((chart) => (
                    <div key={chart.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <GripVertical className="size-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{chart.title}</span>
                        <Badge variant="outline" className="text-[10px]">{chart.chartType}</Badge>
                      </div>
                      <Switch checked={chart.visible} onCheckedChange={() => handleToggleChart(chart.id)} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 shrink-0">
            <Button variant="outline" onClick={handleResetDashboard}>
              <RotateCcw className="size-4 mr-2" />
              Reset to Default
            </Button>
            <Button onClick={() => setShowSettingsModal(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Widget Gallery Modal */}
      <AddWidgetModal
        open={showAddWidgetModal}
        onOpenChange={setShowAddWidgetModal}
        onAdd={handleAddWidget}
      />
    </div>
  );
}
