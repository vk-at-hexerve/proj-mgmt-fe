'use client';

import { useState, useCallback } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { MetricCard } from '@/components/dashboard/metric-card';
import { AIInsightsPanel } from '@/components/dashboard/ai-insights-panel';
import { ProjectsOverview } from '@/components/dashboard/projects-overview';
import { RecentTasks } from '@/components/dashboard/recent-tasks';
import { SprintProgress } from '@/components/dashboard/sprint-progress';
import { AICopilot } from '@/components/ai/ai-copilot';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  EyeOff,
  RotateCcw,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Widget configuration types
interface WidgetConfig {
  id: string;
  title: string;
  type: 'metric' | 'panel';
  visible: boolean;
  order: number;
  size: 'small' | 'medium' | 'large';
}

interface MetricConfig extends WidgetConfig {
  type: 'metric';
  metricKey: 'activeProjects' | 'tasksCompleted' | 'tasksInProgress' | 'overdueTasks' | 'teamUtilization' | 'aiConfidenceScore' | 'custom';
  icon: string;
  customValue?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  changeLabel?: string;
}

interface PanelConfig extends WidgetConfig {
  type: 'panel';
  component: 'projects' | 'tasks' | 'sprint' | 'insights';
  columnSpan: 1 | 2;
}

type DashboardWidget = MetricConfig | PanelConfig;

// Default dashboard configuration
const defaultMetrics: MetricConfig[] = [
  { id: 'metric-1', title: 'Active Projects', type: 'metric', metricKey: 'activeProjects', icon: 'FolderKanban', visible: true, order: 1, size: 'small' },
  { id: 'metric-2', title: 'Tasks Completed', type: 'metric', metricKey: 'tasksCompleted', icon: 'ListChecks', visible: true, order: 2, size: 'small' },
  { id: 'metric-3', title: 'In Progress', type: 'metric', metricKey: 'tasksInProgress', icon: 'Clock', visible: true, order: 3, size: 'small' },
  { id: 'metric-4', title: 'Overdue', type: 'metric', metricKey: 'overdueTasks', icon: 'Calendar', visible: true, order: 4, size: 'small' },
  { id: 'metric-5', title: 'Team Utilization', type: 'metric', metricKey: 'teamUtilization', icon: 'Users', visible: true, order: 5, size: 'small' },
  { id: 'metric-6', title: 'AI Confidence', type: 'metric', metricKey: 'aiConfidenceScore', icon: 'Sparkles', visible: true, order: 6, size: 'small' },
];

const defaultPanels: PanelConfig[] = [
  { id: 'panel-1', title: 'Active Projects', type: 'panel', component: 'projects', visible: true, order: 1, size: 'large', columnSpan: 2 },
  { id: 'panel-2', title: 'Recent Tasks', type: 'panel', component: 'tasks', visible: true, order: 2, size: 'large', columnSpan: 2 },
  { id: 'panel-3', title: 'Sprint Progress', type: 'panel', component: 'sprint', visible: true, order: 3, size: 'medium', columnSpan: 1 },
  { id: 'panel-4', title: 'AI Insights', type: 'panel', component: 'insights', visible: true, order: 4, size: 'medium', columnSpan: 1 },
];

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  FolderKanban: <FolderKanban className="size-6" />,
  ListChecks: <ListChecks className="size-6" />,
  Clock: <Clock className="size-6" />,
  Calendar: <Calendar className="size-6" />,
  Users: <Users className="size-6" />,
  Sparkles: <Sparkles className="size-6" />,
};

