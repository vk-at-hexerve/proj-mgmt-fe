'use client';

import { useMemo, useState } from 'react';
import { useApp } from '@/lib/app-context';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Layers,
  Zap,
  Bug,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import type { Task, Sprint } from '@/lib/types';

// ─── Types ─────────────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'sprint' | 'epic';
  color: string;
  bgColor: string;
  task?: Task;
  sprint?: Sprint;
  priority?: string;
  status?: string;
}

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateInRange(date: Date, start: Date, end: Date): boolean {
  const d = toMidnight(date).getTime();
  return d >= toMidnight(start).getTime() && d <= toMidnight(end).getTime();
}

// ─── Event helpers ──────────────────────────────────────────────────────────

const TASK_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  epic:    { text: 'text-purple-700 dark:text-purple-300',    bg: 'bg-purple-500',  border: 'border-purple-400' },
  story:   { text: 'text-green-700 dark:text-green-300',      bg: 'bg-green-500',   border: 'border-green-400' },
  bug:     { text: 'text-red-700 dark:text-red-300',          bg: 'bg-red-500',     border: 'border-red-400' },
  task:    { text: 'text-blue-700 dark:text-blue-300',        bg: 'bg-blue-500',    border: 'border-blue-400' },
  subtask: { text: 'text-sky-700 dark:text-sky-300',          bg: 'bg-sky-500',     border: 'border-sky-400' },
  sprint:  { text: 'text-indigo-700 dark:text-indigo-300',    bg: 'bg-indigo-500',  border: 'border-indigo-400' },
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-yellow-500',
  low:      'bg-green-500',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  'open':            <Clock className="size-3" />,
  'assigned':        <CheckCircle2 className="size-3" />,
  'in-progress':     <Zap className="size-3" />,
  'pending-approval':<AlertCircle className="size-3" />,
  'closed':          <CheckCircle2 className="size-3 text-green-500" />,
};

function typeIcon(type: string) {
  switch (type) {
    case 'epic':    return <Layers className="size-3" />;
    case 'bug':     return <Bug className="size-3" />;
    case 'story':   return <BookOpen className="size-3" />;
    case 'sprint':  return <Flag className="size-3" />;
    default:        return <CheckCircle2 className="size-3" />;
  }
}

// ─── Single Banner Row ───────────────────────────────────────────────────────

function EventBanner({
  event,
  isStart,
  isEnd,
  onClick,
}: {
  event: CalendarEvent;
  isStart: boolean;
  isEnd: boolean;
  onClick: () => void;
}) {
  const colors = TASK_COLORS[event.type] ?? TASK_COLORS.task;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        'w-full h-5 flex items-center gap-1 px-1.5 text-[10px] font-medium text-white truncate transition-opacity hover:opacity-80 cursor-pointer',
        colors.bg,
        isStart && 'rounded-l-sm',
        isEnd && 'rounded-r-sm',
        !isStart && 'pl-0',
      )}
      title={event.title}
    >
      {isStart && (
        <>
          {typeIcon(event.type)}
          <span className="truncate">{event.title}</span>
        </>
      )}
    </button>
  );
}

// ─── Day Overflow Popover ────────────────────────────────────────────────────

