'use client';

import React from "react"

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Calendar,
  BarChart3,
  Settings,
  Sparkles,
  ChevronDown,
  Plus,
  Search,
  Bell,
  Layers,
  Target,
  Users,
  Bot,
  PanelLeftClose,
  PanelLeft,
  PieChart,
  Clock,
  Network,
  UserCircle,
  Receipt,
  Package,
} from 'lucide-react';
// import { currentUser as mockUser } from '@/lib/mock-data';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="size-5" /> },
  { label: 'Projects', href: '/projects', icon: <FolderKanban className="size-5" /> },
  { label: 'My Tasks', href: '/tasks', icon: <ListTodo className="size-5" />, badge: 5 },
  { label: 'Calendar', href: '/calendar', icon: <Calendar className="size-5" /> },
  { label: 'Reports', href: '/reports', icon: <BarChart3 className="size-5" /> },
];

const managementNav: NavItem[] = [
  { label: 'Hierarchy', href: '/hierarchy', icon: <Network className="size-5" /> },
  { label: 'Portfolios', href: '/portfolios', icon: <Layers className="size-5" /> },
  { label: 'Programs', href: '/programs', icon: <Target className="size-5" /> },
  { label: 'Teams', href: '/teams', icon: <Users className="size-5" /> },
  { label: 'Resources', href: '/resources', icon: <PieChart className="size-5" /> },
  { label: 'Time Tracking', href: '/timetracking', icon: <Clock className="size-5" /> },
];

const financeNav: NavItem[] = [
  { label: 'Clients', href: '/clients', icon: <UserCircle className="size-5" /> },
  { label: 'Invoices', href: '/invoices', icon: <Receipt className="size-5" /> },
  { label: 'Products', href: '/products', icon: <Package className="size-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="size-5" /> },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { 
    setSearchOpen, 
    setAiCopilotOpen, 
    openModal, 
    showToast, 
    setCurrentProject, 
    projects, 
    currentProject, 
    currentUser,
    logoutAction
  } = useApp();
  
  if (!currentUser) return null;
  
  const activeProj = projects.find(p => p.id === currentProject) || projects[0] || { name: 'No Projects' };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Header */}
        <div className={cn('flex items-center gap-3 p-4 border-b border-sidebar-border', collapsed && 'justify-center')}>
          <div className="flex items-center justify-center size-9 rounded-lg bg-primary">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sidebar-foreground truncate">Nexus PM</h1>
              <p className="text-xs text-sidebar-muted truncate">Agentic AI Platform</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn('size-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent', collapsed && 'hidden lg:flex')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        </div>

        {/* Project Selector */}
        {!collapsed && (
          <div className="px-3 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between h-10 px-3 text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <span className="truncate">{activeProj.name}</span>
                  <ChevronDown className="size-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {projects.map((project) => (
                  <DropdownMenuItem key={project.id} className="gap-2" onClick={() => setCurrentProject(project.id)}>
                    <Badge variant="outline" className="font-mono text-xs">
                      {project.key}
                    </Badge>
                    {project.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2" onClick={() => openModal('create-project')}>
                  <Plus className="size-4" />
                  Create new project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pb-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-9 px-3 text-sidebar-muted bg-sidebar-accent/50 border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-4" />
              <span className="text-sm">Search...</span>
              <kbd className="ml-auto text-xs bg-sidebar-accent px-1.5 py-0.5 rounded">
                {'⌘K'}
              </kbd>
            </Button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            const NavLink = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent',
                  collapsed && 'justify-center px-2'
                )}
              >
                {item.icon}
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="size-5 p-0 justify-center text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return NavLink;
          })}

          {/* Management Section */}
          {!collapsed && (
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-medium text-sidebar-muted uppercase tracking-wider">
                Management
              </p>
            </div>
          )}
          {collapsed && <div className="py-2 border-t border-sidebar-border" />}

          {managementNav.map((item) => {
            const isActive = pathname === item.href;
            const NavLink = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent',
                  collapsed && 'justify-center px-2'
                )}
              >
                {item.icon}
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return NavLink;
          })}

          {/* Finance Section */}
          {!collapsed && (
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-medium text-sidebar-muted uppercase tracking-wider">
                Finance
              </p>
            </div>
          )}
          {collapsed && <div className="py-2 border-t border-sidebar-border" />}

          {financeNav.map((item) => {
            const isActive = pathname === item.href;
            const NavLink = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent',
                  collapsed && 'justify-center px-2'
                )}
              >
                {item.icon}
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{NavLink}</TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return NavLink;
          })}
        </nav>

        {/* AI Copilot Button */}
        <div className="px-3 py-2 border-t border-sidebar-border">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  size="icon"
                  onClick={() => setAiCopilotOpen(true)}
                >
                  <Bot className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>AI Copilot</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button 
              className="w-full gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
              onClick={() => setAiCopilotOpen(true)}
            >
              <Bot className="size-5" />
              AI Copilot
              <Badge variant="secondary" className="ml-auto text-xs bg-white/20">
                New
              </Badge>
            </Button>
          )}
        </div>

        {/* User Section */}
        <div className={cn('p-3 border-t border-sidebar-border', collapsed && 'flex justify-center')}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full gap-3 h-auto p-2 hover:bg-sidebar-accent',
                  collapsed && 'w-auto p-1'
                )}
              >
                <Avatar className="size-8">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback>
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-sidebar-muted truncate capitalize">
                      {currentUser.role?.replace('-', ' ') || 'User'}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={collapsed ? 'center' : 'end'} className="w-56">
              <DropdownMenuItem className="gap-2" onClick={() => showToast({ title: 'Settings', description: 'Settings page coming soon', type: 'info' })}>
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => showToast({ title: 'Notifications', description: 'Notifications panel coming soon', type: 'info' })}>
                <Bell className="size-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => {
                logoutAction();
                showToast({ title: 'Signed out', type: 'success' });
              }}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
