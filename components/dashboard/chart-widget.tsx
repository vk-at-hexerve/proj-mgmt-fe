'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from '@/components/ui/chart';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { TaskFilters, TaskSort, CustomFilter } from '@/lib/types';
import { applyTaskFilters } from "@/lib/filter-utils";
import { TaskFilterPanel } from "@/components/filters/task-filter-panel";

// Predefined harmonious color palette for charts
const CHART_COLORS = [
  'hsl(221, 83%, 53%)', // primary (blue)
  'hsl(142, 71%, 45%)', // success (green)
  'hsl(38, 92%, 50%)',  // warning (orange/yellow)
  'hsl(0, 84%, 60%)',   // destructive (red)
  'hsl(262, 83%, 58%)', // purple
  'hsl(199, 89%, 48%)', // cyan
  'hsl(330, 81%, 60%)', // pink
  'hsl(172, 66%, 50%)', // teal
];

export type ChartFilters = TaskFilters;

export interface ChartWidgetConfig {
  id: string;
  title: string;
  chartType: 'pie' | 'bar';
  dataSource: 'tasks-per-user' | 'tasks-per-project' | 'tasks-by-status' | 'tasks-by-priority' | 'projects-by-status' | 'user-workload';
  filters: ChartFilters;
}

interface ChartWidgetProps {
  config: ChartWidgetConfig;
  onUpdateFilters?: (id: string, newFilters: ChartFilters) => void;
}

