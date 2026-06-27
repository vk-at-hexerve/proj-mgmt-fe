'use client';

import React, { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Calendar as CalendarIcon, ArrowRight, ListTodo } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { fetchTasksByDueDate } from '@/lib/api';
import type { DueDateTaskItem, User, TaskPriority, TaskFilters, TaskSort, CustomFilter } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from "date-fns";
import Link from "next/link";
import { applyTaskFilters } from "@/lib/filter-utils";
import { TaskFilterPanel } from "@/components/filters/task-filter-panel";

const priorityStyles: Record<TaskPriority, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-warning text-warning-foreground',
  medium: 'bg-accent text-accent-foreground',
  low: 'bg-muted text-muted-foreground',
};

export function DueDateTaskWidget() {
  const { tasks, users, projects, workflowStatuses, isTaskDone, isTaskOverdue, customFilters } = useApp();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const [widgetFilters, setWidgetFilters] = useState<TaskFilters>({});
  const [widgetSort, setWidgetSort] = useState<TaskSort>({ field: 'createdAt', direction: 'desc' });
  const [activeCustomFilterId, setActiveCustomFilterId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return applyTaskFilters(tasks, widgetFilters, widgetSort, workflowStatuses);
  }, [tasks, widgetFilters, widgetSort, workflowStatuses]);

  // Compute dates with tasks for calendar dot indicators
  const datesWithTasks = useMemo(() => {
    const dates = new Set<string>();
    filteredTasks.forEach(t => {
      if (t.dueDate && !isTaskDone(t)) {
        // Keep just YYYY-MM-DD
        dates.add(t.dueDate.split('T')[0]);
      }
    });
    return dates;
  }, [tasks, isTaskDone]);

  const dueTasks = useMemo(() => {
    if (!date) return [];
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    const matchedTasks = filteredTasks.filter(t => {
      if (!t.dueDate) return false;
      return t.dueDate.split('T')[0] === dateString;
    });
    
    return matchedTasks.map(t => {
      const project = projects.find(p => p.id === t.projectId);
      const assignee = users.find(u => u.id === t.assignee?.id);
      const status = workflowStatuses.find(s => s.id === t.statusId);
      
      return {
        task_id: t.id,
        task_code: t.key || t.id.substring(0, 8),
        title: t.title,
        assignee_name: assignee?.name || null,
        assignee_id: assignee?.id || null,
        project_name: project?.name || 'Unknown Project',
        project_id: t.projectId,
        priority: t.priority,
        status_group: status?.groupKey || null,
        status_name: status?.name || 'Unknown',
        due_date: t.dueDate || null,
      };
    });
  }, [date, filteredTasks, users, projects, workflowStatuses]);

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

  // Modifiers for calendar to show dots on days with tasks
  const modifiers = {
    hasTask: (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return datesWithTasks.has(`${year}-${month}-${day}`);
    }
  };

  const modifiersStyles = {
    hasTask: { 
      fontWeight: 'bold',
      textDecoration: 'underline',
      textDecorationColor: 'var(--color-primary)',
      textUnderlineOffset: '4px',
      textDecorationThickness: '2px'
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-warning/10 text-warning-foreground">
              <CalendarIcon className="size-4" />
            </div>
            <CardTitle className="text-base">Due Date Tasks</CardTitle>
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
            {date && (
              <Badge variant="secondary" className="font-normal text-xs">
                {format(date, 'MMM d, yyyy')}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col p-0">
        <div className="border-b border-border p-2 flex justify-center bg-muted/10">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
          {!date ? (
            <div className="py-8 text-center text-muted-foreground">
              <CalendarIcon className="size-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">Select a date</p>
              <p className="text-xs">to see tasks due on that day</p>
            </div>
          ) : dueTasks.length > 0 ? (
            dueTasks.map(task => {
              const fullTask = tasks.find(t => t.id === task.task_id);
              const isOverdue = fullTask ? isTaskOverdue(fullTask) : false;
              return (
                <div 
                  key={task.task_id} 
                  className={cn(
                    "p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors flex items-start gap-3",
                    isOverdue && "border-destructive bg-destructive/5 dark:bg-destructive/10 hover:bg-destructive/10 dark:hover:bg-destructive/20"
                  )}
                >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{task.task_code}</span>
                    <Link href={`/projects/${task.project_id}/tasks/${task.task_id}`} className="font-medium text-sm truncate hover:underline">
                      {task.title}
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {task.project_name}
                    </Badge>
                    
                    {task.status_name && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                        {task.status_name}
                      </Badge>
                    )}
                    
                    {task.priority && (
                      <Badge className={cn('text-[10px] px-1.5 py-0 font-normal shrink-0', priorityStyles[task.priority as TaskPriority])}>
                        {task.priority}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="shrink-0 pt-1">
                  {task.assignee_id ? (
                    <UserAvatar 
                      user={{ id: task.assignee_id, name: task.assignee_name || 'User', email: '' } as User} 
                      size="sm" 
                    />
                  ) : (
                    <div className="size-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20" title="Unassigned">
                      <span className="text-[10px] text-muted-foreground">?</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <ListTodo className="size-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No tasks due</p>
              <p className="text-xs">No tasks are scheduled for this date</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
