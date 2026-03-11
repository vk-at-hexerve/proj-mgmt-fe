'use client';

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Task, Project, User, TaskStatus, TaskPriority } from './types';
import { tasks as initialTasks, projects as initialProjects, users as initialUsers, sprints as initialSprints } from './mock-data';
import { teams as initialTeams, programs as initialPrograms, portfolios as initialPortfolios } from './mock-data';
import type { Team, Program, Portfolio } from './mock-data';

// User Roles
export type UserRole = 'admin' | 'executive' | 'program-manager' | 'project-manager' | 'team-lead' | 'contributor' | 'viewer';

export interface UserWithRole extends User {
  systemRole: UserRole;
  permissions: string[];
}

// Role permissions mapping
export const rolePermissions: Record<UserRole, string[]> = {
  admin: ['*'], // All permissions
  executive: ['view:all', 'reports:all', 'portfolios:manage', 'programs:view', 'budgets:view'],
  'program-manager': ['view:all', 'programs:manage', 'projects:manage', 'teams:view', 'budgets:manage'],
  'project-manager': ['projects:manage', 'tasks:manage', 'teams:manage', 'sprints:manage', 'reports:view'],
  'team-lead': ['tasks:manage', 'teams:view', 'sprints:view', 'members:manage'],
  contributor: ['tasks:own', 'time:log', 'comments:add'],
  viewer: ['view:assigned'],
};

// Modal types
type ModalType = 
  | 'create-task'
  | 'edit-task'
  | 'create-project'
  | 'edit-project'
  | 'create-sprint'
  | 'task-detail'
  | 'project-detail'
  | 'create-team'
  | 'edit-team'
  | 'create-program'
  | 'edit-program'
  | 'create-portfolio'
  | 'edit-portfolio'
  | 'assign-task'
  | 'change-status'
  | 'search'
  | 'confirm-delete'
  | 'add-member'
  | 'log-time'
  | 'resource-allocation'
  | 'user-profile'
  | null;

interface ModalState {
  type: ModalType;
  data?: Record<string, unknown>;
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

// Time Entry interface
export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  date: string;
  description?: string;
  createdAt: string;
}

// Resource Allocation interface
export interface ResourceAllocation {
  id: string;
  userId: string;
  projectId: string;
  allocation: number; // percentage 0-100
  startDate: string;
  endDate?: string;
}

interface AppState {
  tasks: Task[];
  projects: Project[];
  teams: Team[];
  programs: Program[];
  portfolios: Portfolio[];
  users: User[];
  timeEntries: TimeEntry[];
  resourceAllocations: ResourceAllocation[];
  currentUser: UserWithRole;
  currentProject: string | null;
  selectedTasks: string[];
  modal: ModalState;
  toasts: Toast[];
  searchOpen: boolean;
  aiCopilotOpen: boolean;
}

interface AppContextType extends AppState {
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'key'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  assignTask: (taskId: string, userId: string | null) => void;
  selectTask: (id: string) => void;
  selectAllTasks: (ids: string[]) => void;
  clearSelectedTasks: () => void;
  bulkUpdateTaskStatus: (ids: string[], status: TaskStatus) => void;
  bulkAssignTasks: (ids: string[], userId: string) => void;
  bulkDeleteTasks: (ids: string[]) => void;
  
  // Project actions
  setCurrentProject: (id: string | null) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Team actions
  addTeam: (team: Omit<Team, 'id'>) => void;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addTeamMember: (teamId: string, userId: string) => void;
  removeTeamMember: (teamId: string, userId: string) => void;
  setTeamLead: (teamId: string, userId: string) => void;
  
  // Program actions
  addProgram: (program: Omit<Program, 'id'>) => void;
  updateProgram: (id: string, updates: Partial<Program>) => void;
  deleteProgram: (id: string) => void;
  
  // Portfolio actions
  addPortfolio: (portfolio: Omit<Portfolio, 'id'>) => void;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
  deletePortfolio: (id: string) => void;
  
  // Time tracking actions
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;
  getTaskTimeEntries: (taskId: string) => TimeEntry[];
  getUserTimeEntries: (userId: string, startDate?: string, endDate?: string) => TimeEntry[];
  
  // Resource allocation actions
  addResourceAllocation: (allocation: Omit<ResourceAllocation, 'id'>) => void;
  updateResourceAllocation: (id: string, updates: Partial<ResourceAllocation>) => void;
  deleteResourceAllocation: (id: string) => void;
  getUserAllocations: (userId: string) => ResourceAllocation[];
  getProjectAllocations: (projectId: string) => ResourceAllocation[];
  
  // Modal actions
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  // Toast actions
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  
  // UI actions
  setSearchOpen: (open: boolean) => void;
  setAiCopilotOpen: (open: boolean) => void;
  
