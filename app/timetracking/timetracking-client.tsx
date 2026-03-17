'use client';

import { useState } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AICopilot } from '@/components/ai/ai-copilot';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  MoreHorizontal,
  Clock,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Timer,
} from 'lucide-react';
// import { projects } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function TimeTrackingClient() {
  const { tasks, timeEntries, projects, addTimeEntry, updateTimeEntry, deleteTimeEntry, currentUser, getTask } = useApp();
  const [showLogModal, setShowLogModal] = useState(false);
  const [editEntry, setEditEntry] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  // Form states
  const [selectedTask, setSelectedTask] = useState('');
  const [hours, setHours] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  // Get week dates
  const getWeekDates = (d: Date) => {
    const start = new Date(d);
    start.setDate(start.getDate() - start.getDay() + 1);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const newD = new Date(start);
      newD.setDate(newD.getDate() + i);
      dates.push(newD);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeek);
  const startOfWeek = weekDates[0].toISOString().split('T')[0];
  const endOfWeek = weekDates[6].toISOString().split('T')[0];

  const weekEntries = timeEntries.filter(e => 
    e.userId === currentUser.id && 
    e.date >= startOfWeek && 
    e.date <= endOfWeek
  );

  const totalWeekHours = weekEntries.reduce((sum, e) => sum + e.hours, 0);
  const todayEntries = timeEntries.filter(e => 
    e.userId === currentUser.id && 
    e.date === new Date().toISOString().split('T')[0]
  );
  const todayHours = todayEntries.reduce((sum, e) => sum + e.hours, 0);
  const avgDailyHours = weekEntries.length > 0 ? totalWeekHours / 5 : 0;

  const dailyHours = weekDates.map((d: Date) => {
    const dateStr = d.toISOString().split('T')[0];
    const entries = weekEntries.filter((e: any) => e.date === dateStr);
    return entries.reduce((sum, e) => sum + e.hours, 0);
  });

  const handleLogTime = () => {
    if (!selectedTask || !hours || parseFloat(hours) <= 0) return;

    addTimeEntry({
      taskId: selectedTask,
      userId: currentUser.id,
      hours: parseFloat(hours),
      date,
      description: description.trim() || undefined,
    });

    setShowLogModal(false);
    resetForm();
  };

  const handleUpdateEntry = () => {
    if (!editEntry || !hours || parseFloat(hours) <= 0) return;

    updateTimeEntry(editEntry, {
      hours: parseFloat(hours),
      description: description.trim() || undefined,
    });

    setEditEntry(null);
    resetForm();
  };

  const resetForm = () => {
    setSelectedTask('');
    setHours('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
  };

  const openEditModal = (entryId: string) => {
    const entry = timeEntries.find(e => e.id === entryId);
    if (entry) {
      setHours(entry.hours.toString());
      setDescription(entry.description || '');
      setEditEntry(entryId);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  const myTasks = tasks.filter(t => t.assignee?.id === currentUser.id && t.status !== 'closed');

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="Time Tracking"
          subtitle="Log and manage your work hours"
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Today</p>
                      <p className="text-2xl font-bold">{todayHours.toFixed(1)}h</p>
                      <p className="text-xs text-muted-foreground">of 8h target</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Calendar className="size-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold">{totalWeekHours.toFixed(1)}h</p>
                      <p className="text-xs text-muted-foreground">of 40h target</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <TrendingUp className="size-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Daily</p>
                      <p className="text-2xl font-bold">{avgDailyHours.toFixed(1)}h</p>
                      <p className="text-xs text-muted-foreground">this week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Timer className="size-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Entries</p>
                      <p className="text-2xl font-bold">{weekEntries.length}</p>
                      <p className="text-xs text-muted-foreground">this week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Week Navigator */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <h3 className="font-medium">
                      {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedWeek(new Date())}>
                      Today
                    </Button>
                    <Button className="gap-2" onClick={() => setShowLogModal(true)}>
                      <Plus className="size-4" />
                      Log Time
                    </Button>
                  </div>
                </div>

                {/* Week Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {weekDates.map((d, i) => {
                    const dateStr = d.toISOString().split('T')[0];
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    const dayEntries = weekEntries.filter(e => e.date === dateStr);
                    const dayTotal = dailyHours[i];

                    return (
                      <div 
                        key={dateStr}
                        className={cn(
                          'p-3 rounded-lg border border-border text-center',
                          isToday && 'bg-primary/5 border-primary'
                        )}
                      >
                        <p className="text-xs text-muted-foreground">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </p>
                        <p className={cn('text-sm font-medium', isToday && 'text-primary')}>
                          {d.getDate()}
                        </p>
                        <p className="text-lg font-bold mt-2">{dayTotal.toFixed(1)}h</p>
                        <Progress 
                          value={(dayTotal / 8) * 100} 
                          className="h-1 mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {dayEntries.length} entries
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Time Entries Table */}
            <Card>
              <CardHeader>
                <CardTitle>Time Entries</CardTitle>
                <CardDescription>Your logged time for this week</CardDescription>
              </CardHeader>
              <CardContent>
                {weekEntries.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Project</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weekEntries.sort((a, b) => b.date.localeCompare(a.date)).map((entry: any) => {
                        const task = getTask(entry.taskId);
                        const project = task ? projects.find((p: any) => p.id === task.projectId) : null;

                        return (
                          <TableRow key={entry.id}>
                            <TableCell>
                              {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {task?.key}
                                </Badge>
                                <span className="text-sm truncate max-w-[200px]">{task?.title}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{project?.name}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                              {entry.description || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {entry.hours}h
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditModal(entry.id)}>
                                    <Edit className="size-4 mr-2" />
                                    Edit Entry
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => deleteTimeEntry(entry.id)}
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="size-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-lg font-medium text-muted-foreground">No time logged this week</p>
                    <p className="text-sm text-muted-foreground mb-4">Start tracking your work hours</p>
                    <Button onClick={() => setShowLogModal(true)}>
                      <Plus className="size-4 mr-2" />
                      Log Time
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
        <AICopilot />
      </div>

      {/* Log Time Modal */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Time</DialogTitle>
            <DialogDescription>Record time spent on a task</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task</Label>
              <Select value={selectedTask} onValueChange={setSelectedTask}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {myTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{task.key}</Badge>
                        <span className="truncate max-w-[200px]">{task.title}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours</Label>
                <Input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="2.5"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowLogModal(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleLogTime} disabled={!selectedTask || !hours}>Log Time</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Modal */}
      <Dialog open={!!editEntry} onOpenChange={(open) => !open && setEditEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>Update the logged hours</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Hours</Label>
              <Input
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="2.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What did you work on?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditEntry(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdateEntry} disabled={!hours}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
