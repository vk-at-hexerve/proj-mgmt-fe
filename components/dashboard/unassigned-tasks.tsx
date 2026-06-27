'use client';

import React, { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Bug, BookOpen, Zap, ListTodo, UserX } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import type { Task, TaskPriority } from '@/lib/types';
import { cn } from '@/lib/utils';
import { TaskWatchButton } from '@/components/tasks/task-watch-button';
import type { TaskFilters, TaskSort, CustomFilter } from '@/lib/types';
import { applyTaskFilters } from "@/lib/filter-utils";
import { TaskFilterPanel } from "@/components/filters/task-filter-panel";

const priorityStyles: Record<TaskPriority, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-warning text-warning-foreground',
  medium: 'bg-accent text-accent-foreground',
  low: 'bg-muted text-muted-foreground',
};

const typeIcons: Record<Task['type'], React.ReactNode> = {
  epic: <Zap className="size-4" />,
  story: <BookOpen className="size-4" />,
  task: <ListTodo className="size-4" />,
  subtask: <ListTodo className="size-3" />,
  bug: <Bug className="size-4" />,
};

export function UnassignedTasks() {
  const { tasks, isTaskDone, workflowStatuses, customFilters } = useApp();
  
  const [widgetFilters, setWidgetFilters] = useState<TaskFilters>({});
  const [widgetSort, setWidgetSort] = useState<TaskSort>({ field: 'createdAt', direction: 'desc' });
  const [activeCustomFilterId, setActiveCustomFilterId] = useState<string | null>(null);

  // Filter for unassigned tasks and exclude completed ones
  const unassignedTasks = useMemo(() => {
    const filteredTasks = applyTaskFilters(tasks, widgetFilters, widgetSort, workflowStatuses);
    return filteredTasks
      .filter(t => !t.assignee && !isTaskDone(t))
      .sort((a, b) => {
        // Sort by priority (critical > high > medium > low)
        const pOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        const pDiff = (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
        if (pDiff !== 0) return pDiff;
        // Then by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 10); // Show up to 10 unassigned tasks
  }, [tasks, widgetFilters, widgetSort, workflowStatuses, isTaskDone]);

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
    <Card className="h-full">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-warning/10 text-warning-foreground">
              <UserX className="size-4" />
            </div>
            <CardTitle className="text-base">Unassigned Tasks</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {unassignedTasks.length}
            </Badge>
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
            <Button variant="ghost" size="sm" className="text-primary h-8 px-2 text-xs">
              View all
              <ArrowRight className="size-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto px-6 py-2 space-y-1 custom-scrollbar">
        {unassignedTasks.length > 0 ? (
          unassignedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <Checkbox
                checked={isTaskDone(task)}
                className="shrink-0"
              />
              
              <div className={cn(
                'shrink-0',
                task.type === 'bug' && 'text-destructive',
                task.type === 'epic' && 'text-primary',
                task.type === 'story' && 'text-accent',
              )}>
                {typeIcons[task.type]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {task.key}
                  </span>
                  <span
                    className={cn(
                      'font-medium text-sm truncate',
                      isTaskDone(task) && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {(() => {
                    const status = workflowStatuses.find(s => s.id === task.statusId);
                    const color = status?.color || '#6B7280';
                    return (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 border-none"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {status?.name || 'Unknown'}
                      </Badge>
                    );
                  })()}
                  {task.storyPoints && (
                    <span className="text-xs text-muted-foreground">
                      {task.storyPoints} pts
                    </span>
                  )}
                </div>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                 <TaskWatchButton taskId={task.id} size="xs" />
              </div>

              <Badge
                className={cn('text-xs shrink-0', priorityStyles[task.priority])}
              >
                {task.priority}
              </Badge>

              <div className="size-6 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0 flex items-center justify-center bg-muted/20">
                <UserX className="size-3 text-muted-foreground opacity-50" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <UserX className="size-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No unassigned tasks</p>
            <p className="text-xs mt-1">Every active task has an owner!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