  // Permission helpers
  hasPermission: (permission: string) => boolean;
  canManageTask: (task: Task) => boolean;
  canManageProject: (project: Project) => boolean;
  
  // Utility
  getUser: (id: string) => User | undefined;
  getProject: (id: string) => Project | undefined;
  getTask: (id: string) => Task | undefined;
  getTeam: (id: string) => Team | undefined;
  getProgram: (id: string) => Program | undefined;
  getPortfolio: (id: string) => Portfolio | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Create current user with role
const currentUserWithRole: UserWithRole = {
  ...initialUsers[0],
  systemRole: 'project-manager',
  permissions: rolePermissions['project-manager'],
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [portfolios, setPortfolios] = useState<Portfolio[]>(initialPortfolios);
  const [users] = useState<User[]>(initialUsers);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [resourceAllocations, setResourceAllocations] = useState<ResourceAllocation[]>([
    { id: 'ra-1', userId: 'user-1', projectId: 'proj-1', allocation: 60, startDate: '2026-01-01' },
    { id: 'ra-2', userId: 'user-1', projectId: 'proj-3', allocation: 40, startDate: '2026-01-01' },
    { id: 'ra-3', userId: 'user-2', projectId: 'proj-1', allocation: 100, startDate: '2026-01-01' },
    { id: 'ra-4', userId: 'user-3', projectId: 'proj-2', allocation: 80, startDate: '2026-01-01' },
    { id: 'ra-5', userId: 'user-4', projectId: 'proj-2', allocation: 50, startDate: '2026-01-01' },
    { id: 'ra-6', userId: 'user-4', projectId: 'proj-1', allocation: 50, startDate: '2026-01-01' },
    { id: 'ra-7', userId: 'user-5', projectId: 'proj-1', allocation: 100, startDate: '2026-01-01' },
  ]);
  const [currentUser] = useState<UserWithRole>(currentUserWithRole);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);

  // Task counter for generating keys
  const [taskCounter, setTaskCounter] = useState(initialTasks.length + 1);

  // Toast action - defined first since other functions use it
  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // Permission helpers
  const hasPermission = useCallback((permission: string) => {
    if (currentUser.permissions.includes('*')) return true;
    return currentUser.permissions.includes(permission);
  }, [currentUser.permissions]);

  const canManageTask = useCallback((task: Task) => {
    if (hasPermission('tasks:manage')) return true;
    if (hasPermission('tasks:own') && (task.assignee?.id === currentUser.id || task.reporter.id === currentUser.id)) return true;
    return false;
  }, [hasPermission, currentUser.id]);

  const canManageProject = useCallback((project: Project) => {
    if (hasPermission('projects:manage')) return true;
    if (project.owner.id === currentUser.id) return true;
    return false;
  }, [hasPermission, currentUser.id]);

