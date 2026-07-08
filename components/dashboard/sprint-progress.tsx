'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, TrendingUp, Clock } from 'lucide-react';
import { useApp } from '@/lib/app-context';

export function SprintProgress() {
  const { sprints, tasks, isTaskDone } = useApp();
  const activeSprint = sprints.find((s) => s.status === 'active');
  const sprintTasks = tasks.filter((t) => t.sprintId === activeSprint?.id);
  const completedTasks = sprintTasks.filter((t) => isTaskDone(t)).length;
  const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const completedPoints = sprintTasks
    .filter((t) => isTaskDone(t))
    .reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  
  const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  
  // Calculate days remaining
  const today = new Date();
  const endDate = activeSprint ? new Date(activeSprint.endDate) : today;
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  if (!activeSprint) {
    return (
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base">Active Sprint</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-center py-12 text-muted-foreground">
            <Target className="size-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No active sprint</p>
            <p className="text-xs">Create a sprint to track your progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{activeSprint.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{activeSprint.goal}</p>
          </div>
          <Badge variant="default" className="bg-primary">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sprint Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
              <Target className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedPoints}/{totalPoints}</p>
              <p className="text-xs text-muted-foreground">Story Points</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center size-8 rounded-lg bg-accent/10 text-accent">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeSprint.velocity || 0}</p>
              <p className="text-xs text-muted-foreground">Velocity</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center size-8 rounded-lg bg-success/10 text-success">
              <Calendar className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedTasks}/{sprintTasks.length}</p>
              <p className="text-xs text-muted-foreground">Tasks Done</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center size-8 rounded-lg bg-warning/10 text-warning-foreground">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{daysRemaining}</p>
              <p className="text-xs text-muted-foreground">Days Left</p>
            </div>
          </div>
        </div>

        {/* Sprint Timeline */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="size-3.5" />
          <span>{activeSprint.startDate}</span>
          <span className="flex-1 border-t border-dashed border-muted-foreground/30" />
          <span>{activeSprint.endDate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
