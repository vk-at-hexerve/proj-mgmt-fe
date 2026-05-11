'use client';

import { useState, useMemo } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AICopilot } from '@/components/ai/ai-copilot';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Flag,
  Target,
  Users,
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { cn } from '@/lib/utils';
import type { Task, Project, Sprint } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Calendar events derived from tasks
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'sprint' | 'milestone' | 'meeting';
  color: string;
  taskId?: string;
  projectId?: string;
}

type ViewMode = 'month' | 'week' | 'day';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
export default function CalendarPage() {
  const { tasks, projects, sprints, addTask, addSprint, users, currentUser } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [eventType, setEventType] = useState<'task' | 'sprint' | 'milestone' | 'high-priority' | 'critical'>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projId, setProjId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const getTodayDateInputValue = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = `${today.getMonth() + 1}`.padStart(2, "0");
    const day = `${today.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isPastDate = (value: string) => {
    if (!value) return false;
    const selected = new Date(`${value}T00:00:00`);
    if (Number.isNaN(selected.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  };

  const handleOpenModal = () => {
    setEventType('task');
    setTitle('');
    setDescription('');
    setProjId(selectedProject !== 'all' ? selectedProject : (projects[0]?.id || ''));

    const today = new Date().toISOString().split('T')[0];
    setDueDate(today);
    setStartDate(today);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setEndDate(nextWeek.toISOString().split('T')[0]);

    setIsCreateModalOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projId) return;

    if (eventType === 'sprint') {
      if (!startDate || !endDate) return;
      if (isPastDate(startDate) || isPastDate(endDate)) return;
      addSprint({
        name: title.trim(),
        goal: description.trim(),
        startDate,
        endDate,
        status: 'planning',
        projectId: projId,
      });
    } else {
      if (!dueDate) return;
      if (isPastDate(dueDate)) return;

      let taskType: 'epic' | 'story' | 'task' | 'subtask' | 'bug' = 'task';
      let taskPriority: 'critical' | 'high' | 'medium' | 'low' = 'medium';

      if (eventType === 'milestone') {
        taskType = 'epic';
      } else if (eventType === 'high-priority') {
        taskPriority = 'high';
      } else if (eventType === 'critical') {
        taskPriority = 'critical';
      }

      await addTask({
        title: title.trim(),
        description: description.trim(),
        type: taskType,
        priority: taskPriority,
        status: 'open',
        projectId: projId,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        reporter: currentUser || users[0],
        tags: [],
      });
    }

    setIsCreateModalOpen(false);
  };

  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Add task dates
    tasks.forEach((task) => {
      // Use startDate if available, fallback to dueDate
      const start = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
      const end = task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : null);

      if (start && end) {
        let color = '#3B82F6';
        let eventType: CalendarEvent['type'] = 'task';

        if (task.type === 'epic') {
          color = '#22C55E';
          eventType = 'milestone';
        } else if (task.priority === 'critical') {
          color = '#EF4444';
        } else if (task.priority === 'high') {
          color = '#F59E0B';
        }

        calendarEvents.push({
          id: `event-task-${task.id}`,
          title: task.title,
          start: start,
          end: end,
          type: eventType,
          color: color,
          taskId: task.id,
          projectId: task.projectId,
        });
      }
    });

    // Add sprint dates
    sprints.forEach((sprint) => {
      calendarEvents.push({
        id: `event-sprint-${sprint.id}`,
        title: sprint.name,
        start: new Date(sprint.startDate),
        end: new Date(sprint.endDate),
        type: 'sprint',
        color: '#7B68EE',
        projectId: sprint.projectId,
      });
    });

    return calendarEvents
      .filter(e => selectedProject === 'all' || e.projectId === selectedProject)
      .sort((a, b) => {
        const startA = a.start.getTime();
        const startB = b.start.getTime();
        if (startA !== startB) return startA - startB;
        // Longer events first for consistent stack
        return (b.end.getTime() - b.start.getTime()) - (a.end.getTime() - a.start.getTime());
      });
  }, [tasks, sprints, selectedProject]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add empty slots to complete the last week
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  };

  const getEventsForDate = (date: Date | null): CalendarEvent[] => {
    if (!date) return [];
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    return events.filter(event => {
      const start = new Date(event.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(event.end);
      end.setHours(23, 59, 59, 999);

      return d >= start && d <= end;
    });
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getWeekDays = (date: Date): Date[] => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    const weekStart = new Date(date);
    weekStart.setDate(diff);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'task': return <Clock className="size-3" />;
      case 'sprint': return <Flag className="size-3" />;
      case 'milestone': return <Target className="size-3" />;
      case 'meeting': return <Users className="size-3" />;
    }
  };

  const days = viewMode === 'month' ? getDaysInMonth(currentDate) : getWeekDays(currentDate);

  // Upcoming events for sidebar
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return events
      .filter(e => new Date(e.start) >= today)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  }, [events]);

  const weeks = useMemo(() => {
    const w: (Date | null)[][] = [];
    if (viewMode === 'month') {
      const monthDays = getDaysInMonth(currentDate);
      for (let i = 0; i < monthDays.length; i += 7) {
        w.push(monthDays.slice(i, i + 7));
      }
    } else {
      w.push(getWeekDays(currentDate));
    }
    return w;
  }, [currentDate, viewMode]);

  const getWeekEventSlots = (week: (Date | null)[]) => {
    const startOfWeek = week.find(d => d !== null);
    const endOfWeek = [...week].reverse().find(d => d !== null);
    if (!startOfWeek || !endOfWeek) return [];

    const weekEvents = events.filter(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const weekStart = new Date(startOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(endOfWeek);
      weekEnd.setHours(23, 59, 59, 999);
      return start <= weekEnd && end >= weekStart;
    });

    const slots: { event: CalendarEvent; startCol: number; endCol: number }[][] = [];

    weekEvents.forEach(event => {
      const eStart = new Date(event.start);
      const eEnd = new Date(event.end);
      const compareStart = new Date(eStart);
      compareStart.setHours(0, 0, 0, 0);
      const compareEnd = new Date(eEnd);
      compareEnd.setHours(0, 0, 0, 0);

      // Default to full week coverage if outside week boundaries
      let startCol = 0;
      let endCol = 6;

      week.forEach((date, i) => {
        if (date) {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          if (d.getTime() === compareStart.getTime()) startCol = i;
          if (d.getTime() === compareEnd.getTime()) endCol = i;
        }
      });

      const weekStartBound = new Date(startOfWeek);
      weekStartBound.setHours(0, 0, 0, 0);
      const weekEndBound = new Date(endOfWeek);
      weekEndBound.setHours(0, 0, 0, 0);

      if (compareStart < weekStartBound) startCol = 0;
      if (compareEnd > weekEndBound) endCol = 6;

      let slotIndex = slots.findIndex(slot => {
        return !slot.some(s => s.startCol <= endCol && s.endCol >= startCol);
      });

      if (slotIndex === -1) {
        slotIndex = slots.length;
        slots[slotIndex] = [];
      }

      slots[slotIndex].push({ event, startCol, endCol });
    });

    return slots;
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="Calendar"
          subtitle="View and manage your schedule"
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Calendar */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                            <ChevronLeft className="size-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                            <ChevronRight className="size-4" />
                          </Button>
                        </div>
                        <h2 className="text-lg font-semibold">
                          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <Button variant="outline" size="sm" onClick={goToToday}>
                          Today
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                          <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Projects" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="day">Day</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {viewMode === 'month' && (
                      <div className="flex flex-col bg-border rounded-lg overflow-hidden border border-border">
                        {/* Day headers */}
                        <div className="grid grid-cols-7 bg-muted border-b border-border">
                          {DAYS.map((day) => (
                            <div
                              key={day}
                              className="p-3 text-center text-sm font-medium text-muted-foreground"
                            >
                              {day}
                            </div>
                          ))}
                        </div>

                        {weeks.map((week: (Date | null)[], weekIdx: number) => {
                          const slots = getWeekEventSlots(week);
                          return (
                            <div key={weekIdx} className="grid grid-cols-7 relative min-h-[120px] bg-card border-b border-border last:border-b-0">
                              {/* Background Cells */}
                              {week.map((date: Date | null, dayIdx: number) => (
                                <div
                                  key={dayIdx}
                                  className={cn(
                                    "border-r border-border last:border-r-0 relative",
                                    !date && "bg-muted/30"
                                  )}
                                >
                                  {date && (
                                    <div className="p-2 text-right">
                                      <span
                                        className={cn(
                                          'inline-flex items-center justify-center size-7 rounded-full text-sm transition-colors',
                                          isToday(date) ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
                                        )}
                                      >
                                        {date.getDate()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Events Layer */}
                              <div className="absolute top-10 left-0 right-0 bottom-0 pointer-events-none px-1">
                                <div className="grid grid-cols-7 gap-y-1">
                                  {slots.map((slot, slotIdx) => (
                                    <div key={slotIdx} className="contents">
                                      {slot.map(({ event, startCol, endCol }, idx) => {
                                        const isEventStart = week[startCol] && event.start.toDateString() === week[startCol]?.toDateString();
                                        const isEventEnd = week[endCol] && event.end.toDateString() === week[endCol]?.toDateString();

                                        return (
                                          <div
                                            key={`${event.id}-${idx}`}
                                            className="pointer-events-auto"
                                            style={{
                                              gridColumnStart: startCol + 1,
                                              gridColumnEnd: endCol + 2,
                                              gridRowStart: slotIdx + 1
                                            }}
                                          >
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <button
                                                  className={cn(
                                                    "w-full text-left text-[10px] px-2 py-1 truncate flex items-center gap-1.5 transition-all hover:brightness-95 shadow-sm",
                                                    isEventStart ? "rounded-l-md ml-0.5" : "rounded-l-none",
                                                    isEventEnd ? "rounded-r-md mr-0.5" : "rounded-r-none"
                                                  )}
                                                  style={{
                                                    backgroundColor: `${event.color}`,
                                                    color: 'white',
                                                    marginTop: '1px'
                                                  }}
                                                >
                                                  {getEventTypeIcon(event.type)}
                                                  <span className="font-semibold truncate">{event.title}</span>
                                                </button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-80 p-4 shadow-xl border-2" style={{ borderColor: event.color }}>
                                                <div className="space-y-4">
                                                  <div className="flex items-center justify-between">
                                                    <Badge className="capitalize px-2 py-0.5" style={{ backgroundColor: event.color, color: 'white' }}>
                                                      {event.type}
                                                    </Badge>
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                                      <Clock className="size-3.5" />
                                                      <span>
                                                        {event.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {event.end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="space-y-1.5">
                                                    <h4 className="font-bold text-base leading-tight">{event.title}</h4>
                                                    {tasks.find(t => t.id === event.taskId)?.description && (
                                                      <p className="text-sm text-muted-foreground leading-snug">
                                                        {tasks.find(t => t.id === event.taskId)?.description}
                                                      </p>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center gap-2.5 pt-3 border-t border-border mt-2">
                                                    <div className="size-3 rounded-full shadow-inner" style={{ backgroundColor: event.color }} />
                                                    <span className="text-xs font-semibold text-muted-foreground">
                                                      {projects.find(p => p.id === event.projectId)?.name || 'Internal Project'}
                                                    </span>
                                                  </div>
                                                </div>
                                              </PopoverContent>
                                            </Popover>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {viewMode === 'week' && (
                      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                        {days.map((date, index) => {
                          const dayEvents = getEventsForDate(date);
                          const today = isToday(date);

                          return (
                            <div key={index} className="bg-card min-h-[400px]">
                              <div
                                className={cn(
                                  'p-3 text-center border-b border-border',
                                  today && 'bg-primary/10'
                                )}
                              >
                                {date && (
                                  <>
                                    <p className="text-xs text-muted-foreground">{DAYS[date.getDay()]}</p>
                                    <p
                                      className={cn(
                                        'text-xl font-semibold',
                                        today && 'text-primary'
                                      )}
                                    >
                                      {date.getDate()}
                                    </p>
                                  </>
                                )}
                              </div>
                              <div className="p-2 space-y-1">
                                {dayEvents.map((event) => (
                                  <div
                                    key={event.id}
                                    className="text-xs p-2 rounded flex items-center gap-1.5"
                                    style={{ backgroundColor: `${event.color}20`, color: event.color }}
                                  >
                                    {getEventTypeIcon(event.type)}
                                    <span className="truncate">{event.title}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {viewMode === 'day' && (
                      <div className="bg-card rounded-lg border border-border">
                        <div className="p-4 border-b border-border text-center">
                          <p className="text-sm text-muted-foreground">
                            {DAYS[currentDate.getDay()]}
                          </p>
                          <p className="text-3xl font-bold">{currentDate.getDate()}</p>
                          <p className="text-sm text-muted-foreground">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                          </p>
                        </div>
                        <div className="p-4 space-y-3 min-h-[400px]">
                          {getEventsForDate(currentDate).length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <CalendarIcon className="size-12 mx-auto mb-3 opacity-50" />
                              <p>No events scheduled for this day</p>
                            </div>
                          ) : (
                            getEventsForDate(currentDate).map((event) => (
                              <div
                                key={event.id}
                                className="p-4 rounded-lg flex items-center gap-3"
                                style={{ backgroundColor: `${event.color}10`, borderLeft: `4px solid ${event.color}` }}
                              >
                                <div
                                  className="size-10 rounded-lg flex items-center justify-center"
                                  style={{ backgroundColor: `${event.color}20`, color: event.color }}
                                >
                                  {getEventTypeIcon(event.type)}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{event.title}</p>
                                  <p className="text-sm text-muted-foreground capitalize">{event.type}</p>
                                </div>
                                <Badge variant="outline" style={{ borderColor: event.color, color: event.color }}>
                                  {event.start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="gap-1 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                    onClick={handleOpenModal}
                  >
                    <Plus className="size-4" />
                    Create Event
                  </Button>
                </div>

                {/* Mini Calendar */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Quick Jump</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {DAYS.map((day) => (
                        <div key={day} className="text-muted-foreground py-1">
                          {day.charAt(0)}
                        </div>
                      ))}
                      {getDaysInMonth(currentDate).slice(0, 35).map((date, i) => (
                        <button
                          key={i}
                          className={cn(
                            'py-1 rounded hover:bg-muted',
                            isToday(date) && 'bg-primary text-primary-foreground hover:bg-primary',
                            !date && 'invisible'
                          )}
                          onClick={() => date && setCurrentDate(date)}
                        >
                          {date?.getDate()}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div
                          className="size-2 rounded-full mt-2 shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.start.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs capitalize shrink-0">
                          {event.type}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Legend */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Event Types</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="size-3 rounded-full bg-[#3B82F6]" />
                      <span>Tasks</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="size-3 rounded-full bg-[#7B68EE]" />
                      <span>Sprints</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="size-3 rounded-full bg-[#22C55E]" />
                      <span>Milestones</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="size-3 rounded-full bg-[#F59E0B]" />
                      <span>High Priority</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="size-3 rounded-full bg-[#EF4444]" />
                      <span>Critical</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
        <AICopilot />
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>
              Create a new event on your calendar.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label htmlFor="event-type">Event Type</Label>
              <Select value={eventType} onValueChange={(v: any) => setEventType(v)}>
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="sprint">Sprints</SelectItem>
                  <SelectItem value="milestone">Milestones</SelectItem>
                  <SelectItem value="high-priority">High Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="event-desc">Description</Label>
              <Textarea
                id="event-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="event-project">Project</Label>
              <Select value={projId} onValueChange={setProjId}>
                <SelectTrigger id="event-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {eventType !== 'sprint' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="event-start-date">Start Date</Label>
                  <Input
                    id="event-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="event-date">Due Date</Label>
                  <Input
                    id="event-date"
                    type="date"
                    value={dueDate}
                    min={startDate || getTodayDateInputValue()}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="event-start-date">Start Date</Label>
                  <Input
                    id="event-start-date"
                    type="date"
                    value={startDate}
                    min={getTodayDateInputValue()}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="event-end-date">End Date</Label>
                  <Input
                    id="event-end-date"
                    type="date"
                    value={endDate}
                    min={getTodayDateInputValue()}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Event</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
