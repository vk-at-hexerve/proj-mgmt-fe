'use client';

import React from "react"
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Plus, Search, MessageSquare, HelpCircle, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { aiInsights } from '@/lib/mock-data';
const aiInsights: any[] = []; // Placeholder or derived from tasks

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  const router = useRouter();
  const { setSearchOpen, openModal, showToast, currentUser, logoutAction, isAuthenticated, tasks, isMounted, isTaskDone } = useApp();

  if (!isMounted) {
    return (
      <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-muted animate-pulse" />
        </div>
      </header>
    );
  }

  // Basic live insights derived from tasks
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !isTaskDone(t));
  const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'critical');

  const liveInsights = [
    ...overdueTasks.slice(0, 2).map(t => ({
      id: `overdue-${t.id}`,
      type: 'risk',
      severity: 'critical',
      title: 'Task Overdue',
      description: `Task "${t.title}" is past its due date.`,
      createdAt: 'Just now'
    })),
    ...highPriorityTasks.slice(0, 1).map(t => ({
      id: `priority-${t.id}`,
      type: 'recommendation',
      severity: 'warning',
      title: 'High Priority Task',
      description: `Review priority for "${t.title}".`,
      createdAt: '5 min ago'
    }))
  ];

  const criticalInsightsCount = liveInsights.filter((i) => i.severity === 'critical').length;
  const warningInsightsCount = liveInsights.filter((i) => i.severity === 'warning').length;

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Search */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground bg-transparent"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Quick search</span>
          <kbd className="hidden sm:inline ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
            {'⌘K'}
          </kbd>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-5" />
              {(criticalInsightsCount > 0 || warningInsightsCount > 0) && (
                <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                  {criticalInsightsCount + warningInsightsCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b border-border">
              <p className="font-medium">AI Insights & Alerts</p>
              <p className="text-xs text-muted-foreground">
                {liveInsights.length} new insights from your AI agents
              </p>
            </div>
            {liveInsights.slice(0, 3).map((insight) => (
              <DropdownMenuItem key={insight.id} className="flex-col items-start gap-1 py-3">
                <div className="flex items-center gap-2 w-full">
                  <Badge
                    variant={
                      insight.severity === 'critical'
                        ? 'destructive'
                        : insight.severity === 'warning'
                          ? 'default'
                          : 'secondary'
                    }
                    className="text-xs"
                  >
                    {insight.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {insight.createdAt}
                  </span>
                </div>
                <p className="font-medium text-sm">{insight.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {insight.description}
                </p>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              View all insights
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button variant="ghost" size="icon">
          <HelpCircle className="size-5" />
        </Button>

        {/* Feedback */}
        <Button variant="ghost" size="icon">
          <MessageSquare className="size-5" />
        </Button>

        {/* Quick Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openModal('create-task')}>New Task</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openModal('create-project')}>New Project</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openModal('create-sprint')}>New Sprint</DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => showToast({ title: 'Import feature', description: 'Jira import coming soon', type: 'info' })}>Import from Jira</DropdownMenuItem>
            <DropdownMenuItem onClick={() => showToast({ title: 'Import feature', description: 'ClickUp import coming soon', type: 'info' })}>Import from ClickUp</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {actions}

        {/* User Profile */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full size-8 p-0">
                <Avatar className="size-8">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback className="text-xs">
                    {(currentUser?.name || "User").split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="size-8">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback className="text-xs">
                    {(currentUser?.name || "User").split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openModal('user-profile')}>
                <UserIcon className="mr-2 size-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 size-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logoutAction} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 size-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/login')}>Login</Button>
            <Button size="sm" onClick={() => router.push('/signup')}>Sign Up</Button>
          </div>
        )}
      </div>
    </header>
  );
}
