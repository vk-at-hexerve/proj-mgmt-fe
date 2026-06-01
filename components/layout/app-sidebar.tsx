"use client";

import React from "react";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Task, Project } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  Filter,
  Check,
} from "lucide-react";
// import { currentUser as mockUser } from '@/lib/mock-data';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

const mainNav: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: <LayoutDashboard className="size-5" />,
  },
  { label: "My Tasks", href: "/tasks", icon: <ListTodo className="size-5" /> },
  {
    label: "Calendar",
    href: "/calendar",
    icon: <Calendar className="size-5" />,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <BarChart3 className="size-5" />,
  },
];

const managementNav: NavItem[] = [
  {
    label: "Hierarchy",
    href: "/hierarchy",
    icon: <Network className="size-5" />,
  },
  {
    label: "Portfolios",
    href: "/portfolios",
    icon: <Layers className="size-5" />,
  },
  { label: "Programs", href: "/programs", icon: <Target className="size-5" /> },
  { label: "Teams", href: "/teams", icon: <Users className="size-5" /> },
  {
    label: "Resources",
    href: "/resources",
    icon: <PieChart className="size-5" />,
  },
  {
    label: "Time Tracking",
    href: "/timetracking",
    icon: <Clock className="size-5" />,
  },
];

const financeNav: NavItem[] = [
  {
    label: "Clients",
    href: "/clients",
    icon: <UserCircle className="size-5" />,
  },
  {
    label: "Invoices",
    href: "/invoices",
    icon: <Receipt className="size-5" />,
  },
  {
    label: "Products",
    href: "/products",
    icon: <Package className="size-5" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="size-5" />,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const {
    setSearchOpen,
    setAiCopilotOpen,
    openModal,
    showToast,
    setCurrentProject,
    tasks: appTasks,
    projects,
    currentProject,
    currentUser,
    logoutAction,
    isMounted,
    taskFilters,
    setTaskFilters,
    customFilters,
    activeCustomFilterId,
    applyCustomFilter,
  } = useApp();

  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const assignedTaskCount = appTasks.filter(
    (task: Task) => task.assignee?.id === currentUser?.id,
  ).length;

  const activeProj = currentProject
    ? projects.find((p: Project) => p.id === currentProject) || { name: "Unknown Project", key: "UNK" }
    : { name: "All Projects", key: "ALL" };

  if (!isMounted || !currentUser) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 border-b border-sidebar-border",
            collapsed && "justify-center",
          )}
        >
          <div className="flex items-center justify-center size-9 rounded-lg bg-primary">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-sidebar-foreground truncate">
                Nexus PM
              </h1>
              <p className="text-xs text-sidebar-muted truncate">
                Agentic AI Platform
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-8 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "hidden lg:flex",
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <PanelLeft className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
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
                {projects.map((project: Project) => (
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
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => openModal("create-project")}
                >
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
                {"⌘K"}
              </kbd>
            </Button>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {/* Dashboard (First in mainNav) */}
          {mainNav.filter((i: NavItem) => i.label === "Dashboard").map((item: NavItem) => {
            const isActive = pathname === item.href;
            const NavLink = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                  collapsed && "justify-center px-2",
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

          {/* Expandable Project Menu */}
          <div className="space-y-1">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname.startsWith("/projects")
                  ? "bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
                collapsed && "justify-center px-2",
              )}
            >
              <FolderKanban className="size-5" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Project</span>
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      projectsExpanded && "rotate-180",
                    )}
                  />
                </>
              )}
            </button>

            {!collapsed && projectsExpanded && (
              <div className="mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transition-all animate-in slide-in-from-top-2 duration-300">
                <div
                  className={cn(
                    "p-1 space-y-0.5",
                    showAllProjects && "max-h-60 overflow-y-auto custom-scrollbar"
                  )}
                >
                  <button
                    onClick={() => {
                      setCurrentProject(null);
                      router.push("/projects");
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left group",
                      !currentProject && pathname === "/projects"
                        ? "bg-[#6366F1] text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                    )}
                  >
                    <Layers className={cn("size-4", !currentProject && pathname === "/projects" ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                    <span className="truncate tracking-tight font-semibold">View All Projects</span>
                  </button>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  {(showAllProjects ? projects : projects.slice(0, 3)).map((project: Project) => (<button
                    key={project.id}
                    onClick={() => {
                      setCurrentProject(project.id);
                      router.push("/projects");
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left group",
                      currentProject === project.id
                        ? "bg-[#6366F1] text-white shadow-md"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm",
                    )}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-2 py-0.5 h-6 text-[10px] font-bold font-mono shrink-0 transition-colors",
                        currentProject === project.id
                          ? "bg-white/20 border-white/30 text-white shadow-none"
                          : "bg-white border-slate-200 text-slate-700 shadow-sm group-hover:border-slate-400"
                      )}
                    >
                      {project.key}
                    </Badge>
                    <span className="truncate tracking-tight font-semibold">{project.name}</span>
                  </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 p-1.5 bg-slate-50/50">
                  {!showAllProjects && projects.length > 3 && (
                    <button
                      onClick={() => setShowAllProjects(true)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-all"
                    >
                      <Layers className="size-4 opacity-70" />
                      View All Projects
                    </button>
                  )}
                  {showAllProjects && (
                    <button
                      onClick={() => setShowAllProjects(false)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-all"
                    >
                      <ChevronDown className="size-4 rotate-180 opacity-70" />
                      Show Less
                    </button>
                  )}
                  <button
                    onClick={() => openModal("create-project")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-200/60 hover:text-slate-900 transition-all whitespace-nowrap"
                  >
                    <Plus className="size-4" />
                    Create New Project
                  </button>
                </div>
              </div>
            )}


          </div>

          {/* Project Specific - Filters */}
          {currentProject && (
            <div className="space-y-1 mt-2 mb-2">
              {(() => {
                const FilterBtn = (
                  <button
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      (filtersExpanded || activeCustomFilterId)
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <Filter className="size-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">My Filters</span>
                        <ChevronDown
                          className={cn(
                            "size-4 transition-transform duration-200",
                            filtersExpanded && "rotate-180",
                          )}
                        />
                      </>
                    )}
                  </button>
                );

                if (collapsed) {
                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>{FilterBtn}</TooltipTrigger>
                      <TooltipContent side="right">
                        <p>My Filters</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <>
                    {FilterBtn}
                    {filtersExpanded && (
                      <div className="mt-1 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden transition-all animate-in slide-in-from-top-2 duration-300">
                        <div className="p-1 space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
                          <button
                            onClick={() => applyCustomFilter(null)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left group",
                              !activeCustomFilterId
                                ? "bg-[#6366F1] text-white shadow-md"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                            )}
                          >
                            <span className="truncate tracking-tight font-semibold">All Tasks</span>
                            {!activeCustomFilterId && <Check className="size-4 ml-auto" />}
                          </button>
                          {customFilters.map(filter => (
                            <button
                              key={filter.id}
                              onClick={() => applyCustomFilter(filter.id === activeCustomFilterId ? null : filter)}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left group",
                                activeCustomFilterId === filter.id
                                  ? "bg-[#6366F1] text-white shadow-md"
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                              )}
                            >
                              <span className="truncate tracking-tight font-semibold">{filter.name}</span>
                              {activeCustomFilterId === filter.id && <Check className="size-4 ml-auto" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* Remaining Main Navigation */}
          {mainNav.filter((i: NavItem) => i.label !== "Dashboard").map((item: NavItem) => {
            const isActive = pathname === item.href;
            const NavLink = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                  collapsed && "justify-center px-2",
                )}
              >
                {item.icon}
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.label === "My Tasks" && assignedTaskCount > 0 ? (
                      <Badge
                        variant="secondary"
                        className="size-5 p-0 justify-center text-xs"
                      >
                        {assignedTaskCount}
                      </Badge>
                    ) : null}
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
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                  collapsed && "justify-center px-2",
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
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                  collapsed && "justify-center px-2",
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
              <Badge
                variant="secondary"
                className="ml-auto text-xs bg-white/20"
              >
                New
              </Badge>
            </Button>
          )}
        </div>

        {/* User Section */}
        <div
          className={cn(
            "p-3 border-t border-sidebar-border",
            collapsed && "flex justify-center",
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full gap-3 h-auto p-2 hover:bg-sidebar-accent",
                  collapsed && "w-auto p-1",
                )}
              >
                <UserAvatar user={currentUser} size="md" />
                {!collapsed && (
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-sidebar-muted truncate capitalize">
                      {currentUser.role?.replace("-", " ") || "User"}
                    </p>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={collapsed ? "center" : "end"}
              className="w-56"
            >
              <DropdownMenuItem
                className="gap-2"
                onClick={() =>
                  showToast({
                    title: "Settings",
                    description: "Settings page coming soon",
                    type: "info",
                  })
                }
              >
                <Settings className="size-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2"
                onClick={() =>
                  showToast({
                    title: "Notifications",
                    description: "Notifications panel coming soon",
                    type: "info",
                  })
                }
              >
                <Bell className="size-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 text-destructive"
                onClick={() => {
                  logoutAction();
                  showToast({ title: "Signed out", type: "success" });
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}
