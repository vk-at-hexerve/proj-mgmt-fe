'use client';

import React from "react"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Bug, BookOpen, Zap, ListTodo } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import type { Task, TaskPriority } from '@/lib/types';
import { getStatusName } from '@/lib/status-utils';
import { cn } from '@/lib/utils';
import { TaskWatchButton } from '@/components/tasks/task-watch-button';

const priorityStyles: Record<TaskPriority, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-warning text-warning-foreground',
  medium: 'bg-accent text-accent-foreground',
  low: 'bg-muted text-muted-foreground',
};


const typeIcons: Record<Task['type'], React.ReactNode> = {
  epic: <Zap className="size-4" />,
  story: <BookOpen className="size-4" />,
  task: <ListTodo className="size-4" />,
  subtask: <ListTodo className="size-3" />,
  bug: <Bug className="size-4" />,
};

export function RecentTasks() {
  const { tasks, isTaskDone, getStatusGroup, workflowStatuses } = useApp();
  const recentTasks = tasks.slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Tasks</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            View all
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-1">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
              >
                <Checkbox
                  checked={isTaskDone(task)}
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
                        isTaskDone(task) && 'line-through text-muted-foreground'
                      )}
                    >
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(() => {
                      const status = workflowStatuses.find(s => s.id === task.statusId);
                      const color = status?.color || '#6B7280';
                      return (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border-none"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {status?.name || 'Unknown'}
                        </Badge>
                      );
                    })()}                    {task.storyPoints && (
                      <span className="text-xs text-muted-foreground">
                        {task.storyPoints} pts
                      </span>
                    )}
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <TaskWatchButton taskId={task.id} size="xs" />
                </div>

                <Badge
                  className={cn('text-xs shrink-0', priorityStyles[task.priority])}
                >
                  {task.priority}
                </Badge>

                {task.assignee ? (
                  <UserAvatar user={task.assignee} size="sm" />
                ) : (
                  <div className="size-6 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ListTodo className="size-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No tasks yet</p>
              <p className="text-xs">Tasks from your active projects will appear here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
