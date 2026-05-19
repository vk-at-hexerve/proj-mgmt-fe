'use client';

import { useMemo, useState, useRef } from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import { GROUP_PROGRESS_MAP } from '@/lib/status-utils';
import type { GanttTask } from '@/lib/mock-data';

interface GanttChartProps {
  projectId?: string;
}

const CELL_WIDTH = 40;
const ROW_HEIGHT = 44;

export function GanttChart({ projectId }: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);

  const { tasks: allAppTasks, projects: allProjects, isTaskDone, getStatusGroup } = useApp();

  const tasks = useMemo(() => {
    const ganttTasks: GanttTask[] = [];
    
    const relevantProjects = projectId ? allProjects.filter(p => p.id === projectId) : allProjects;
    
    // Add projects
    relevantProjects.forEach((project) => {
      ganttTasks.push({
        id: project.id,
        name: project.name,
        start: new Date(project.startDate || new Date().toISOString()),
        end: project.endDate ? new Date(project.endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1)), // fallback 1 month
        progress: project.progress || 0,
        type: 'project',
      });
    });

    const relevantTasks = projectId ? allAppTasks.filter(t => t.projectId === projectId) : allAppTasks;
    
    // Add tasks
    relevantTasks.forEach((task) => {
      const createdDate = new Date(task.startDate || task.createdAt || new Date().toISOString());
      // Make sure start date isn't invalid
      const safeStartDate = isNaN(createdDate.getTime()) ? new Date() : createdDate;
      
      let safeDueDate: Date;
      if (task.dueDate) {
        safeDueDate = new Date(task.dueDate);
        if (isNaN(safeDueDate.getTime())) {
          safeDueDate = new Date(safeStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
      } else {
        safeDueDate = new Date(safeStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      // Ensure end date is after start date
      if (safeDueDate < safeStartDate) {
        safeDueDate = new Date(safeStartDate.getTime() + 24 * 60 * 60 * 1000);
      }

      const group = getStatusGroup(task.statusId);
      const progress = group ? GROUP_PROGRESS_MAP[group] : 0;

      ganttTasks.push({
        id: task.id,
        name: `${task.key}: ${task.title}`,
        start: safeStartDate,
        end: safeDueDate,
        progress,
        type: task.type === 'epic' ? 'project' : 'task',
        assignee: task.assignee,
        projectId: task.projectId,
      });
    });

    return ganttTasks;
  }, [allAppTasks, allProjects, projectId]);

  // Calculate date range
  const { startDate, endDate, totalDays, weeks } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date('2026-01-01');
      const end = new Date('2026-03-31');
      return {
        startDate: today,
        endDate: end,
        totalDays: 90,
        weeks: [] as { start: Date; days: Date[] }[],
      };
    }

    let minDate = tasks[0].start;
    let maxDate = tasks[0].end;

    tasks.forEach(task => {
      if (task.start < minDate) minDate = task.start;
      if (task.end > maxDate) maxDate = task.end;
    });

    // Add some padding
    const start = new Date(minDate);
    start.setDate(start.getDate() - 7);
    const end = new Date(maxDate);
    end.setDate(end.getDate() + 14);

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Generate weeks
    const weeksList: { start: Date; days: Date[] }[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const weekStart = new Date(currentDate);
      const weekDays: Date[] = [];
      
      for (let i = 0; i < 7 && currentDate <= end; i++) {
        weekDays.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeksList.push({ start: weekStart, days: weekDays });
    }

    return { startDate: start, endDate: end, totalDays: days, weeks: weeksList };
  }, [tasks]);

  const getTaskPosition = (task: GanttTask) => {
    const startDiff = Math.ceil((task.start.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, Math.ceil((task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      left: startDiff * CELL_WIDTH * zoom,
      width: duration * CELL_WIDTH * zoom,
    };
  };

  const getProgressColor = (progress: number, type: GanttTask['type']) => {
    if (type === 'milestone') return 'bg-accent';
    if (progress === 100) return 'bg-success';
    if (progress >= 50) return 'bg-primary';
    if (progress > 0) return 'bg-warning';
    return 'bg-slate-400';
  };

  const isToday = (date: Date) => {
    const today = new Date('2026-01-20');
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const scroll = (direction: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += direction * 200;
      setScrollOffset(scrollRef.current.scrollLeft);
    }
  };

  const todayOffset = useMemo(() => {
    const today = new Date('2026-01-20');
    const diff = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff * CELL_WIDTH * zoom;
  }, [startDate, zoom]);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => scroll(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => scroll(1)}>
              <ChevronRight className="size-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollLeft = todayOffset - scrollRef.current.clientWidth / 2;
                }
              }}
            >
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(z => Math.min(2, z + 0.25))}
              disabled={zoom >= 2}
            >
              <ZoomIn className="size-4" />
            </Button>
          </div>
        </div>

        {/* Chart */}
        <div className="flex-1 flex overflow-hidden">
          {/* Task List (Fixed) */}
          <div className="w-64 shrink-0 border-r border-border bg-card">
            {/* Header */}
            <div className="h-14 border-b border-border flex items-center px-4 bg-muted/30">
              <span className="text-sm font-medium">Task</span>
            </div>
            {/* Task rows */}
            <div className="overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 border-b border-border hover:bg-muted/30"
                  style={{ height: ROW_HEIGHT }}
                >
                  {task.assignee && (
                    <UserAvatar user={task.assignee} size="sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm truncate',
                      task.type === 'project' && 'font-semibold'
                    )}>
                      {task.name}
                    </p>
                  </div>
                  {task.type === 'milestone' && (
                    <Badge variant="outline" className="text-xs">M</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline (Scrollable) */}
          <div className="flex-1 overflow-hidden">
            <div
              ref={scrollRef}
              className="h-full overflow-x-auto overflow-y-auto"
              onScroll={(e) => setScrollOffset(e.currentTarget.scrollLeft)}
            >
              <div style={{ width: totalDays * CELL_WIDTH * zoom, minWidth: '100%' }}>
                {/* Timeline Header */}
                <div className="h-14 border-b border-border sticky top-0 bg-card z-10">
                  {/* Weeks row */}
                  <div className="flex h-7 border-b border-border">
                    {weeks.map((week, i) => (
                      <div
                        key={i}
                        className="border-r border-border flex items-center justify-center text-xs font-medium bg-muted/30"
                        style={{ width: week.days.length * CELL_WIDTH * zoom }}
                      >
                        {week.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    ))}
                  </div>
                  {/* Days row */}
                  <div className="flex h-7">
                    {weeks.flatMap((week) =>
                      week.days.map((day, i) => (
                        <div
                          key={`${week.start.toISOString()}-${i}`}
                          className={cn(
                            'border-r border-border flex items-center justify-center text-xs',
                            isToday(day) && 'bg-primary/20 text-primary font-semibold',
                            day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted/50 text-muted-foreground' : ''
                          )}
                          style={{ width: CELL_WIDTH * zoom }}
                        >
                          {zoom >= 0.75 ? day.getDate() : (day.getDate() % 5 === 0 ? day.getDate() : '')}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Task Bars */}
                <div className="relative">
                  {/* Today marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
                    style={{ left: todayOffset }}
                  >
                    <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-primary" />
                  </div>

                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {weeks.flatMap((week) =>
                      week.days.map((day, i) => (
                        <div
                          key={`grid-${week.start.toISOString()}-${i}`}
                          className={cn(
                            'border-r border-border',
                            day.getDay() === 0 || day.getDay() === 6 ? 'bg-muted/30' : ''
                          )}
                          style={{ width: CELL_WIDTH * zoom }}
                        />
                      ))
                    )}
                  </div>

                  {/* Task bars */}
                  {tasks.map((task, index) => {
                    const { left, width } = getTaskPosition(task);
                    
                    return (
                      <div
                        key={task.id}
                        className="relative border-b border-border"
                        style={{ height: ROW_HEIGHT }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute top-2 rounded-md cursor-pointer transition-all hover:opacity-80',
                                task.type === 'project' ? 'h-6' : 'h-5',
                                task.type === 'milestone' ? 'w-4 h-4 rotate-45 top-3' : '',
                                getProgressColor(task.progress, task.type)
                              )}
                              style={{
                                left,
                                width: task.type === 'milestone' ? 16 : width,
                              }}
                            >
                              {task.type !== 'milestone' && (
                                <>
                                  {/* Progress fill */}
                                  <div
                                    className={cn(
                                      'absolute inset-y-0 left-0 rounded-md',
                                      task.progress === 100 ? 'bg-success' : 'bg-primary'
                                    )}
                                    style={{ width: `${task.progress}%` }}
                                  />
                                  {/* Label */}
                                  {width > 80 && zoom >= 0.75 && (
                                    <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white truncate">
                                      {task.progress}%
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{task.name}</p>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <p>Start: {task.start.toLocaleDateString()}</p>
                                <p>End: {task.end.toLocaleDateString()}</p>
                                <p>Progress: {task.progress}%</p>
                                {task.assignee && <p>Assignee: {task.assignee.name}</p>}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 p-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">In Progress</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-3 rounded bg-success" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-3 rounded bg-warning" />
            <span className="text-muted-foreground">Started</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-3 rounded bg-slate-400" />
            <span className="text-muted-foreground">Not Started</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rotate-45 bg-accent" />
            <span className="text-muted-foreground">Milestone</span>
          </div>
          <div className="flex items-center gap-2 text-sm ml-auto">
            <div className="w-0.5 h-4 bg-primary" />
            <span className="text-muted-foreground">Today</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
