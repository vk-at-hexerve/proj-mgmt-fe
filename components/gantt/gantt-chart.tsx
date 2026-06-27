'use client';

import React, { useMemo, useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import { GROUP_PROGRESS_MAP } from '@/lib/status-utils';
import type { GanttTask } from '@/lib/mock-data';
import { TaskWatchButton } from '@/components/tasks/task-watch-button';

interface GanttChartProps {
  projectId?: string;
}

const CELL_WIDTH = 40;
const ROW_HEIGHT = 44; // minimum row height (px)
const DAY_MS = 24 * 60 * 60 * 1000;

type DragMode = 'resize-left' | 'resize-right' | 'move';

interface DragInfo {
  id: string;
  mode: DragMode;
  startX: number;
  origLeft: number;
  origWidth: number;
  origStartDate: Date;
  origEndDate: Date;
}

export function GanttChart({ projectId }: GanttChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const leftRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});

  // Resizable column state
  const [columnWidth, setColumnWidth] = useState<number>(256); // default 256px
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);

  const { tasks: allAppTasks, projects: allProjects, isTaskDone, isTaskOverdue, getStatusGroup, updateTask, getFilteredTasks } = useApp();

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

    const relevantTasks = projectId ? getFilteredTasks(projectId) : allAppTasks;

    // Add tasks
    relevantTasks.forEach((task) => {
      const createdDate = new Date(task.startDate || task.createdAt || new Date().toISOString());
      // Make sure start date isn't invalid
      const safeStartDate = isNaN(createdDate.getTime()) ? new Date() : createdDate;

      let safeDueDate: Date;
      if (task.dueDate) {
        safeDueDate = new Date(task.dueDate);
        if (isNaN(safeDueDate.getTime())) {
          safeDueDate = new Date(safeStartDate.getTime() + 7 * DAY_MS);
        }
      } else {
        safeDueDate = new Date(safeStartDate.getTime() + 7 * DAY_MS);
      }

      // Ensure end date is after start date
      if (safeDueDate < safeStartDate) {
        safeDueDate = new Date(safeStartDate.getTime() + DAY_MS);
      }

      const isOverdue = isTaskOverdue(task);
      const group = getStatusGroup(task.statusId);
      const progress = group ? GROUP_PROGRESS_MAP[group] : 0;

      ganttTasks.push({
        id: task.id,
        name: `${task.key}: ${task.title}`,
        start: safeStartDate,
        end: safeDueDate,
        progress,
        type: task.isMilestone ? 'milestone' : (task.type === 'epic' ? 'project' : 'task'),
        assignee: task.assignee,
        projectId: task.projectId,
        isMilestone: task.isMilestone,
        parentId: task.parentId,
        isOverdue,
      } as any);
    });

    // Hierarchical sort: roots first, then their subtasks
    const roots: any[] = [];
    const parentMap = new Map<string, any[]>();
    const taskIds = new Set(ganttTasks.map(t => t.id));
    
    ganttTasks.forEach(t => {
      // A task is a subtask if its parentId is present in the filtered results
      if (t.parentId && taskIds.has(t.parentId)) {
        if (!parentMap.has(t.parentId)) parentMap.set(t.parentId, []);
        parentMap.get(t.parentId)!.push(t);
      } else {
        roots.push(t);
      }
    });
    
    const sortedGanttTasks: any[] = [];
    roots.forEach(root => {
      sortedGanttTasks.push(root);
      if (parentMap.has(root.id)) {
        sortedGanttTasks.push(...parentMap.get(root.id)!);
      }
    });

    return sortedGanttTasks;
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
    const startDiff = Math.ceil((task.start.getTime() - startDate.getTime()) / DAY_MS);
    const duration = Math.max(1, Math.ceil((task.end.getTime() - task.start.getTime()) / DAY_MS));

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

  // Sync vertical scrolling between left list and timeline
  const onLeftScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollRef.current) scrollRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  const onTimelineScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollOffset(e.currentTarget.scrollLeft);
    if (leftScrollRef.current && leftScrollRef.current.scrollTop !== e.currentTarget.scrollTop) {
      leftScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Measure left-side row heights and apply to timeline rows so wrapping doesn't clip content
  useLayoutEffect(() => {
    const heights: Record<string, number> = {};
    tasks.forEach((task) => {
      const el = leftRowRefs.current[task.id];
      if (el) heights[task.id] = Math.max(ROW_HEIGHT, el.getBoundingClientRect().height);
    });
    setRowHeights(heights);
  }, [tasks, columnWidth]);

  // Column resize handlers (attach/remove listeners on mousedown)
  const handleResizerMouseMove = (e: MouseEvent) => {
    const dx = e.clientX - startXRef.current;
    const newWidth = Math.max(120, Math.min(800, startWidthRef.current + dx));
    setColumnWidth(newWidth);
  };

  const handleResizerMouseUp = (e: MouseEvent) => {
    isResizingRef.current = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', handleResizerMouseMove);
    document.removeEventListener('mouseup', handleResizerMouseUp);
  };

  // ─── Task bar drag & resize ────────────────────────────────────────────
  // We use refs to avoid stale closure issues in global mousemove/mouseup listeners.
  const dragRef = useRef<DragInfo | null>(null);
  const tempPosRef = useRef<Record<string, { left: number; width: number }>>({});
  const [tempPositions, setTempPositions] = useState<Record<string, { left: number; width: number }>>({});
  const [isDragging, setIsDragging] = useState(false);
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Convert pixel left/width back to dates
  const pixelToDate = useCallback((px: number) => {
    const days = Math.round(px / (CELL_WIDTH * zoomRef.current));
    return new Date(startDate.getTime() + days * DAY_MS);
  }, [startDate]);

  // Compute dynamic dates during drag for tooltip display
  const getDragDates = useCallback((taskId: string, task: GanttTask) => {
    const override = tempPosRef.current[taskId];
    let left: number;
    let width: number;

    if (!override) {
      const pos = getTaskPosition(task);
      left = pos.left;
      width = task.type === 'milestone' ? CELL_WIDTH * zoomRef.current : pos.width;
    } else {
      left = override.left;
      width = override.width;
    }

    const newStart = pixelToDate(left);
    // The bar ends at (left + width). Since 1 day = CELL_WIDTH, a 1-day bar ends at the START of the next day.
    // By subtracting DAY_MS, we get the inclusive last day it covers visually.
    const newEnd = new Date(pixelToDate(left + width).getTime() - DAY_MS);
    
    return { start: newStart, end: newEnd };
  }, [pixelToDate]);

  const handleDragMouseMove = useCallback((e: MouseEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const cellPx = CELL_WIDTH * zoomRef.current;

    let newLeft = drag.origLeft;
    let newWidth = drag.origWidth;

    switch (drag.mode) {
      case 'resize-right': {
        newWidth = Math.max(cellPx, drag.origWidth + dx);
        break;
      }
      case 'resize-left': {
        const maxShift = drag.origWidth - cellPx; // can't shrink past 1 day
        const shift = Math.min(dx, maxShift);
        newLeft = drag.origLeft + shift;
        newWidth = drag.origWidth - shift;
        break;
      }
      case 'move': {
        newLeft = drag.origLeft + dx;
        break;
      }
    }

    const newPos = { left: newLeft, width: newWidth };
    tempPosRef.current = { ...tempPosRef.current, [drag.id]: newPos };
    setTempPositions(prev => ({ ...prev, [drag.id]: newPos }));
  }, []);

  const handleDragMouseUp = useCallback(async () => {
    const drag = dragRef.current;
    if (!drag) return;

    const pos = tempPosRef.current[drag.id];
    const finalLeft = pos ? pos.left : drag.origLeft;
    const finalWidth = pos ? pos.width : drag.origWidth;
    const cellPx = CELL_WIDTH * zoomRef.current;

    const startDays = Math.round(finalLeft / cellPx);
    const durationDays = Math.max(1, Math.round(finalWidth / cellPx));

    const newStart = new Date(startDate.getTime() + startDays * DAY_MS);
    const newEnd = new Date(startDate.getTime() + (startDays + durationDays) * DAY_MS);

    // Persist update
    try {
      await updateTask(drag.id, { startDate: newStart.toISOString(), dueDate: newEnd.toISOString() });
    } catch {
      // ignore, app-context shows toast on failure
    }

    dragRef.current = null;
    delete tempPosRef.current[drag.id];
    setTempPositions(prev => {
      const copy = { ...prev };
      delete copy[drag.id];
      return copy;
    });
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleDragMouseMove);
    document.removeEventListener('mouseup', handleDragMouseUp);
  }, [startDate, updateTask, handleDragMouseMove]);

  const startDrag = useCallback((e: React.MouseEvent, task: GanttTask, mode: DragMode, currentLeft: number, currentWidth: number) => {
    e.stopPropagation();
    e.preventDefault();

    const info: DragInfo = {
      id: task.id,
      mode,
      startX: e.clientX,
      origLeft: currentLeft,
      origWidth: currentWidth,
      origStartDate: task.start,
      origEndDate: task.end,
    };
    dragRef.current = info;
    setIsDragging(true);

    const cursor = mode === 'move' ? 'grabbing' : 'ew-resize';
    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleDragMouseMove);
    document.addEventListener('mouseup', handleDragMouseUp);
  }, [handleDragMouseMove, handleDragMouseUp]);

  const todayOffset = useMemo(() => {
    const today = new Date('2026-01-20');
    const diff = Math.ceil((today.getTime() - startDate.getTime()) / DAY_MS);
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
          {/* Task List (Resizable) */}
          <div className="relative shrink-0 border-r border-border bg-card" style={{ width: columnWidth }}>
            {/* Header */}
            <div className="h-14 border-b border-border flex items-center px-4 bg-muted/30">
              <span className="text-sm font-medium">Task</span>
            </div>
            {/* Task rows */}
            <div
              className="overflow-y-auto"
              ref={leftScrollRef}
              onScroll={onLeftScroll}
            >
              {tasks.map((task, _, arr) => {
                const hasVisibleParent = task.parentId && arr.some(t => t.id === task.parentId);
                return (
                <div
                  key={task.id}
                  ref={(el) => { leftRowRefs.current[task.id] = el; }}
                  className="flex items-start gap-3 px-4 border-b border-border hover:bg-muted/30 relative"
                  style={{ minHeight: ROW_HEIGHT, paddingTop: 10, paddingBottom: 10, paddingLeft: hasVisibleParent ? '2.5rem' : '1rem' }}
                >
                  {hasVisibleParent && (
                    <div className="absolute left-[1.125rem] top-0 bottom-0 w-px bg-border/80" />
                  )}
                  {hasVisibleParent && (
                    <div className="absolute left-[1.125rem] top-[22px] w-3 h-px bg-border/80" />
                  )}
                  {task.assignee && (
                    <UserAvatar user={task.assignee} size="sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {task.type !== 'project' && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <TaskWatchButton taskId={task.id} size="xs" />
                        </div>
                      )}
                      <p className={cn(
                        'text-sm whitespace-normal break-words flex items-center gap-1.5',
                        task.type === 'project' && 'font-semibold',
                        task.isOverdue && 'text-destructive font-medium'
                      )}>
                        {task.isMilestone && (
                          <Star className="size-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                        )}
                        {task.name}
                      </p>
                    </div>
                  </div>
                  {task.type === 'milestone' && (
                    <Badge variant="outline" className="text-xs">M</Badge>
                  )}
                </div>
                );
              })}
            </div>
            {/* Resizer */}
            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={(e) => {
                isResizingRef.current = true;
                startXRef.current = e.clientX;
                startWidthRef.current = columnWidth;
                document.addEventListener('mousemove', handleResizerMouseMove);
                document.addEventListener('mouseup', handleResizerMouseUp);
                document.body.style.cursor = 'col-resize';
              }}
              className="absolute top-0 right-0 h-full -translate-x-1 w-2 cursor-col-resize z-20"
            />
          </div>

          {/* Timeline (Scrollable) */}
          <div className="flex-1 overflow-hidden">
            <div
              ref={scrollRef}
              className="h-full overflow-x-auto overflow-y-auto"
              onScroll={onTimelineScroll}
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
                  {tasks.map((task) => {
                    const pos = getTaskPosition(task);
                    const override = tempPositions[task.id];
                    const left = override ? override.left : pos.left;
                    const width = override ? override.width : pos.width;
                    const rowHeight = rowHeights[task.id] || ROW_HEIGHT;
                    const isTask = task.type === 'task';
                    const isBeingDragged = !!override;
                    const dragDates = getDragDates(task.id, task);

                    return (
                      <div
                        key={task.id}
                        className="relative border-b border-border"
                        style={{ height: rowHeight }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'absolute top-2 rounded-md transition-shadow group/bar',
                                task.type === 'project' ? 'h-6' : 'h-5',
                                task.type === 'milestone' ? 'w-4 h-4 rotate-45 top-3' : '',
                                task.isOverdue ? 'bg-destructive' : getProgressColor(task.progress, task.type),
                                isTask && !isDragging && 'cursor-grab hover:shadow-lg hover:shadow-black/20 hover:ring-2 hover:ring-primary/40',
                                isBeingDragged && 'shadow-xl shadow-black/30 ring-2 ring-primary/60 opacity-90',
                                !isTask && 'cursor-pointer hover:opacity-80',
                              )}
                              style={{
                                left,
                                width: task.type === 'milestone' ? 16 : width,
                                transition: isBeingDragged ? 'none' : undefined,
                              }}
                              onMouseDown={isTask ? (e) => {
                                // Only left-click, and only if not clicking on a resize handle
                                if (e.button !== 0) return;
                                startDrag(e, task, 'move', left, width);
                              } : undefined}
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
                                    <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white truncate select-none">
                                      {task.progress}%
                                    </span>
                                  )}

                                  {/* ── Left resize handle ── */}
                                  {isTask && (
                                    <div
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        startDrag(e, task, 'resize-left', left, width);
                                      }}
                                      className={cn(
                                        'absolute top-0 left-0 h-full w-2.5 cursor-ew-resize z-30',
                                        'flex items-center justify-center',
                                        // visible handle line on hover
                                        'opacity-0 group-hover/bar:opacity-100 transition-opacity',
                                      )}
                                      aria-hidden
                                    >
                                      <div className="w-[3px] h-3 rounded-full bg-white/80" />
                                    </div>
                                  )}

                                  {/* ── Right resize handle ── */}
                                  {isTask && (
                                    <div
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        startDrag(e, task, 'resize-right', left, width);
                                      }}
                                      className={cn(
                                        'absolute top-0 right-0 h-full w-2.5 cursor-ew-resize z-30',
                                        'flex items-center justify-center',
                                        'opacity-0 group-hover/bar:opacity-100 transition-opacity',
                                      )}
                                      aria-hidden
                                    >
                                      <div className="w-[3px] h-3 rounded-full bg-white/80" />
                                    </div>
                                  )}
                                </>
                              )}
                              
                              {task.type === 'milestone' && (
                                <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                                  <Star className="size-3 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{task.name}</p>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                <p>Start: {dragDates.start.toLocaleDateString()}</p>
                                <p>End: {dragDates.end.toLocaleDateString()}</p>
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
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-3 rounded bg-destructive" />
            <span className="text-muted-foreground">Overdue</span>
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