export function ChartWidget({ config, onUpdateFilters }: ChartWidgetProps) {
  const { projects, tasks, users, isTaskDone, getStatusGroup, workflowStatuses, customFilters } = useApp();
  
  const [widgetFilters, setWidgetFilters] = useState<TaskFilters>(config.filters || {});
  const [widgetSort, setWidgetSort] = useState<TaskSort>({ field: 'createdAt', direction: 'desc' });
  const [activeCustomFilterId, setActiveCustomFilterId] = useState<string | null>(null);

  const handleApplyCustomFilter = (filter: CustomFilter | null) => {
    if (filter) {
      setWidgetFilters(filter.filters);
      setWidgetSort(filter.sort);
      setActiveCustomFilterId(filter.id);
    } else {
      setWidgetFilters({});
      setWidgetSort({ field: 'createdAt', direction: 'desc' });
      setActiveCustomFilterId(null);
    }
    
    if (onUpdateFilters) {
      onUpdateFilters(config.id, filter ? filter.filters : {});
    }
  };

  const data = useMemo(() => {
    let chartData: any[] = [];
    const today = new Date();
    
    // First, apply global task filters
    const filteredTasks = applyTaskFilters(tasks, widgetFilters, widgetSort, workflowStatuses);

    switch (config.dataSource) {
      case 'tasks-per-user': {
        const userStats: Record<string, { total: number; active: number; completed: number; name: string }> = {};
        
        filteredTasks.forEach(t => {
          const assigneeId = t.assignee?.id || 'unassigned';
          const assigneeName = t.assignee?.name || 'Unassigned';
          
          if (!userStats[assigneeId]) {
            userStats[assigneeId] = { total: 0, active: 0, completed: 0, name: assigneeName };
          }
          
          userStats[assigneeId].total++;
          if (isTaskDone(t)) {
            userStats[assigneeId].completed++;
          } else {
            userStats[assigneeId].active++;
          }
        });
        
        chartData = Object.values(userStats).map(d => ({
          name: d.name,
          value: d.total // Total is default for tasks-per-user unless specialized filters say otherwise
        })).filter(d => d.value > 0);
        break;
      }
      
      case 'user-workload': {
        const userStats: Record<string, { active: number; name: string }> = {};
        
        filteredTasks.forEach(t => {
          if (isTaskDone(t)) return; // Only count active
          
          const assigneeId = t.assignee?.id || 'unassigned';
          const assigneeName = t.assignee?.name || 'Unassigned';
          
          if (!userStats[assigneeId]) {
            userStats[assigneeId] = { active: 0, name: assigneeName };
          }
          
          userStats[assigneeId].active++;
        });
        
        chartData = Object.values(userStats).map(d => ({
          name: d.name,
          value: d.active
        })).filter(d => d.value > 0);
        break;
      }
        
      case 'tasks-per-project': {
        const projectStats: Record<string, { total: number; active: number; completed: number; overdue: number; name: string }> = {};
        
        // Initialize all projects
        projects.forEach(p => {
          projectStats[p.id] = { total: 0, active: 0, completed: 0, overdue: 0, name: p.name };
        });
        
        filteredTasks.forEach(t => {
          if (!projectStats[t.projectId]) return;
          
          projectStats[t.projectId].total++;
          if (isTaskDone(t)) {
            projectStats[t.projectId].completed++;
          } else {
            projectStats[t.projectId].active++;
            if (t.dueDate && new Date(t.dueDate) < today) {
              projectStats[t.projectId].overdue++;
            }
          }
        });
        
        chartData = Object.values(projectStats).map(d => ({
          name: d.name,
          completed: d.completed,
          active: d.active,
          overdue: d.overdue,
          value: d.total
        })).filter(d => d.value > 0 || d.completed > 0 || d.active > 0 || d.overdue > 0);
        break;
      }
        
      case 'tasks-by-status': {
        const groupCounts: Record<string, number> = {
          'OPEN': 0, 'IN_PROGRESS': 0, 'ON_HOLD': 0, 'CLOSED': 0
        };
        
        filteredTasks.forEach(t => {
          const group = getStatusGroup(t.statusId) || 'OPEN';
          groupCounts[group]++;
        });
        
        chartData = [
          { name: 'Open', value: groupCounts['OPEN'], fill: 'hsl(var(--muted-foreground))' },
          { name: 'In Progress', value: groupCounts['IN_PROGRESS'], fill: 'hsl(var(--primary))' },
          { name: 'On Hold', value: groupCounts['ON_HOLD'], fill: 'hsl(var(--warning))' },
          { name: 'Completed', value: groupCounts['CLOSED'], fill: 'hsl(var(--success))' }
        ].filter(d => d.value > 0);
        break;
      }
        
      case 'tasks-by-priority': {
        const counts: Record<string, number> = {
          critical: 0, high: 0, medium: 0, low: 0, unassigned: 0
        };
        
        filteredTasks.forEach(t => {
          counts[t.priority || 'unassigned']++;
        });
        
        chartData = [
          { name: 'Critical', value: counts.critical, fill: 'hsl(var(--destructive))' },
          { name: 'High', value: counts.high, fill: 'hsl(var(--warning))' },
          { name: 'Medium', value: counts.medium, fill: 'hsl(var(--accent))' },
          { name: 'Low', value: counts.low, fill: 'hsl(var(--muted-foreground))' }
        ].filter(d => d.value > 0);
        break;
      }
        
      case 'projects-by-status': {
        const counts: Record<string, number> = {
          planning: 0, active: 0, 'on-hold': 0, completed: 0, cancelled: 0
        };
        
        projects.forEach(p => counts[p.status]++);
        
        chartData = [
          { name: 'Planning', value: counts.planning },
          { name: 'Active', value: counts.active },
          { name: 'On Hold', value: counts['on-hold'] },
          { name: 'Completed', value: counts.completed }
        ].filter(d => d.value > 0);
        break;
      }
    }

    return chartData;
  }, [config.dataSource, widgetFilters, widgetSort, projects, tasks, isTaskDone, getStatusGroup, workflowStatuses]);

  // Generate chart config for shadcn ChartContainer
  const chartConfig = useMemo(() => {
    const cfg: Record<string, any> = {};
    
    if (config.chartType === 'pie' || config.dataSource === 'tasks-per-user' || config.dataSource === 'user-workload') {
      // Basic configuration assigning colors to names
      data.forEach((item, index) => {
        cfg[item.name] = {
          label: item.name,
          color: item.fill || CHART_COLORS[index % CHART_COLORS.length]
        };
      });
    } else if (config.dataSource === 'tasks-per-project') {
      cfg['completed'] = { label: 'Completed', color: 'hsl(var(--success))' };
      cfg['active'] = { label: 'Active', color: 'hsl(var(--primary))' };
      cfg['overdue'] = { label: 'Overdue', color: 'hsl(var(--destructive))' };
    }
    
    // Default value key
    cfg['value'] = { label: 'Tasks' };
    
    return cfg;
  }, [data, config]);

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex h-[250px] items-center justify-center text-muted-foreground flex-col">
          {config.chartType === 'pie' ? <PieChartIcon className="size-10 mb-2 opacity-20" /> : <BarChart3 className="size-10 mb-2 opacity-20" />}
          <p className="text-sm">No data available for these filters</p>
        </div>
      );
    }

    if (config.chartType === 'pie') {
      return (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={config.dataSource === 'tasks-by-status' ? 60 : 0}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent />} className="flex-wrap gap-2 text-xs" />
          </PieChart>
        </ChartContainer>
      );
    } else {
      // Bar chart
      const isStacked = config.dataSource === 'tasks-per-project';
      const isHorizontal = config.dataSource === 'tasks-per-user' || config.dataSource === 'user-workload';

      return (
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={data} layout={isHorizontal ? "vertical" : "horizontal"} margin={{ left: isHorizontal ? 40 : 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            
            {isHorizontal ? (
              <>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={80} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis hide />
              </>
            )}
            
            <ChartTooltip content={<ChartTooltipContent />} />
            
            {isStacked ? (
              <>
                <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="active" stackId="a" fill="var(--color-active)" />
                <Bar dataKey="overdue" stackId="a" fill="var(--color-overdue)" radius={[4, 4, 0, 0]} />
                <ChartLegend content={<ChartLegendContent />} />
              </>
            ) : (
              <Bar 
                dataKey="value" 
                fill="hsl(var(--primary))" 
                radius={4} 
                barSize={isHorizontal ? 20 : 40}
              >
                {
                  // Color bars differently if it's not a single metric (like workload)
                  config.dataSource !== 'user-workload' && data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                  ))
                }
              </Bar>
            )}
          </BarChart>
        </ChartContainer>
      );
    }
  };

  return (
    <Card className="h-full flex flex-col relative overflow-visible">
      <CardHeader className="pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{config.title}</CardTitle>
          
          <TaskFilterPanel
            filters={widgetFilters}
            setFilters={setWidgetFilters}
            sort={widgetSort}
            setSort={setWidgetSort}
            customFilters={customFilters}
            activeCustomFilterId={activeCustomFilterId}
            onApplyCustomFilter={handleApplyCustomFilter}
          />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 pt-0 flex flex-col justify-center">
        {renderChart()}
      </CardContent>
    </Card>
  );
}