export default function DashboardPage() {
  const { tasks, projects, teams, currentUser, aiCopilotOpen, isMounted } = useApp();
  const [isEditMode, setIsEditMode] = useState(false);
  const [metrics, setMetrics] = useState<MetricConfig[]>(defaultMetrics);
  const [panels, setPanels] = useState<PanelConfig[]>(defaultPanels);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Derived metrics from real data
  const liveMetrics = {
    activeProjects: projects.filter(p => p.status === 'active').length,
    tasksCompleted: tasks.filter(t => t.status === 'closed').length,
    tasksInProgress: tasks.filter(t => t.status === 'in-progress').length,
    overdueTasks: tasks.filter(t => t.status !== 'closed' && t.dueDate && new Date(t.dueDate) < new Date()).length,
    teamUtilization: 0, // Should be calculated from real data
    aiConfidenceScore: projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + (p.aiConfidence || 0), 0) / projects.length) : 0,
  };

  const greeting = () => {
    if (!isMounted) return 'Hello';
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleToggleMetric = useCallback((id: string) => {
    setMetrics(prev => prev.map(m => 
      m.id === id ? { ...m, visible: !m.visible } : m
    ));
  }, []);

  const handleTogglePanel = useCallback((id: string) => {
    setPanels(prev => prev.map(p => 
      p.id === id ? { ...p, visible: !p.visible } : p
    ));
  }, []);

  const handleMoveMetric = useCallback((id: string, direction: 'up' | 'down') => {
    setMetrics(prev => {
      const index = prev.findIndex(m => m.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newMetrics = [...prev];
      [newMetrics[index], newMetrics[newIndex]] = [newMetrics[newIndex], newMetrics[index]];
      return newMetrics.map((m, i) => ({ ...m, order: i + 1 }));
    });
  }, []);

  const handleMovePanel = useCallback((id: string, direction: 'up' | 'down') => {
    setPanels(prev => {
      const index = prev.findIndex(p => p.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newPanels = [...prev];
      [newPanels[index], newPanels[newIndex]] = [newPanels[newIndex], newPanels[index]];
      return newPanels.map((p, i) => ({ ...p, order: i + 1 }));
    });
  }, []);

  const handleResetDashboard = useCallback(() => {
    setMetrics(defaultMetrics);
    setPanels(defaultPanels);
  }, []);

  const getMetricValue = (metric: MetricConfig): string | number => {
    if (metric.customValue !== undefined) return metric.customValue;
    const value = liveMetrics[metric.metricKey as keyof typeof liveMetrics] || 0;
    if (metric.metricKey === 'teamUtilization' || metric.metricKey === 'aiConfidenceScore') {
      return `${value}%`;
    }

    return value;
  };


  const visibleMetrics = metrics.filter(m => m.visible).sort((a, b) => a.order - b.order);
  const visiblePanels = panels.filter(p => p.visible).sort((a, b) => a.order - b.order);

  const renderPanel = (panel: PanelConfig) => {
    switch (panel.component) {
      case 'projects':
        return <ProjectsOverview />;
      case 'tasks':
        return <RecentTasks />;
      case 'sprint':
        return <SprintProgress />;
      case 'insights':
        return <AIInsightsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title={`${greeting()}, ${currentUser.name.split(' ')[0]}`}
          subtitle="Here's what's happening with your projects today"
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
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
              <div className="flex items-center gap-2">
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="gap-2"
                >
                  <Settings2 className="size-4" />
                  {isEditMode ? 'Done Editing' : 'Customize Dashboard'}
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
                      Widget Settings
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {visibleMetrics.map((metric) => (
                <div key={metric.id} className="relative group">
                  {isEditMode && (
                    <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-6 rounded-full shadow-md"
                        onClick={() => handleMoveMetric(metric.id, 'up')}
                        disabled={metric.order === 1}
                      >
                        <ChevronUp className="size-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-6 rounded-full shadow-md"
                        onClick={() => handleMoveMetric(metric.id, 'down')}
                        disabled={metric.order === visibleMetrics.length}
                      >
                        <ChevronDown className="size-3" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="size-6 rounded-full shadow-md"
                        onClick={() => handleToggleMetric(metric.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  )}
                  <div className={cn(
                    "transition-all",
                    isEditMode && "ring-2 ring-dashed ring-muted-foreground/30 rounded-lg"
                  )}>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        variant="secondary"
                        size="icon"
                        className="size-7 rounded-full shadow-md"
                        onClick={() => handleMovePanel(panel.id, 'up')}
                        disabled={panel.order === 1}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="size-7 rounded-full shadow-md"
                        onClick={() => handleMovePanel(panel.id, 'down')}
                        disabled={panel.order === visiblePanels.length}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="size-7 rounded-full shadow-md"
                        onClick={() => handleTogglePanel(panel.id)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  )}
                  <div className={cn(
                    "transition-all h-full",
                    isEditMode && "ring-2 ring-dashed ring-muted-foreground/30 rounded-lg"
                  )}>
                    {renderPanel(panel)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <AICopilot />
      </div>

      {/* Widget Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dashboard Widgets</DialogTitle>
            <DialogDescription>
              Toggle visibility and reorder widgets on your dashboard
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Metrics Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Metrics</h4>
              <div className="space-y-2">
                {metrics.map((metric) => (
                  <div 
                    key={metric.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="size-4 text-muted-foreground cursor-move" />
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {iconMap[metric.icon]}
                      </div>
                      <span className="font-medium text-sm">{metric.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleMoveMetric(metric.id, 'up')}
                        disabled={metrics.findIndex(m => m.id === metric.id) === 0}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleMoveMetric(metric.id, 'down')}
                        disabled={metrics.findIndex(m => m.id === metric.id) === metrics.length - 1}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Switch
                        checked={metric.visible}
                        onCheckedChange={() => handleToggleMetric(metric.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panels Section */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Panels</h4>
              <div className="space-y-2">
                {panels.map((panel) => (
                  <div 
                    key={panel.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="size-4 text-muted-foreground cursor-move" />
                      <span className="font-medium text-sm">{panel.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {panel.columnSpan === 2 ? 'Wide' : 'Normal'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleMovePanel(panel.id, 'up')}
                        disabled={panels.findIndex(p => p.id === panel.id) === 0}
                      >
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleMovePanel(panel.id, 'down')}
                        disabled={panels.findIndex(p => p.id === panel.id) === panels.length - 1}
                      >
                        <ChevronDown className="size-4" />
                      </Button>
                      <Switch
                        checked={panel.visible}
                        onCheckedChange={() => handleTogglePanel(panel.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleResetDashboard}>
              <RotateCcw className="size-4 mr-2" />
              Reset to Default
            </Button>
            <Button onClick={() => setShowSettingsModal(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
