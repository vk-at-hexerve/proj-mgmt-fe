'use client';

import React from "react"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Bug, BookOpen, Zap, ListTodo } from 'lucide-react';
import { tasks } from '@/lib/mock-data';
import type { Task, TaskPriority, TaskStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const priorityStyles: Record<TaskPriority, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-warning text-warning-foreground',
  medium: 'bg-accent text-accent-foreground',
  low: 'bg-muted text-muted-foreground',
};

const statusStyles: Record<TaskStatus, string> = {
  open: 'bg-muted text-muted-foreground',
  assigned: 'bg-accent/20 text-accent',
  'in-progress': 'bg-primary/20 text-primary',
  'pending-approval': 'bg-warning/20 text-warning-foreground',
  'on-hold': 'bg-muted text-muted-foreground',
  closed: 'bg-success/20 text-success',
};

const typeIcons: Record<Task['type'], React.ReactNode> = {
  epic: <Zap className="size-4" />,
  story: <BookOpen className="size-4" />,
  task: <ListTodo className="size-4" />,
  subtask: <ListTodo className="size-3" />,
  bug: <Bug className="size-4" />,
};

export function RecentTasks() {
  const recentTasks = tasks.slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Tasks</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            View all
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {recentTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <Checkbox
                checked={task.status === 'closed'}
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
                      task.status === 'closed' && 'line-through text-muted-foreground'
                    )}
                  >
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="secondary"
                    className={cn('text-xs px-1.5 py-0', statusStyles[task.status])}
                  >
                    {task.status.replace('-', ' ')}
                  </Badge>
                  {task.storyPoints && (
                    <span className="text-xs text-muted-foreground">
                      {task.storyPoints} pts
                    </span>
                  )}
                </div>
              </div>

              <Badge
                className={cn('text-xs shrink-0', priorityStyles[task.priority])}
              >
                {task.priority}
              </Badge>

              {task.assignee ? (
                <Avatar className="size-6 shrink-0">
                  <AvatarImage src={task.assignee.avatar || "/placeholder.svg"} alt={task.assignee.name} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="size-6 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
