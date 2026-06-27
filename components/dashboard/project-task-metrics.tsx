'use client';

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, FolderKanban } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import type { ProjectTaskMetric, TaskFilters, TaskSort, CustomFilter } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { applyTaskFilters } from "@/lib/filter-utils";
import { TaskFilterPanel } from "@/components/filters/task-filter-panel";

export function ProjectTaskMetrics() {
  const { projects, tasks, isTaskDone, getStatusGroup, workflowStatuses, customFilters } = useApp();
  
  const [widgetFilters, setWidgetFilters] = useState<TaskFilters>({});
  const [widgetSort, setWidgetSort] = useState<TaskSort>({ field: 'createdAt', direction: 'desc' });
  const [activeCustomFilterId, setActiveCustomFilterId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const today = new Date();
    
    // 1. Filter all tasks globally based on widget settings
    const filteredTasks = applyTaskFilters(tasks, widgetFilters, widgetSort, workflowStatuses);
    
    // 2. Aggregate per project
    const computedMetrics = projects.map(project => {
      const projectTasks = filteredTasks.filter(t => t.projectId === project.id);
      const completedTasks = projectTasks.filter(t => isTaskDone(t));
      const activeTasks = projectTasks.filter(t => !isTaskDone(t));
      const overdueTasks = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < today);
      
      const total = projectTasks.length;
      const completed = completedTasks.length;
      const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        project_id: project.id,
        project_name: project.name,
        project_key: project.key,
        total_tasks: total,
        completed_tasks: completed,
        active_tasks: activeTasks.length,
        overdue_tasks: overdueTasks.length,
        completion_percentage: completionPercentage
      };
    });
    
    // Sort by total tasks descending
    return computedMetrics.sort((a, b) => b.total_tasks - a.total_tasks);
  }, [projects, tasks, widgetFilters, widgetSort, workflowStatuses, isTaskDone]);

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
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-accent/10 text-accent">
              <FolderKanban className="size-4" />
            </div>
            <CardTitle className="text-base">Project Task Metrics</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <TaskFilterPanel
              filters={widgetFilters}
              setFilters={setWidgetFilters}
              sort={widgetSort}
              setSort={setWidgetSort}
              customFilters={customFilters}
              activeCustomFilterId={activeCustomFilterId}
              onApplyCustomFilter={handleApplyCustomFilter}
            />
            <Button variant="ghost" size="sm" className="text-accent h-8 text-xs px-2" asChild>
              <Link href="/projects">
                View All
                <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto pt-0 space-y-4">
        {metrics.length > 0 ? (
          metrics.map(metric => (
            <div 
              key={metric.project_id} 
              className="p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                    {metric.project_key}
                  </Badge>
                  <Link href={`/projects/${metric.project_id}`} className="font-medium text-sm truncate hover:underline">
                    {metric.project_name}
                  </Link>
                </div>
                <div className="text-xs font-medium shrink-0 ml-2">
                  {metric.completion_percentage}%
                </div>
              </div>
              
              <Progress value={metric.completion_percentage} className="h-1.5 mb-3 bg-muted" />
              
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-muted/30 rounded py-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                  <p className="text-sm font-semibold">{metric.total_tasks}</p>
                </div>
                <div className="bg-success/5 rounded py-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Done</p>
                  <p className="text-sm font-semibold text-success">{metric.completed_tasks}</p>
                </div>
                <div className="bg-primary/5 rounded py-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Active</p>
                  <p className="text-sm font-semibold text-primary">{metric.active_tasks}</p>
                </div>
                <div className={cn("rounded py-1", metric.overdue_tasks > 0 ? "bg-destructive/5" : "bg-muted/30")}>
                  <p className="text-xs text-muted-foreground mb-0.5">Overdue</p>
                  <p className={cn("text-sm font-semibold", metric.overdue_tasks > 0 ? "text-destructive" : "")}>
                    {metric.overdue_tasks}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <FolderKanban className="size-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No projects available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
