'use client';

import React from "react"
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { PermissionGate } from '@/lib/permission-guard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Plus, Search, MessageSquare, HelpCircle, LogOut, User as UserIcon, Settings, ChevronDown } from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
const aiInsights: any[] = []; // Placeholder or derived from tasks

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppHeader({ title, subtitle, actions }: AppHeaderProps) {
  const router = useRouter();
  const {
    setSearchOpen,
    openModal,
    showToast,
    currentUser,
    logoutAction,
    isAuthenticated,
    tasks,
    isMounted,
    isTaskDone,
    projects,
    currentProject,
    setCurrentProject
  } = useApp();

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

  const activeProj = projects.find(p => p.id === currentProject || p.name === title);
  const isProjectPage = activeProj && (title === activeProj.name || title === `Project - ${activeProj.name}`);

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {isProjectPage ? (
          <div className="flex flex-col">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 text-xl font-semibold text-foreground hover:opacity-80 transition-opacity focus:outline-none text-left">
                  <span>Project - {activeProj.name}</span>
                  <ChevronDown className="size-4 text-muted-foreground mt-1" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 z-50">
                {projects.map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    className="gap-2"
                    onClick={() => {
                      setCurrentProject(project.id);
                      router.push("/projects");
                    }}
                  >
                    <Badge variant="outline" className="font-mono text-xs">
                      {project.key}
                    </Badge>
                    {project.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <PermissionGate permission="projects:create">
                  <DropdownMenuItem
                    className="gap-2"
                    onClick={() => openModal("create-project")}
                  >
                    <Plus className="size-4" />
                    Create new project
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        )}
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



        {/* Quick Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1">
              <Plus className="size-4" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <PermissionGate permission="tasks:create">
              <DropdownMenuItem onClick={() => openModal('create-task')}>New Task</DropdownMenuItem>
            </PermissionGate>
            <PermissionGate permission="projects:create">
              <DropdownMenuItem onClick={() => openModal('create-project')}>New Project</DropdownMenuItem>
            </PermissionGate>
            <PermissionGate permission="sprints:create">
              <DropdownMenuItem onClick={() => openModal('create-sprint')}>New Sprint</DropdownMenuItem>
            </PermissionGate>

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
                <UserAvatar user={currentUser} size="md" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <UserAvatar user={currentUser} size="md" />
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