function OverflowPopover({
  date,
  events,
}: {
  date: Date;
  events: CalendarEvent[];
}) {
  const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="text-[10px] font-semibold text-primary hover:underline leading-none mt-0.5 block text-left"
          onClick={(e) => e.stopPropagation()}
        >
          +{events.length} more
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start" side="bottom">
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{label}</p>
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {events.map((ev) => {
            const colors = TASK_COLORS[ev.type] ?? TASK_COLORS.task;
            return (
              <div
                key={ev.id}
                className={cn('flex items-center gap-2 rounded-md px-2 py-1.5 text-xs', `${colors.bg}/10 border border-current/10`)}
              >
                <div className={cn('size-2 rounded-full shrink-0', colors.bg)} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{ev.title}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                    <span className="capitalize">{ev.type}</span>
                    {ev.status && (
                      <>
                        <span>·</span>
                        <span className="capitalize">{ev.status.replace('-', ' ')}</span>
                      </>
                    )}
                    {ev.priority && (
                      <>
                        <span>·</span>
                        <span className={cn('size-1.5 rounded-full inline-block', PRIORITY_COLORS[ev.priority])} />
                        <span className="capitalize">{ev.priority}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Event Detail Popover ────────────────────────────────────────────────────

function EventDetailPopover({
  event,
  open,
  onClose,
}: {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!event) return null;
  const colors = TASK_COLORS[event.type] ?? TASK_COLORS.task;
  const task = event.task;
  const sprint = event.sprint;
  const duration = Math.max(1, Math.ceil((event.end.getTime() - event.start.getTime()) / 86400000) + 1);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm',
        !open && 'hidden',
      )}
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-80 max-h-[80vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={cn('size-8 rounded-lg flex items-center justify-center text-white shrink-0', colors.bg)}>
            {typeIcon(event.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">{event.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant="outline" className="text-[10px] capitalize">{event.type}</Badge>
              {event.status && (
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {event.status.replace('-', ' ')}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="size-3.5 shrink-0" />
            <span>
              {event.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {' – '}
              {event.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="text-muted-foreground/60">({duration}d)</span>
          </div>

          {task?.priority && (
            <div className="flex items-center gap-2">
              <span className={cn('size-2 rounded-full', PRIORITY_COLORS[task.priority])} />
              <span className="capitalize">{task.priority} priority</span>
            </div>
          )}

          {task?.assignee && (
            <div className="flex items-center gap-2">
              <div className="size-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">
                {task.assignee.name.split(' ').map(n => n[0]).join('')}
              </div>
              <span>{task.assignee.name}</span>
            </div>
          )}

          {task?.storyPoints && (
            <div className="flex items-center gap-2">
              <Zap className="size-3.5" />
              <span>{task.storyPoints} story points</span>
            </div>
          )}

          {sprint?.goal && (
            <div className="pt-1">
              <p className="text-[10px] uppercase font-semibold tracking-wide mb-1">Sprint Goal</p>
              <p className="text-xs text-foreground">{sprint.goal}</p>
            </div>
          )}
        </div>

        <button
          className="mt-4 w-full text-xs text-center text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Main Calendar Component ─────────────────────────────────────────────────

const MAX_VISIBLE = 3;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ProjectCalendarViewProps {
  projectId: string;
}

export function ProjectCalendarView({ projectId }: ProjectCalendarViewProps) {
  const { tasks: allTasks, sprints: allSprints } = useApp();

  // ── Month navigation ─────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const prevMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday  = () => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  // ── Build calendar grid ──────────────────────────────────────────────────
  const { calendarDays, gridStart, gridEnd } = useMemo(() => {
    const year  = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const today = toMidnight(new Date());

    // Always show 6 weeks for consistency
    const gridStart = new Date(year, month, 1 - startDow);
    const gridEnd   = new Date(year, month, lastDay.getDate() + (41 - lastDay.getDay()));
    gridStart.setHours(0,0,0,0);
    gridEnd.setHours(23,59,59,999);

    const days: DayCell[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      days.push({
        date: new Date(cursor),
        isCurrentMonth: cursor.getMonth() === month,
        isToday: isSameDay(cursor, today),
        isWeekend: cursor.getDay() === 0 || cursor.getDay() === 6,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return { calendarDays: days, gridStart: new Date(gridStart), gridEnd: new Date(gridEnd) };
  }, [currentMonth]);

  // ── Build events from tasks + sprints ────────────────────────────────────
  const events = useMemo<CalendarEvent[]>(() => {
    const result: CalendarEvent[] = [];

    // Tasks
    allTasks
      .filter(t => t.projectId === projectId)
      .forEach(task => {
        const start = parseDate(task.startDate ?? task.createdAt);
        const end   = parseDate(task.dueDate ?? task.startDate ?? task.createdAt);
        if (!start || !end) return;
        const safeEnd = end < start ? start : end;

        const colors = TASK_COLORS[task.type] ?? TASK_COLORS.task;
        result.push({
          id: task.id,
          title: `${task.key}: ${task.title}`,
          start,
          end: safeEnd,
          type: task.type === 'epic' ? 'epic' : task.type as any,
          color: colors.text,
          bgColor: colors.bg,
          task,
          priority: task.priority,
          status: task.status,
        });
      });

    // Sprints
    allSprints
      .filter(s => s.projectId === projectId)
      .forEach(sprint => {
        const start = parseDate(sprint.startDate);
        const end   = parseDate(sprint.endDate);
        if (!start || !end) return;
        const colors = TASK_COLORS.sprint;
        result.push({
          id: `sprint-${sprint.id}`,
          title: sprint.name,
          start,
          end,
          type: 'sprint',
          color: colors.text,
          bgColor: colors.bg,
          sprint,
          status: sprint.status,
        });
      });

    return result;
  }, [allTasks, allSprints, projectId]);

  // ── For each row of 7 days, compute banner layout ───────────────────────
  // We process events week-by-week so banners wrap correctly at row boundaries.
  const weeks = useMemo(() => {
    const rows: DayCell[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      rows.push(calendarDays.slice(i, i + 7));
    }
    return rows;
  }, [calendarDays]);

  // Per-day: which events land here (for overflow counting and dot display)
  const eventsOnDay = (date: Date): CalendarEvent[] =>
    events.filter(ev => dateInRange(date, ev.start, ev.end));

  // Per-week-row: compute banner slots
  type BannerSlot = {
    event: CalendarEvent;
    startCol: number; // 0-6 within this row
    endCol: number;   // 0-6 within this row
    lane: number;     // vertical stacking index
    isStart: boolean;
    isEnd: boolean;
  };

  const weekBanners = useMemo<BannerSlot[][]>(() => {
    return weeks.map(week => {
      const rowStart = toMidnight(week[0].date);
      const rowEnd   = toMidnight(week[6].date);
      const slots: BannerSlot[] = [];

      // Events that intersect this week
      const weekEvents = events.filter(ev =>
        toMidnight(ev.end) >= rowStart && toMidnight(ev.start) <= rowEnd
      );

      // Sort: multi-day first, then by start, then alphabetically
      weekEvents.sort((a, b) => {
        const aDur = a.end.getTime() - a.start.getTime();
        const bDur = b.end.getTime() - b.start.getTime();
        if (bDur !== aDur) return bDur - aDur;
        return a.start.getTime() - b.start.getTime();
      });

      // Lane assignment (greedy)
      const laneOccupied: Array<[number, number][]> = []; // lane -> list of [colStart, colEnd] intervals

      weekEvents.forEach(ev => {
        const clampedStart = toMidnight(ev.start) < rowStart ? rowStart : toMidnight(ev.start);
        const clampedEnd   = toMidnight(ev.end)   > rowEnd   ? rowEnd   : toMidnight(ev.end);

        // Col indices
        const startCol = Math.round((clampedStart.getTime() - rowStart.getTime()) / 86400000);
        const endCol   = Math.round((clampedEnd.getTime()   - rowStart.getTime()) / 86400000);
        const isStart = isSameDay(ev.start, clampedStart);
        const isEnd   = isSameDay(ev.end,   clampedEnd);

        // Find first free lane
        let lane = 0;
        while (true) {
          if (!laneOccupied[lane]) laneOccupied[lane] = [];
          const occupied = laneOccupied[lane];
          const conflicts = occupied.some(([s, e]) => !(endCol < s || startCol > e));
          if (!conflicts) break;
          lane++;
        }

        laneOccupied[lane].push([startCol, endCol]);
        slots.push({ event: ev, startCol, endCol, lane, isStart, isEnd });
      });

      return slots;
    });
  }, [weeks, events]);

  // ─── Overflow: for each day, collect all events so we can show "+N more"
  // We cap the banner lanes rendered per cell at MAX_VISIBLE.
  // Events in lane >= MAX_VISIBLE go into overflow.

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      {/* ── Header bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="size-8" onClick={prevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="text-base font-semibold min-w-[160px] text-center">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="outline" size="icon" className="size-8" onClick={nextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="hidden md:flex items-center gap-3 text-[10px] text-muted-foreground mr-2">
            {(['sprint', 'epic', 'story', 'task', 'bug'] as const).map(t => (
              <div key={t} className="flex items-center gap-1">
                <span className={cn('size-2 rounded-full', TASK_COLORS[t].bg)} />
                <span className="capitalize">{t}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToday}>
            Today
          </Button>
        </div>
      </div>

      {/* ── Day-of-week header ──────────────────────────────────────── */}
      <div className="grid grid-cols-7 border-b border-border shrink-0">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="text-center text-[11px] font-semibold text-muted-foreground py-2 uppercase tracking-wide"
          >
            {day}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {weeks.map((week, weekIdx) => {
          const slots = weekBanners[weekIdx];
          // Max lane in this week
          const maxLane = slots.reduce((m, s) => Math.max(m, s.lane), -1);
          // Row height: 1 lane = 20px + base header 28px + padding
          const bannerAreaHeight = Math.min(maxLane + 1, MAX_VISIBLE) * 22 + 4;
          const rowHeight = Math.max(80, 32 + bannerAreaHeight + 8);

          return (
            <div
              key={weekIdx}
              className="grid grid-cols-7 border-b border-border"
              style={{ minHeight: rowHeight }}
            >
              {/* ── Day cells ──────────────────────────────────────── */}
              {week.map((day, dayIdx) => {
                const dayEvs = eventsOnDay(day.date);
                // Slots visible in this cell (lane < MAX_VISIBLE)
                const visible = slots.filter(
                  s => s.lane < MAX_VISIBLE && dayIdx >= s.startCol && dayIdx <= s.endCol
                );
                // Overflow: events whose lane >= MAX_VISIBLE and also touch this day
                const overflowEvs = slots
                  .filter(s => s.lane >= MAX_VISIBLE && dayIdx >= s.startCol && dayIdx <= s.endCol)
                  .map(s => s.event);
                const showOverflow = overflowEvs.length > 0;

                return (
                  <div
                    key={dayIdx}
                    className={cn(
                      'relative border-r border-border last:border-r-0 pt-1',
                      day.isWeekend && 'bg-muted/20',
                      !day.isCurrentMonth && 'opacity-40',
                    )}
                  >
                    {/* Date number */}
                    <div className="px-1.5 mb-0.5">
                      <span
                        className={cn(
                          'inline-flex size-6 items-center justify-center rounded-full text-xs font-medium',
                          day.isToday
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground hover:bg-muted cursor-default',
                        )}
                      >
                        {day.date.getDate()}
                      </span>
                    </div>

                    {/* Banner placeholder rows */}
                    <div className="relative px-0.5 space-y-0.5" style={{ minHeight: bannerAreaHeight }}>
                      {Array.from({ length: Math.min(maxLane + 1, MAX_VISIBLE) }, (_, lane) => {
                        const slot = slots.find(
                          s => s.lane === lane && dayIdx >= s.startCol && dayIdx <= s.endCol
                        );
                        if (!slot) {
                          // Empty spacer to preserve lane height
                          return <div key={lane} className="h-5" />;
                        }
                        return (
                          <EventBanner
                            key={slot.event.id}
                            event={slot.event}
                            isStart={slot.isStart && slot.startCol === dayIdx}
                            isEnd={slot.isEnd && slot.endCol === dayIdx}
                            onClick={() => setSelectedEvent(slot.event)}
                          />
                        );
                      })}

                      {/* Overflow */}
                      {showOverflow && (
                        <OverflowPopover date={day.date} events={overflowEvs} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Event Detail Modal ──────────────────────────────────────── */}
      <EventDetailPopover
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}
