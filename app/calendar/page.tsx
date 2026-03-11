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
import { generateCalendarEvents, projects, tasks } from '@/lib/mock-data';
import type { CalendarEvent } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type ViewMode = 'month' | 'week' | 'day';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date('2026-01-20'));
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const events = useMemo(() => {
    const allEvents = generateCalendarEvents();
    if (selectedProject === 'all') return allEvents;
    return allEvents.filter(e => e.projectId === selectedProject);
  }, [selectedProject]);

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
    setCurrentDate(new Date('2026-01-20'));
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
    
    return days;
  };

  const getEventsForDate = (date: Date | null): CalendarEvent[] => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const isToday = (date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date('2026-01-20');
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
    const today = new Date('2026-01-20');
    return events
      .filter(e => new Date(e.start) >= today)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  }, [events]);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
                <p className="text-muted-foreground">View and manage your schedule</p>
              </div>
              <Button className="gap-2">
                <Plus className="size-4" />
                Add Event
              </Button>
            </div>

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
                      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                        {/* Day headers */}
                        {DAYS.map((day) => (
                          <div
                            key={day}
                            className="bg-muted p-3 text-center text-sm font-medium text-muted-foreground"
                          >
                            {day}
                          </div>
                        ))}
                        {/* Calendar days */}
                        {days.map((date, index) => {
                          const dayEvents = getEventsForDate(date);
                          const today = isToday(date);
                          
                          return (
                            <div
                              key={index}
                              className={cn(
                                'bg-card min-h-[120px] p-2 relative',
                                !date && 'bg-muted/50',
                                today && 'ring-2 ring-primary ring-inset'
                              )}
                            >
                              {date && (
                                <>
                                  <span
                                    className={cn(
                                      'inline-flex items-center justify-center size-7 rounded-full text-sm',
                                      today && 'bg-primary text-primary-foreground font-semibold'
                                    )}
                                  >
                                    {date.getDate()}
                                  </span>
                                  <div className="mt-1 space-y-1">
                                    {dayEvents.slice(0, 3).map((event) => (
                                      <Popover key={event.id}>
                                        <PopoverTrigger asChild>
                                          <button
                                            className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1"
                                            style={{ backgroundColor: `${event.color}20`, color: event.color }}
                                          >
                                            {getEventTypeIcon(event.type)}
                                            <span className="truncate">{event.title}</span>
                                          </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-3">
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="size-3 rounded-full"
                                                style={{ backgroundColor: event.color }}
                                              />
                                              <span className="font-medium">{event.title}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                              <CalendarIcon className="size-4" />
                                              {event.start.toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                              })}
                                            </div>
                                            <Badge variant="outline" className="capitalize">
                                              {event.type}
                                            </Badge>
                                          </div>
                                        </PopoverContent>
                                      </Popover>
                                    ))}
                                    {dayEvents.length > 3 && (
                                      <span className="text-xs text-muted-foreground px-1.5">
                                        +{dayEvents.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </>
                              )}
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
                                <p className="text-xs text-muted-foreground">{DAYS[date.getDay()]}</p>
                                <p
                                  className={cn(
                                    'text-xl font-semibold',
                                    today && 'text-primary'
                                  )}
                                >
                                  {date.getDate()}
                                </p>
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
    </div>
  );
}