  // Task actions
  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'key'>) => {
    const project = projects.find(p => p.id === task.projectId);
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      key: `${project?.key || 'NXS'}-${100 + taskCounter}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setTaskCounter(prev => prev + 1);
    showToast({ title: 'Task created', description: `${newTask.key} has been created`, type: 'success' });
  }, [projects, taskCounter, showToast]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
    ));
    showToast({ title: 'Task updated', type: 'success' });
  }, [showToast]);

  const deleteTask = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast({ title: 'Task deleted', description: task?.key, type: 'success' });
  }, [tasks, showToast]);

  const updateTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, status, updatedAt: new Date().toISOString() } : task
    ));
    showToast({ title: 'Status updated', type: 'success' });
  }, [showToast]);

  const assignTask = useCallback((taskId: string, userId: string | null) => {
    const user = userId ? users.find(u => u.id === userId) : null;
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { 
        ...task, 
        assignee: user || undefined,
        status: user && task.status === 'open' ? 'assigned' : task.status,
        updatedAt: new Date().toISOString() 
      } : task
    ));
    showToast({ 
      title: user ? 'Task assigned' : 'Task unassigned', 
      description: user ? `Assigned to ${user.name}` : undefined,
      type: 'success' 
    });
  }, [users, showToast]);

  const selectTask = useCallback((id: string) => {
    setSelectedTasks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  }, []);

  const selectAllTasks = useCallback((ids: string[]) => {
    setSelectedTasks(ids);
  }, []);

  const clearSelectedTasks = useCallback(() => {
    setSelectedTasks([]);
  }, []);

  const bulkUpdateTaskStatus = useCallback((ids: string[], status: TaskStatus) => {
    setTasks(prev => prev.map(task => 
      ids.includes(task.id) ? { ...task, status, updatedAt: new Date().toISOString() } : task
    ));
    setSelectedTasks([]);
    showToast({ title: `${ids.length} tasks updated`, type: 'success' });
  }, [showToast]);

  const bulkAssignTasks = useCallback((ids: string[], userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setTasks(prev => prev.map(task => 
      ids.includes(task.id) ? { 
        ...task, 
        assignee: user,
        status: task.status === 'open' ? 'assigned' : task.status,
        updatedAt: new Date().toISOString() 
      } : task
    ));
    setSelectedTasks([]);
    showToast({ title: `${ids.length} tasks assigned`, description: `to ${user.name}`, type: 'success' });
  }, [users, showToast]);

  const bulkDeleteTasks = useCallback((ids: string[]) => {
    setTasks(prev => prev.filter(t => !ids.includes(t.id)));
    setSelectedTasks([]);
    showToast({ title: `${ids.length} tasks deleted`, type: 'success' });
  }, [showToast]);

  // Project actions
  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => [...prev, newProject]);
    showToast({ title: 'Project created', description: newProject.name, type: 'success' });
  }, [showToast]);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...updates } : project
    ));
    showToast({ title: 'Project updated', type: 'success' });
  }, [showToast]);

  const deleteProject = useCallback((id: string) => {
    const project = projects.find(p => p.id === id);
    setProjects(prev => prev.filter(p => p.id !== id));
    showToast({ title: 'Project deleted', description: project?.name, type: 'success' });
  }, [projects, showToast]);

  // Team actions
  const addTeam = useCallback((team: Omit<Team, 'id'>) => {
    const newTeam: Team = {
      ...team,
      id: `team-${Date.now()}`,
    };
    setTeams(prev => [...prev, newTeam]);
    showToast({ title: 'Team created', description: newTeam.name, type: 'success' });
  }, [showToast]);

  const updateTeam = useCallback((id: string, updates: Partial<Team>) => {
    setTeams(prev => prev.map(team => 
      team.id === id ? { ...team, ...updates } : team
    ));
    showToast({ title: 'Team updated', type: 'success' });
  }, [showToast]);

  const deleteTeam = useCallback((id: string) => {
    const team = teams.find(t => t.id === id);
    setTeams(prev => prev.filter(t => t.id !== id));
    showToast({ title: 'Team deleted', description: team?.name, type: 'success' });
  }, [teams, showToast]);

  const addTeamMember = useCallback((teamId: string, userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setTeams(prev => prev.map(team => 
      team.id === teamId && !team.members.some(m => m.id === userId)
        ? { ...team, members: [...team.members, user] }
        : team
    ));
    showToast({ title: 'Member added', description: user.name, type: 'success' });
  }, [users, showToast]);

  const removeTeamMember = useCallback((teamId: string, userId: string) => {
    const user = users.find(u => u.id === userId);
    setTeams(prev => prev.map(team => 
      team.id === teamId
        ? { ...team, members: team.members.filter(m => m.id !== userId) }
        : team
    ));
    showToast({ title: 'Member removed', description: user?.name, type: 'success' });
  }, [users, showToast]);

  const setTeamLead = useCallback((teamId: string, userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setTeams(prev => prev.map(team => 
      team.id === teamId ? { ...team, lead: user } : team
    ));
    showToast({ title: 'Team lead updated', description: user.name, type: 'success' });
  }, [users, showToast]);

  // Program actions
  const addProgram = useCallback((program: Omit<Program, 'id'>) => {
    const newProgram: Program = {
      ...program,
      id: `prog-${Date.now()}`,
    };
    setPrograms(prev => [...prev, newProgram]);
    showToast({ title: 'Program created', description: newProgram.name, type: 'success' });
  }, [showToast]);

  const updateProgram = useCallback((id: string, updates: Partial<Program>) => {
    setPrograms(prev => prev.map(program => 
      program.id === id ? { ...program, ...updates } : program
    ));
    showToast({ title: 'Program updated', type: 'success' });
  }, [showToast]);

  const deleteProgram = useCallback((id: string) => {
    const program = programs.find(p => p.id === id);
    setPrograms(prev => prev.filter(p => p.id !== id));
    showToast({ title: 'Program deleted', description: program?.name, type: 'success' });
  }, [programs, showToast]);

  // Portfolio actions
  const addPortfolio = useCallback((portfolio: Omit<Portfolio, 'id'>) => {
    const newPortfolio: Portfolio = {
      ...portfolio,
      id: `port-${Date.now()}`,
    };
    setPortfolios(prev => [...prev, newPortfolio]);
    showToast({ title: 'Portfolio created', description: newPortfolio.name, type: 'success' });
  }, [showToast]);

  const updatePortfolio = useCallback((id: string, updates: Partial<Portfolio>) => {
    setPortfolios(prev => prev.map(portfolio => 
      portfolio.id === id ? { ...portfolio, ...updates } : portfolio
    ));
    showToast({ title: 'Portfolio updated', type: 'success' });
  }, [showToast]);

  const deletePortfolio = useCallback((id: string) => {
    const portfolio = portfolios.find(p => p.id === id);
    setPortfolios(prev => prev.filter(p => p.id !== id));
    showToast({ title: 'Portfolio deleted', description: portfolio?.name, type: 'success' });
  }, [portfolios, showToast]);

  // Time tracking actions
  const addTimeEntry = useCallback((entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: `time-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTimeEntries(prev => [...prev, newEntry]);
    showToast({ title: 'Time logged', description: `${entry.hours}h logged`, type: 'success' });
  }, [showToast]);

  const updateTimeEntry = useCallback((id: string, updates: Partial<TimeEntry>) => {
    setTimeEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
    showToast({ title: 'Time entry updated', type: 'success' });
  }, [showToast]);

  const deleteTimeEntry = useCallback((id: string) => {
    setTimeEntries(prev => prev.filter(e => e.id !== id));
    showToast({ title: 'Time entry deleted', type: 'success' });
  }, [showToast]);

  const getTaskTimeEntries = useCallback((taskId: string) => {
    return timeEntries.filter(e => e.taskId === taskId);
  }, [timeEntries]);

  const getUserTimeEntries = useCallback((userId: string, startDate?: string, endDate?: string) => {
    return timeEntries.filter(e => {
      if (e.userId !== userId) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }, [timeEntries]);

  // Resource allocation actions
  const addResourceAllocation = useCallback((allocation: Omit<ResourceAllocation, 'id'>) => {
    const newAllocation: ResourceAllocation = {
      ...allocation,
      id: `ra-${Date.now()}`,
    };
    setResourceAllocations(prev => [...prev, newAllocation]);
    showToast({ title: 'Resource allocated', type: 'success' });
  }, [showToast]);

  const updateResourceAllocation = useCallback((id: string, updates: Partial<ResourceAllocation>) => {
    setResourceAllocations(prev => prev.map(allocation => 
      allocation.id === id ? { ...allocation, ...updates } : allocation
    ));
    showToast({ title: 'Allocation updated', type: 'success' });
  }, [showToast]);

  const deleteResourceAllocation = useCallback((id: string) => {
    setResourceAllocations(prev => prev.filter(a => a.id !== id));
    showToast({ title: 'Allocation removed', type: 'success' });
  }, [showToast]);

  const getUserAllocations = useCallback((userId: string) => {
    return resourceAllocations.filter(a => a.userId === userId);
  }, [resourceAllocations]);

  const getProjectAllocations = useCallback((projectId: string) => {
    return resourceAllocations.filter(a => a.projectId === projectId);
  }, [resourceAllocations]);

  // Modal actions
  const openModal = useCallback((type: ModalType, data?: Record<string, unknown>) => {
    setModal({ type, data });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ type: null });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Utility functions
  const getUser = useCallback((id: string) => users.find(u => u.id === id), [users]);
  const getProject = useCallback((id: string) => projects.find(p => p.id === id), [projects]);
  const getTask = useCallback((id: string) => tasks.find(t => t.id === id), [tasks]);
  const getTeam = useCallback((id: string) => teams.find(t => t.id === id), [teams]);
  const getProgram = useCallback((id: string) => programs.find(p => p.id === id), [programs]);
  const getPortfolio = useCallback((id: string) => portfolios.find(p => p.id === id), [portfolios]);

  const value: AppContextType = {
    tasks,
    projects,
    teams,
    programs,
    portfolios,
    users,
    timeEntries,
    resourceAllocations,
    currentUser,
    currentProject,
    selectedTasks,
    modal,
    toasts,
    searchOpen,
    aiCopilotOpen,
    // Task actions
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTask,
    selectTask,
    selectAllTasks,
    clearSelectedTasks,
    bulkUpdateTaskStatus,
    bulkAssignTasks,
    bulkDeleteTasks,
    // Project actions
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    // Team actions
    addTeam,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    setTeamLead,
    // Program actions
    addProgram,
    updateProgram,
    deleteProgram,
    // Portfolio actions
    addPortfolio,
    updatePortfolio,
    deletePortfolio,
    // Time tracking actions
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getTaskTimeEntries,
    getUserTimeEntries,
    // Resource allocation actions
    addResourceAllocation,
    updateResourceAllocation,
    deleteResourceAllocation,
    getUserAllocations,
    getProjectAllocations,
    // Modal actions
    openModal,
    closeModal,
    // Toast actions
    showToast,
    dismissToast,
    // UI actions
    setSearchOpen,
    setAiCopilotOpen,
    // Permission helpers
    hasPermission,
    canManageTask,
    canManageProject,
    // Utility
    getUser,
    getProject,
    getTask,
    getTeam,
    getProgram,
    getPortfolio,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
