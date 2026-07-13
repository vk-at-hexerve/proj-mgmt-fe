'use client';

import React, { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ArrowRight, ArrowDown, ArrowUp, Users } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import type { UserTaskMetric, User, TaskFilters, TaskSort, CustomFilter } from '@/lib/types';
import { cn } from '@/lib/utils';
import { applyTaskFilters } from "@/lib/filter-utils";
import { TaskFilterPanel } from "@/components/filters/task-filter-panel";

export function EmployeeTaskMetrics() {
  const { users, tasks, isTaskDone, getStatusGroup, workflowStatuses, customFilters } = useApp();

  // Widget-specific filter state
  const [widgetFilters, setWidgetFilters] = useState<TaskFilters>({});
  const [widgetSort, setWidgetSort] = useState<TaskSort>({ field: 'title', direction: 'asc' });
  const [activeCustomFilterId, setActiveCustomFilterId] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<UserTaskMetric[]>([]);
  const [sortField, setSortField] = useState<'total' | 'active' | 'overdue'>('active');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Compute metrics synchronously when tasks or filters change
  useEffect(() => {
    // 1. Apply advanced filters to get the relevant pool of tasks
    const filteredTasks = applyTaskFilters(tasks, widgetFilters, widgetSort, workflowStatuses);

    const today = new Date();

    // 2. Compute metrics for each user based on the filtered tasks
    const computedMetrics = users.map(user => {
      const userTasks = filteredTasks.filter(t => t.assignee?.id === user.id);
      const completedTasks = userTasks.filter(t => isTaskDone(t));
      const activeTasks = userTasks.filter(t => !isTaskDone(t));
      const overdueTasks = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < today);

      return {
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        total_tasks: userTasks.length,
        completed_tasks: completedTasks.length,
        active_tasks: activeTasks.length,
        overdue_tasks: overdueTasks.length
      };
    });

    // 3. Add unassigned bucket if there are unassigned filtered tasks
    const unassignedTasks = filteredTasks.filter(t => !t.assignee);
    if (unassignedTasks.length > 0) {
      const completedTasks = unassignedTasks.filter(t => isTaskDone(t));
      const activeTasks = unassignedTasks.filter(t => !isTaskDone(t));
      const overdueTasks = activeTasks.filter(t => t.dueDate && new Date(t.dueDate) < today);

      computedMetrics.push({
        user_id: 'unassigned',
        user_name: 'Unassigned',
        user_email: '',
        total_tasks: unassignedTasks.length,
        completed_tasks: completedTasks.length,
        active_tasks: activeTasks.length,
        overdue_tasks: overdueTasks.length
      });
    }

    // Set all computed metrics so every team member is visible, even those with 0 tasks,
    // which helps managers see who has available capacity.
    setMetrics(computedMetrics);
  }, [tasks, users, isTaskDone, getStatusGroup, widgetFilters, widgetSort, workflowStatuses]);

  // Handle local widget sorting
  const sortedMetrics = [...metrics].sort((a, b) => {
    let aValue = 0;
    let bValue = 0;

    switch (sortField) {
      case 'total':
        aValue = a.total_tasks;
        bValue = b.total_tasks;
        break;
      case 'active':
        aValue = a.active_tasks;
        bValue = b.active_tasks;
        break;
      case 'overdue':
        aValue = a.overdue_tasks;
        bValue = b.overdue_tasks;
        break;
    }

    // Always put Unassigned at the bottom regardless of sort
    if (a.user_id === 'unassigned') return 1;
    if (b.user_id === 'unassigned') return -1;

    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (field: 'total' | 'active' | 'overdue') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending when changing fields
    }
  };

  const handleApplyCustomFilter = (filter: CustomFilter | null) => {
    if (filter) {
      setWidgetFilters(filter.filters);
      setWidgetSort(filter.sort);
      setActiveCustomFilterId(filter.id);
    } else {
      setWidgetFilters({});
      setWidgetSort({ field: 'title', direction: 'asc' });
      setActiveCustomFilterId(null);
    }
  };

  const SortIcon = ({ field }: { field: 'total' | 'active' | 'overdue' }) => {
    if (sortField !== field) return <span className="opacity-0 w-3 inline-block" />;
    return sortDirection === 'asc' ? <ArrowUp className="size-3 inline" /> : <ArrowDown className="size-3 inline" />;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </div>
            <CardTitle className="text-base">Team Workload</CardTitle>
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
            <Button variant="ghost" size="sm" className="text-primary h-8 text-xs px-2">
              View Details
              <ArrowRight className="size-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-6 py-2 border-y border-border bg-muted/20 text-xs font-medium text-muted-foreground sticky top-0 z-10">
          <div className="col-span-5 sm:col-span-4">Team Member</div>
          <div className="col-span-3 sm:col-span-2 text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('total')}>
            Total <SortIcon field="total" />
          </div>
          <div className="hidden sm:block col-span-2 text-center text-success">
            Done
          </div>
          <div className="col-span-2 sm:col-span-2 text-center text-primary cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('active')}>
            Active <SortIcon field="active" />
          </div>
          <div className="col-span-2 sm:col-span-2 text-center text-destructive cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('overdue')}>
            Overdue <SortIcon field="overdue" />
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1 custom-scrollbar">
          {sortedMetrics.length > 0 ? (
            sortedMetrics.map(metric => (
              <div
                key={metric.user_id}
                className={cn(
                  "grid grid-cols-12 gap-2 py-2 px-2 items-center rounded-md transition-colors",
                  metric.total_tasks === 0
                    ? "bg-destructive/5 hover:bg-destructive/10 border border-destructive/10"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="col-span-5 sm:col-span-4 flex items-center gap-3 overflow-hidden">
                  {metric.user_id === 'unassigned' ? (
                    <div className="size-8 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0 flex items-center justify-center bg-muted/20">
                      <Users className="size-3 text-muted-foreground" />
                    </div>
                  ) : (
                    <UserAvatar
                      user={{ id: metric.user_id, name: metric.user_name, email: metric.user_email } as User}
                      size="sm"
                    />
                  )}
                  <div className="min-w-0 flex items-center gap-2">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      metric.user_id === 'unassigned' && 'text-muted-foreground italic',
                      metric.total_tasks === 0 && 'text-destructive'
                    )}>
                      {metric.user_name}
                    </p>
                    {metric.total_tasks === 0 && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1 bg-destructive/10 text-destructive border-destructive/20 uppercase tracking-wider hidden sm:inline-flex">
                        Idle
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="col-span-3 sm:col-span-2 text-center">
                  <span className={cn("text-sm font-medium", metric.total_tasks === 0 && "text-destructive font-bold")}>
                    {metric.total_tasks}
                  </span>
                </div>

                <div className="hidden sm:block col-span-2 text-center">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 w-8 justify-center">
                    {metric.completed_tasks}
                  </Badge>
                </div>

                <div className="col-span-2 sm:col-span-2 text-center">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 w-8 justify-center">
                    {metric.active_tasks}
                  </Badge>
                </div>

                <div className="col-span-2 sm:col-span-2 text-center">
                  {metric.overdue_tasks > 0 ? (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 w-8 justify-center">
                      {metric.overdue_tasks}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="size-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No team data available</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
