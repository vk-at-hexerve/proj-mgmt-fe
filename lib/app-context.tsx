"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Task,
  Project,
  User,
  TaskPriority,
  Team,
  Program,
  Portfolio,
  Sprint,
  Client,
  UserRole,
  TimeEntry,
  ResourceAllocation,
  WorkflowStatus,
  WorkflowGroupKey,
  TaskFilters,
  TaskSort,
  CustomFilter,
  RoleAssignment,
} from "./types";
import { GROUP_PROGRESS_MAP } from "./status-utils";
import { applyTaskFilters } from "./filter-utils";

export type { TimeEntry, ResourceAllocation };

// User Roles & Permissions
export interface UserWithRole extends User {
  systemRole: string;
  permissions: string[];
  roles?: RoleAssignment[];
}

export const rolePermissions: Record<UserRole, string[]> = {
  "super-admin": ["*"],
  "org-admin": ["*"],
  "portfolio-manager": [
    "view:all",
    "reports:all",
    "portfolios:manage",
    "programs:view",
    "budgets:view",
  ],
  "program-manager": [
    "view:all",
    "programs:manage",
    "projects:manage",
    "teams:view",
    "budgets:manage",
  ],
  "project-manager": [
    "projects:manage",
    "tasks:manage",
    "teams:manage",
    "sprints:manage",
    "reports:view",
  ],
  "team-lead": ["tasks:manage", "teams:view", "sprints:view", "members:manage"],
  contributor: ["tasks:own", "time:log", "comments:add"],
  viewer: ["view:assigned"],
};

// Modal types
export type ModalType =
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
  | 'link-task'
  | 'client-detail'
  | 'create-user'
  | 'status-settings'
  | null;

interface ModalState {
  type: ModalType;
  data?: Record<string, unknown>;
}

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "warning" | "info";
}


interface AppState {
  tasks: Task[];
  projects: Project[];
  teams: Team[];
  programs: Program[];
  portfolios: Portfolio[];
  clients: Client[];
  users: User[];
  timeEntries: TimeEntry[];
  resourceAllocations: ResourceAllocation[];
  sprints: Sprint[];
  workflowStatuses: WorkflowStatus[];
  currentUser: UserWithRole;
  currentProject: string | null;
  selectedTasks: string[];
  modal: ModalState;
  toasts: Toast[];
  searchOpen: boolean;
  aiCopilotOpen: boolean;
  isAuthenticated: boolean;
  token: string | null;
  taskFilters: TaskFilters;
  taskSort: TaskSort;
  customFilters: CustomFilter[];
  activeCustomFilterId: string | null;
}

interface AppContextType extends AppState {
  setTaskFilters: (filters: React.SetStateAction<TaskFilters>) => void;
  setTaskSort: (sort: React.SetStateAction<TaskSort>) => void;
  getFilteredTasks: (projectId: string) => Task[];
  
  // Custom Filter actions
  addCustomFilter: (projectId: string, name: string, filters: TaskFilters, sort: TaskSort) => Promise<void>;
  updateCustomFilter: (id: string, updates: Partial<CustomFilter>) => Promise<void>;
  deleteCustomFilter: (id: string) => Promise<void>;
  applyCustomFilter: (filter: CustomFilter | null) => void;

  // Task actions
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "key">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, statusId: string) => Promise<void>;
  assignTask: (taskId: string, userId: string | null) => Promise<void>;
  selectTask: (id: string) => void;
  selectAllTasks: (ids: string[]) => void;
  clearSelectedTasks: () => void;
  bulkUpdateTaskStatus: (ids: string[], statusId: string) => Promise<void>;
  bulkAssignTasks: (ids: string[], userId: string) => Promise<void>;
  bulkDeleteTasks: (ids: string[]) => Promise<void>;

  // Watcher actions
  toggleWatchTask: (taskId: string) => Promise<void>;
  getTaskWatcherCount: (taskId: string) => number;
  isWatchingTask: (taskId: string) => boolean;

  // Workflow status actions
  addWorkflowStatus: (projectId: string, data: Partial<WorkflowStatus>) => Promise<void>;
  updateWorkflowStatus: (statusId: string, updates: Partial<WorkflowStatus>) => Promise<void>;
  deleteWorkflowStatus: (statusId: string, moveToStatusId: string) => Promise<void>;
  reorderStatuses: (projectId: string, items: { id: string; position: number; groupKey?: WorkflowGroupKey }[]) => Promise<void>;

  // Workflow status helpers
  getProjectStatuses: (projectId: string) => WorkflowStatus[];
  getStatusGroup: (statusId: string) => WorkflowGroupKey | undefined;
  isTaskDone: (task: Task) => boolean;
  isTaskOverdue: (task: Task) => boolean;

  // Project actions
  setCurrentProject: (id: string | null) => void;
  addProject: (project: Omit<Project, "id" | "createdAt"> & { customStatuses?: any[] }) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Team actions
  addTeam: (team: Omit<Team, "id">) => Promise<Team>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addTeamMember: (teamId: string, userId: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;
  setTeamLead: (teamId: string, userId: string) => Promise<void>;

  // User actions
  addUser: (user: { name: string; email: string; password: string; role?: string }) => Promise<User>;

  // Program actions
  addProgram: (program: Omit<Program, "id">) => Promise<Program>;
  updateProgram: (id: string, updates: Partial<Program>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;

  // Portfolio actions
  addPortfolio: (portfolio: Omit<Portfolio, "id">) => Promise<Portfolio>;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;

  // Client actions
  addClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Sprint actions
  addSprint: (sprint: Omit<Sprint, "id">, taskIds?: string[]) => Promise<void>;
  updateSprint: (id: string, updates: Partial<Sprint>) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;

  // Time tracking actions
  addTimeEntry: (entry: Omit<TimeEntry, "id" | "createdAt">) => Promise<void>;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;
  getTaskTimeEntries: (taskId: string) => TimeEntry[];
  getUserTimeEntries: (userId: string, startDate?: string, endDate?: string) => TimeEntry[];

  // Activity actions
  getTaskActivities: (taskId: string) => Promise<TimeEntry[]>;

  // Resource allocation actions
  addResourceAllocation: (allocation: Omit<ResourceAllocation, "id">) => void;
  updateResourceAllocation: (id: string, updates: Partial<ResourceAllocation>) => void;
  deleteResourceAllocation: (id: string) => void;
  getUserAllocations: (userId: string) => ResourceAllocation[];
  getProjectAllocations: (projectId: string) => ResourceAllocation[];

  // Modal actions
  openModal: (type: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Toast actions
  showToast: (toast: Omit<Toast, "id">) => void;
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
  getSprint: (id: string) => Sprint | undefined;

  // Auth actions
  loginAction: (email: string, password: string) => Promise<void>;
  signupAction: (name: string, email: string, password: string) => Promise<void>;
  logoutAction: () => void;
  isMounted: boolean;
  isAuthInitialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [resourceAllocations, setResourceAllocations] = useState<ResourceAllocation[]>([]);
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatus[]>([]);
  const [currentUser, setCurrentUser] = useState<UserWithRole>({
    id: "loading",
    name: "Loading...",
    email: "",
    role: "viewer" as UserRole,
    systemRole: "viewer",
    permissions: rolePermissions["viewer"],
    roles: [],
  });
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthInitialized, setIsAuthInitialized] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({});
  const [taskSort, setTaskSort] = useState<TaskSort>({ field: 'title', direction: 'asc' });
  const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);
  const [activeCustomFilterId, setActiveCustomFilterId] = useState<string | null>(null);

  // Toast action - defined early so other actions can use it
  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auth actions
  const loginAction = useCallback(async (email: string, password: string) => {
    try {
      const { login: authLogin } = await import("./auth");
      const response = await authLogin(email, password);
      localStorage.setItem("auth_token", response.access_token);
      setToken(response.access_token);
      setIsAuthenticated(true);
      showToast({ title: "Logged in successfully", type: "success" });
      window.location.href = "/";
    } catch (error: any) {
      showToast({
        title: "Login failed",
        description: error.message,
        type: "error",
      });
      throw error;
    }
  }, [showToast]);

  const signupAction = useCallback(async (name: string, email: string, password: string) => {
    try {
      const { signup: authSignup } = await import("./auth");
      await authSignup({ name, email, password });
      showToast({
        title: "Account created",
        description: "Please login to continue",
        type: "success",
      });
    } catch (error: any) {
      showToast({
        title: "Signup failed",
        description: error.message,
        type: "error",
      });
      throw error;
    }
  }, [showToast]);

  const logoutAction = useCallback(() => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  }, []);

  // Initialization
  React.useEffect(() => {
    setIsMounted(true);
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setIsAuthInitialized(true);
  }, []);

  // Data loading
  React.useEffect(() => {
    if (!isMounted || !token) return;

    const loadData = async () => {
      try {
        const {
          fetchAPI,
          mapBackendProject,
          mapBackendTask,
          mapBackendTeam,
          mapBackendTimeEntry,
          mapBackendPortfolio,
          mapBackendProgram,
          mapBackendSprint,
          mapBackendClient,
          mapBackendWorkflowStatus,
          getMyPermissions,
        } = await import("./api");

        const [
          projectsData,
          tasksData,
          teamsData,
          timeEntriesData,
          portfoliosData,
          programsData,
          clientsData,
          usersData,
          meData,
          sprintsData,
          myPermissions,
        ] = await Promise.all([
          fetchAPI("/projects").catch(() => []),
          fetchAPI("/tasks").catch(() => []),
          fetchAPI("/teams").catch(() => []),
          fetchAPI("/time-entries").catch(() => []),
          fetchAPI("/portfolios").catch(() => []),
          fetchAPI("/programs").catch(() => []),
          fetchAPI("/clients").catch(() => []),
          fetchAPI("/users").catch(() => []),
          fetchAPI("/users/me").catch(() => null),
          fetchAPI("/sprints").catch(() => []),
          getMyPermissions().catch(() => null),
        ]);

        const mappedProjects = Array.isArray(projectsData) ? projectsData.map(mapBackendProject) : [];
        if (mappedProjects.length) setProjects(mappedProjects);
        if (Array.isArray(tasksData)) setTasks(tasksData.map(mapBackendTask));
        if (Array.isArray(teamsData)) setTeams(teamsData.map(mapBackendTeam));
        if (Array.isArray(timeEntriesData)) setTimeEntries(timeEntriesData.map(mapBackendTimeEntry));
        if (Array.isArray(portfoliosData)) setPortfolios(portfoliosData.map(mapBackendPortfolio));
        if (Array.isArray(programsData)) setPrograms(programsData.map(mapBackendProgram));
        if (Array.isArray(clientsData)) setClients(clientsData.map(mapBackendClient));
        if (Array.isArray(usersData)) setUsers(usersData);
        if (Array.isArray(sprintsData)) setSprints(sprintsData.map(mapBackendSprint));

        // Load workflow statuses for all projects
        if (mappedProjects.length) {
          const allStatuses: WorkflowStatus[] = [];
          const statusPromises = mappedProjects.map((p) =>
            fetchAPI(`/projects/${p.id}/statuses`).catch(() => [])
          );
          const statusResults = await Promise.all(statusPromises);
          statusResults.forEach((statuses) => {
            if (Array.isArray(statuses)) {
              allStatuses.push(...statuses.map(mapBackendWorkflowStatus));
            }
          });
          setWorkflowStatuses(allStatuses);
        }

        if (meData) {
          setCurrentUser({
            ...meData,
            systemRole: meData.role || "project-manager",
            permissions: myPermissions?.permissions || rolePermissions[(meData.role as UserRole) || "project-manager"] || rolePermissions["project-manager"],
            roles: myPermissions?.roles || [],
          });
        }
      } catch (error) {
        console.error("Failed to load app data:", error);
      }
    };

    loadData();
  }, [isMounted, token]);

  // Load Custom Filters
  React.useEffect(() => {
    if (!currentProject || !isMounted || !token) return;
    const fetchCustomFilters = async () => {
      try {
        const { fetchAPI, mapBackendCustomFilter } = await import("./api");
        const data = await fetchAPI(`/projects/${currentProject}/custom-filters`);
        if (Array.isArray(data)) {
          setCustomFilters(data.map(mapBackendCustomFilter));
        }
      } catch (error) {
        console.error("Failed to fetch custom filters:", error);
      }
    };
    fetchCustomFilters();
  }, [currentProject, isMounted, token]);

  // Permission helpers
  const hasPermission = useCallback((permission: string) => {
    if (currentUser.permissions.includes("*")) return true;
    return currentUser.permissions.includes(permission);
  }, [currentUser.permissions]);

  const canManageTask = useCallback((task: Task) => {
    if (hasPermission("tasks:manage")) return true;
    if (hasPermission("tasks:own") && (task.assignee?.id === currentUser.id || task.reporter.id === currentUser.id)) return true;
    return false;
  }, [hasPermission, currentUser.id]);

  const canManageProject = useCallback((project: Project) => {
    if (hasPermission("projects:manage")) return true;
    if (project.owner.id === currentUser.id) return true;
    return false;
  }, [hasPermission, currentUser.id]);

  // Task actions
  const addTask = useCallback(async (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "key">) => {
    const project = projects.find((p) => p.id === task.projectId);
    const tempId = `task-temp-${Date.now()}`;
    const nextTaskNumber = (project?.taskCount || 0) + 1;
    const newTask: Task = {
      ...task,
      id: tempId,
      key: `${project?.key || "TSK"}-${nextTaskNumber}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    if (project) {
      setProjects((prev) => prev.map((p) => p.id === project.id ? { ...p, taskCount: nextTaskNumber } : p));
    }

    try {
      const { fetchAPI, mapBackendTask } = await import("./api");
      const savedTask = await fetchAPI("/tasks", {
        method: "POST",
        body: JSON.stringify({
          title: task.title,
          description: task.description || "",
          project_id: task.projectId,
          story_points: task.storyPoints || 0,
          start_date: task.startDate || null,
          due_date: task.dueDate || null,
          sprint_id: task.sprintId || null,
          status_id: task.statusId || null,
          priority: task.priority === 'critical' ? 'URGENT' : task.priority.toUpperCase(),
          assignee_id: task.assignee?.id || null,
          label_ids: task.tags ? task.tags.map(t => t.id) : undefined,
          group_id: (task as any).group || null,
          is_milestone: task.isMilestone || false,
          task_type: task.type,
          parent_id: task.parentId || null,
          lead_source: task.leadSource || null,
          lead_temperature: task.leadTemperature || null,
          lead_score: task.leadScore !== undefined ? task.leadScore : null,
          deal_value: task.dealValue !== undefined ? task.dealValue : null,
          deal_probability: task.dealProbability !== undefined ? task.dealProbability : null,
          last_contact_date: task.lastContactDate || null,
          next_followup_date: task.nextFollowUpDate || null,
        }),
      });

      setTasks((prev) => prev.map((t) => (t.id === tempId ? mapBackendTask(savedTask) : t)));
      showToast({ title: "Task created", description: savedTask.task_code || savedTask.title, type: "success" });
    } catch (error: any) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId));
      showToast({ title: "Task creation failed", description: error.message, type: "error" });
    }
  }, [projects, showToast]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task));

    try {
      const { fetchAPI } = await import("./api");
      const backendPayload: any = {};
      if (updates.title !== undefined) backendPayload.title = updates.title;
      if (updates.description !== undefined) backendPayload.description = updates.description;
      if (updates.statusId) backendPayload.status_id = updates.statusId;
      if (updates.priority) backendPayload.priority = updates.priority === 'critical' ? 'URGENT' : updates.priority.toUpperCase();
      if (updates.storyPoints !== undefined) backendPayload.story_points = updates.storyPoints;
      if (updates.startDate !== undefined) backendPayload.start_date = updates.startDate;
      if (updates.dueDate !== undefined) backendPayload.due_date = updates.dueDate;
      if (updates.assignee !== undefined) backendPayload.assignee_id = updates.assignee?.id || null;
      if (updates.sprintId !== undefined) backendPayload.sprint_id = updates.sprintId || null;
      if ((updates as any).tags !== undefined) backendPayload.label_ids = (updates as any).tags.map((t: any) => t.id);
      if ((updates as any).group !== undefined) backendPayload.group_id = (updates as any).group || null;
      if (updates.isMilestone !== undefined) backendPayload.is_milestone = updates.isMilestone;
      if (updates.type !== undefined) backendPayload.task_type = updates.type;
      if (updates.parentId !== undefined) backendPayload.parent_id = updates.parentId;

      await fetchAPI(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(backendPayload),
      });
      showToast({ title: "Task updated", type: "success" });
    } catch (err) {
      showToast({ title: "Task update failed", type: "error" });
    }
  }, [showToast]);

  const deleteTask = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/tasks/${id}`, { method: "DELETE" });
      showToast({ title: "Task deleted", description: task?.key, type: "success" });
    } catch (err) {
      if (task) setTasks((prev) => [...prev, task]);
      showToast({ title: "Delete failed", type: "error" });
    }
  }, [tasks, showToast]);

  const updateTaskStatus = useCallback(async (id: string, statusId: string) => {
    setTasks((prev) => prev.map((task) => task.id === id ? { ...task, statusId, updatedAt: new Date().toISOString() } : task));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status_id: statusId }) });
      showToast({ title: "Status updated", type: "success" });
    } catch (err) {
      showToast({ title: "Status update failed", type: "error" });
    }
  }, [showToast]);

  const assignTask = useCallback(async (taskId: string, userId: string | null) => {
    const user = userId ? users.find((u) => u.id === userId) : null;
    setTasks((prev) => prev.map((task) => task.id === taskId ? { ...task, assignee: user || undefined, updatedAt: new Date().toISOString() } : task));

    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ assignee_id: userId }) });
      showToast({ title: user ? "Task assigned" : "Task unassigned", description: user ? `Assigned to ${user.name}` : undefined, type: "success" });
    } catch (err) {
      showToast({ title: "Assignment failed", type: "error" });
    }
  }, [users, showToast]);

  const selectTask = useCallback((id: string) => {
    setSelectedTasks((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  }, []);

  const selectAllTasks = useCallback((ids: string[]) => setSelectedTasks(ids), []);
  const clearSelectedTasks = useCallback(() => setSelectedTasks([]), []);

  const bulkUpdateTaskStatus = useCallback(async (ids: string[], statusId: string) => {
    setTasks((prev) => prev.map((task) => ids.includes(task.id) ? { ...task, statusId, updatedAt: new Date().toISOString() } : task));
    setSelectedTasks([]);
    try {
      const { fetchAPI } = await import("./api");
      await Promise.all(ids.map(id => fetchAPI(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status_id: statusId }) })));
      showToast({ title: `${ids.length} tasks updated`, type: "success" });
    } catch (err) {
      showToast({ title: "Bulk update failed", type: "error" });
    }
  }, [showToast]);

  const bulkAssignTasks = useCallback(async (ids: string[], userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setTasks((prev) => prev.map((task) => ids.includes(task.id) ? { ...task, assignee: user, updatedAt: new Date().toISOString() } : task));
    setSelectedTasks([]);
    try {
      const { fetchAPI } = await import("./api");
      await Promise.all(ids.map(id => fetchAPI(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ assignee_id: userId }) })));
      showToast({ title: `${ids.length} tasks assigned`, description: `to ${user.name}`, type: "success" });
    } catch (err) {
      showToast({ title: "Bulk assignment failed", type: "error" });
    }
  }, [users, showToast]);

  const bulkDeleteTasks = useCallback(async (ids: string[]) => {
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
    setSelectedTasks([]);
    try {
      const { fetchAPI } = await import("./api");
      await Promise.all(ids.map(id => fetchAPI(`/tasks/${id}`, { method: "DELETE" })));
      showToast({ title: `${ids.length} tasks deleted`, type: "success" });
    } catch (err) {
      showToast({ title: "Bulk delete failed", type: "error" });
    }
  }, [showToast]);

  const toggleWatchTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const wasWatching = task.isWatching;
    const me = { id: currentUser.id, name: currentUser.name, email: currentUser.email };
    
    // Optimistic update: update isWatching, watcherCount AND watchers array
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const prevWatchers = t.watchers || [];
      const updatedWatchers = wasWatching
        ? prevWatchers.filter(w => w.id !== me.id)
        : prevWatchers.some(w => w.id === me.id) ? prevWatchers : [...prevWatchers, me];
      return { 
        ...t, 
        isWatching: !wasWatching, 
        watcherCount: (t.watcherCount || 0) + (wasWatching ? -1 : 1),
        watchers: updatedWatchers,
      };
    }));

    try {
      const { watchTask, unwatchTask } = await import("./api");
      if (wasWatching) {
        await unwatchTask(taskId);
      } else {
        await watchTask(taskId);
      }
      showToast({ 
        title: wasWatching ? "Stopped watching" : "Now watching", 
        description: task.key,
        type: "success" 
      });
    } catch (err) {
      // Rollback on failure
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, isWatching: wasWatching, watcherCount: task.watcherCount, watchers: task.watchers } 
          : t
      ));
      showToast({ title: "Watch update failed", type: "error" });
    }
  }, [tasks, currentUser, showToast]);

  const getTaskWatcherCount = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.watcherCount || 0;
  }, [tasks]);

  const isWatchingTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.isWatching || false;
  }, [tasks]);

  // ── Workflow Status actions ──────────────────────────────────────────

  const addWorkflowStatus = useCallback(async (projectId: string, data: Partial<WorkflowStatus>) => {
    try {
      const { fetchAPI, mapBackendWorkflowStatus } = await import("./api");
      const saved = await fetchAPI(`/projects/${projectId}/statuses`, {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          slug: data.slug || undefined,
          group_key: data.groupKey,
          color: data.color,
          icon: data.icon,
          position: data.position,
          is_default: data.isDefault,
        }),
      });
      const mapped = mapBackendWorkflowStatus(saved);
      setWorkflowStatuses((prev) => [...prev, mapped]);
      showToast({ title: "Status created", description: mapped.name, type: "success" });
    } catch (error: any) {
      showToast({ title: "Status creation failed", description: error.message, type: "error" });
    }
  }, [showToast]);

  const updateWorkflowStatus = useCallback(async (statusId: string, updates: Partial<WorkflowStatus>) => {
    setWorkflowStatuses((prev) => prev.map((s) => s.id === statusId ? { ...s, ...updates } : s));
    try {
      const { fetchAPI } = await import("./api");
      const status = workflowStatuses.find((s) => s.id === statusId);
      if (!status) return;
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.icon !== undefined) payload.icon = updates.icon;
      if (updates.position !== undefined) payload.position = updates.position;
      if (updates.groupKey !== undefined) payload.group_key = updates.groupKey;
      if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;
      await fetchAPI(`/projects/${status.projectId}/statuses/${statusId}`, { method: "PATCH", body: JSON.stringify(payload) });
      showToast({ title: "Status updated", type: "success" });
    } catch (err) {
      showToast({ title: "Status update failed", type: "error" });
    }
  }, [workflowStatuses, showToast]);

  const deleteWorkflowStatus = useCallback(async (statusId: string, moveToStatusId: string) => {
    try {
      const { fetchAPI } = await import("./api");
      const status = workflowStatuses.find((s) => s.id === statusId);
      if (!status) return;
      await fetchAPI(`/projects/${status.projectId}/statuses/${statusId}?move_to_status_id=${moveToStatusId}`, { method: "DELETE" });
      setWorkflowStatuses((prev) => prev.filter((s) => s.id !== statusId));
      setTasks((prev) => prev.map((t) => t.statusId === statusId ? { ...t, statusId: moveToStatusId } : t));
      showToast({ title: "Status deleted", type: "success" });
    } catch (error: any) {
      showToast({ title: "Delete failed", description: error.message, type: "error" });
    }
  }, [workflowStatuses, showToast]);

  const reorderStatuses = useCallback(async (projectId: string, items: { id: string; position: number; groupKey?: WorkflowGroupKey }[]) => {
    // Optimistic update
    setWorkflowStatuses((prev) => prev.map((s) => {
      const item = items.find((i) => i.id === s.id);
      if (!item) return s;
      return { ...s, position: item.position, ...(item.groupKey ? { groupKey: item.groupKey } : {}) };
    }));
    try {
      const { fetchAPI, mapBackendWorkflowStatus } = await import("./api");
      const payload = items.map((i) => ({ id: i.id, position: i.position, ...(i.groupKey ? { group_key: i.groupKey } : {}) }));
      const updated = await fetchAPI(`/projects/${projectId}/statuses/reorder`, { method: "POST", body: JSON.stringify(payload) });
      if (Array.isArray(updated)) {
        const mapped = updated.map(mapBackendWorkflowStatus);
        setWorkflowStatuses((prev) => {
          const others = prev.filter((s) => s.projectId !== projectId);
          return [...others, ...mapped];
        });
      }
    } catch (err) {
      showToast({ title: "Reorder failed", type: "error" });
    }
  }, [showToast]);

  // ── Workflow Status helpers ──────────────────────────────────────────

  const getProjectStatuses = useCallback((projectId: string): WorkflowStatus[] => {
    const groupOrder: Record<string, number> = { OPEN: 0, IN_PROGRESS: 1, ON_HOLD: 2, CLOSED: 3 };
    return workflowStatuses
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => (groupOrder[a.groupKey] ?? 99) - (groupOrder[b.groupKey] ?? 99) || a.position - b.position);
  }, [workflowStatuses]);

  const getStatusGroup = useCallback((statusId: string): WorkflowGroupKey | undefined => {
    return workflowStatuses.find((s) => s.id === statusId)?.groupKey;
  }, [workflowStatuses]);

  const isTaskDone = useCallback((task: Task): boolean => {
    return workflowStatuses.find((s) => s.id === task.statusId)?.groupKey === 'CLOSED';
  }, [workflowStatuses]);

  const isTaskOverdue = useCallback((task: Task): boolean => {
    if (!task.dueDate) return false;
    if (isTaskDone(task)) return false;
    const dueDateObj = new Date(task.dueDate);
    dueDateObj.setHours(23, 59, 59, 999);
    return dueDateObj < new Date();
  }, [isTaskDone]);

  // Project actions
  const addProject = useCallback(async (project: Omit<Project, "id" | "createdAt"> & { customStatuses?: any[] }) => {
    const tempId = `proj-temp-${Date.now()}`;
    const newProject: Project = { ...project, id: tempId, createdAt: new Date().toISOString() };
    setProjects((prev) => [...prev, newProject]);

    try {
      const { fetchAPI, mapBackendProject, mapBackendWorkflowStatus } = await import("./api");
      const savedProject = await fetchAPI("/projects", {
        method: "POST",
        body: JSON.stringify({
          name: project.name,
          project_key: project.key,
          description: project.description || "",
          start_date: project.startDate || null,
          end_date: project.endDate || null,
          status: "PLANNING",
          client_id: project.clientId || null,
          team_id: project.teamId || null,
          program_id: project.programId || null,
          template_id: project.templateId || null,
          custom_statuses: project.customStatuses || null,
        }),
      });
      setProjects((prev) => prev.map((p) => p.id === tempId ? mapBackendProject(savedProject) : p));

      // Fetch the default statuses created by the backend and add them to state
      try {
        const statuses = await fetchAPI(`/projects/${savedProject.id}/statuses`);
        if (Array.isArray(statuses)) {
          const newStatuses = statuses.map(mapBackendWorkflowStatus);
          setWorkflowStatuses((prev) => {
            const existingIds = new Set(prev.map(s => s.id));
            const uniqueNew = newStatuses.filter(s => !existingIds.has(s.id));
            return [...prev, ...uniqueNew];
          });
        }
      } catch (e) {
        console.error("Failed to fetch default statuses for new project", e);
      }

      showToast({ title: "Project created", description: savedProject.name, type: "success" });
    } catch (error: any) {
      setProjects((prev) => prev.filter((p) => p.id !== tempId));
      showToast({ title: "Project creation failed", description: error.message, type: "error" });
    }
  }, [showToast]);

  const updateProject = useCallback(async (id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
    try {
      const { fetchAPI } = await import("./api");
      const backendPayload: any = { ...updates };
      if (updates.status) backendPayload.status = (updates.status as string).toUpperCase();
      if (updates.startDate) backendPayload.start_date = updates.startDate;
      if (updates.endDate) backendPayload.end_date = updates.endDate;
      if ((updates as any).clientId !== undefined) backendPayload.client_id = (updates as any).clientId;
      if ((updates as any).teamId !== undefined) backendPayload.team_id = (updates as any).teamId;

      await fetchAPI(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(backendPayload) });
      showToast({ title: "Project updated", type: "success" });
    } catch (error) {
      showToast({ title: "Update failed", type: "error" });
    }
  }, [showToast]);

  const deleteProject = useCallback(async (id: string) => {
    const project = projects.find((p) => p.id === id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/projects/${id}`, { method: "DELETE" });
      showToast({ title: "Project deleted", description: project?.name, type: "success" });
    } catch (error) {
      if (project) setProjects((prev) => [...prev, project]);
      showToast({ title: "Delete failed", type: "error" });
    }
  }, [projects, showToast]);

  // Team actions
  const addTeam = useCallback(async (team: Omit<Team, "id">) => {
    const tempId = `team-temp-${Date.now()}`;
    const newTeam: Team = { ...team, id: tempId };
    setTeams((prev) => [...prev, newTeam]);
    try {
      const { fetchAPI, mapBackendTeam } = await import("./api");
      const savedTeam = await fetchAPI("/teams", {
        method: "POST",
        body: JSON.stringify({
          name: team.name,
          description: team.description || "",
          project_manager_id: team.projectManager.id,
          lead_id: team.lead?.id || null,
          product_manager_id: team.productManager?.id || null,
          scrum_master_id: team.scrumMaster?.id || null,
          project_ids: team.projectIds,
          capacity: team.capacity || 40,
          member_ids: team.members.map(m => m.id),
        }),
      });
      const mapped = mapBackendTeam(savedTeam);
      setTeams((prev) => prev.map((t) => t.id === tempId ? mapped : t));
      showToast({ title: "Team created", description: savedTeam.name, type: "success" });
      return mapped;
    } catch (err) {
      setTeams((prev) => prev.filter((t) => t.id !== tempId));
      showToast({ title: "Team creation failed", type: "error" });
      throw err;
    }
  }, [showToast]);

  const updateTeam = useCallback(async (id: string, updates: Partial<Team>) => {
    setTeams((prev) => prev.map((team) => team.id === id ? { ...team, ...updates } : team));
    try {
      const { fetchAPI } = await import("./api");
      const backendPayload: any = { ...updates };
      if (updates.projectManager) backendPayload.project_manager_id = updates.projectManager.id;
      if (updates.lead !== undefined) backendPayload.lead_id = updates.lead?.id || null;
      if (updates.productManager !== undefined) backendPayload.product_manager_id = updates.productManager?.id || null;
      if (updates.scrumMaster !== undefined) backendPayload.scrum_master_id = updates.scrumMaster?.id || null;
      if (updates.projectIds) backendPayload.project_ids = updates.projectIds;
      if (updates.members) backendPayload.member_ids = updates.members.map(m => m.id);

      await fetchAPI(`/teams/${id}`, { method: "PATCH", body: JSON.stringify(backendPayload) });
      showToast({ title: "Team updated", type: "success" });
    } catch (err) {
      showToast({ title: "Update failed", type: "error" });
    }
  }, [showToast]);

  const deleteTeam = useCallback(async (id: string) => {
    const team = teams.find((t) => t.id === id);
    setTeams((prev) => prev.filter((t) => t.id !== id));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/teams/${id}`, { method: "DELETE" });
      showToast({ title: "Team deleted", description: team?.name, type: "success" });
    } catch (err) {
      if (team) setTeams((prev) => [...prev, team]);
      showToast({ title: "Delete failed", type: "error" });
    }
  }, [teams, showToast]);

  const addTeamMember = useCallback(async (teamId: string, userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setTeams((prev) => prev.map((team) => team.id === teamId && !team.members.some((m) => m.id === userId) ? { ...team, members: [...team.members, user] } : team));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/teams/${teamId}/members/${userId}`, { method: "POST" });
      showToast({ title: "Member added", description: user.name, type: "success" });
    } catch (err) {
      showToast({ title: "Failed to add member", type: "error" });
    }
  }, [users, showToast]);

  const removeTeamMember = useCallback(async (teamId: string, userId: string) => {
    setTeams((prev) => prev.map((team) => team.id === teamId ? { ...team, members: team.members.filter((m) => m.id !== userId) } : team));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/teams/${teamId}/members/${userId}`, { method: "DELETE" });
      showToast({ title: "Member removed", type: "success" });
    } catch (err) {
      showToast({ title: "Failed to remove member", type: "error" });
    }
  }, [showToast]);

  const setTeamLead = useCallback(async (teamId: string, userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setTeams((prev) => prev.map((team) => team.id === teamId ? { ...team, lead: user } : team));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/teams/${teamId}`, { method: "PATCH", body: JSON.stringify({ lead_id: userId }) });
      showToast({ title: "Team lead updated", type: "success" });
    } catch (err) {
      showToast({ title: "Update failed", type: "error" });
    }
  }, [users, showToast]);

  // User actions
  const addUser = useCallback(async (userData: { name: string; email: string; password: string; role?: string }) => {
    try {
      const { fetchAPI } = await import("./api");
      const savedUser = await fetchAPI("/users", { method: "POST", body: JSON.stringify({ ...userData, role: userData.role || "MEMBER" }) });
      const newUser: User = { id: String(savedUser.id), name: savedUser.name, email: savedUser.email, role: (savedUser.role?.toLowerCase()?.replace('_', '-') || 'contributor') as any };
      setUsers((prev) => [...prev, newUser]);
      showToast({ title: "User created", description: savedUser.name, type: "success" });
      return newUser;
    } catch (error: any) {
      showToast({ title: "User creation failed", description: error.message, type: "error" });
      throw error;
    }
  }, [showToast]);

  // Program actions
  const addProgram = useCallback(async (program: Omit<Program, "id">) => {
    const tempId = `prog-temp-${Date.now()}`;
    const newProgram: Program = { ...program, id: tempId };
    setPrograms((prev) => [...prev, newProgram]);
    try {
      const { fetchAPI, mapBackendProgram } = await import("./api");
      const savedProgram = await fetchAPI("/programs", {
        method: "POST",
        body: JSON.stringify({
          name: program.name,
          description: program.description,
          portfolio_id: program.portfolioId,
          project_ids: program.projects?.map(p => p.id) || []
        })
      });
      const mapped = mapBackendProgram(savedProgram);
      setPrograms((prev) => prev.map((p) => p.id === tempId ? mapped : p));
      showToast({ title: "Program created", description: savedProgram.name, type: "success" });
      return mapped;
    } catch (error) {
      setPrograms((prev) => prev.filter((p) => p.id !== tempId));
      showToast({ title: "Program creation failed", type: "error" });
      throw error;
    }
  }, [showToast]);

  const updateProgram = useCallback(async (id: string, updates: Partial<Program>) => {
    setPrograms((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
    try {
      const { fetchAPI } = await import("./api");
      const backendPayload: any = { ...updates };
      if (updates.projects) backendPayload.project_ids = updates.projects.map(p => p.id);
      await fetchAPI(`/programs/${id}`, { method: "PATCH", body: JSON.stringify(backendPayload) });
      showToast({ title: "Program updated", type: "success" });
    } catch (err) {
      showToast({ title: "Update failed", type: "error" });
    }
  }, [showToast]);

  const deleteProgram = useCallback(async (id: string) => {
    const program = programs.find((p) => p.id === id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/programs/${id}`, { method: "DELETE" });
      showToast({ title: "Program deleted", type: "success" });
    } catch (err) {
      if (program) setPrograms((prev) => [...prev, program]);
      showToast({ title: "Delete failed", type: "error" });
    }
  }, [programs, showToast]);

  // Portfolio actions
  const addPortfolio = useCallback(async (portfolio: Omit<Portfolio, "id">) => {
    const tempId = `port-temp-${Date.now()}`;
    const newPortfolio: Portfolio = { ...portfolio, id: tempId };
    setPortfolios((prev) => [...prev, newPortfolio]);
    try {
      const { fetchAPI, mapBackendPortfolio } = await import("./api");
      const savedPortfolio = await fetchAPI("/portfolios", {
        method: "POST",
        body: JSON.stringify({
          name: portfolio.name,
          description: portfolio.description,
          program_ids: portfolio.programs?.map(p => p.id) || []
        })
      });
      const mapped = mapBackendPortfolio(savedPortfolio);
      setPortfolios((prev) => prev.map((p) => p.id === tempId ? mapped : p));
      showToast({ title: "Portfolio created", description: savedPortfolio.name, type: "success" });
      return mapped;
    } catch (error: any) {
      setPortfolios((prev) => prev.filter((p) => p.id !== tempId));
      showToast({ title: "Portfolio creation failed", description: error.message, type: "error" });
      throw error;
    }
  }, [showToast]);

  const updatePortfolio = useCallback(async (id: string, updates: Partial<Portfolio>) => {
    setPortfolios((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
    try {
      const { fetchAPI } = await import("./api");
      const backendPayload: any = { ...updates };
      if (updates.programs) backendPayload.program_ids = updates.programs.map(p => p.id);
      await fetchAPI(`/portfolios/${id}`, { method: "PATCH", body: JSON.stringify(backendPayload) });
      showToast({ title: "Portfolio updated", type: "success" });
    } catch (err) {
      showToast({ title: "Update failed", type: "error" });
    }
  }, [showToast]);

  const deletePortfolio = useCallback(async (id: string) => {
    const portfolio = portfolios.find((p) => p.id === id);
    setPortfolios((prev) => prev.filter((p) => p.id !== id));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/portfolios/${id}`, { method: "DELETE" });
      showToast({ title: "Portfolio deleted", type: "success" });
    } catch (err) {
      if (portfolio) setPortfolios((prev) => [...prev, portfolio]);
      showToast({ title: "Delete failed", type: "error" });
    }
  }, [portfolios, showToast]);

  // Client actions
  const addClient = useCallback(async (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
    try {
      const { fetchAPI, mapBackendClient } = await import("./api");
      const savedClient = await fetchAPI("/clients", { method: "POST", body: JSON.stringify(client) });
      const mapped = mapBackendClient(savedClient);
      setClients((prev) => [...prev, mapped]);
      showToast({ title: "Client created", description: savedClient.name, type: "success" });
      return mapped;
    } catch (err) {
      showToast({ title: "Client creation failed", type: "error" });
      throw err;
    }
  }, [showToast]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    setClients((prev) => prev.map((c) => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(updates) });
      showToast({ title: "Client updated", type: "success" });
    } catch (err) {
      showToast({ title: "Update failed", type: "error" });
    }
  }, [showToast]);

  const deleteClient = useCallback(async (id: string) => {
    const client = clients.find((c) => c.id === id);
    setClients((prev) => prev.filter((c) => c.id !== id));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/clients/${id}`, { method: "DELETE" });
      showToast({ title: "Client deleted", type: "success" });
    } catch (err) {
      if (client) setClients((prev) => [...prev, client]);
      showToast({ title: "Delete failed", type: "error" });
    }
  }, [clients, showToast]);

  // Sprint actions
  const addSprint = useCallback(async (sprint: Omit<Sprint, "id">, taskIds: string[] = []) => {
    const tempId = `sprint-temp-${Date.now()}`;
    const newSprint: Sprint = { ...sprint, id: tempId };
    setSprints((prev) => [...prev, newSprint]);
    try {
      const { fetchAPI, mapBackendSprint } = await import("./api");
      const savedSprint = await fetchAPI("/sprints", {
        method: "POST",
        body: JSON.stringify({
          name: sprint.name,
          goal: sprint.goal || "",
          status: sprint.status || "active",
          start_date: sprint.startDate || null,
          end_date: sprint.endDate || null,
          velocity: sprint.velocity || 0,
          project_id: sprint.projectId || null,
          task_ids: taskIds,
        }),
      });
      const mapped = mapBackendSprint(savedSprint);
      setSprints((prev) => prev.map((s) => s.id === tempId ? mapped : s));
      if (taskIds.length > 0) {
        setTasks((prev) => prev.map((t) => taskIds.includes(t.id) ? { ...t, sprintId: mapped.id } : t));
      }
      showToast({ title: "Sprint created", type: "success" });
    } catch (error: any) {
      setSprints((prev) => prev.filter((s) => s.id !== tempId));
      showToast({ title: "Sprint creation failed", description: error.message, type: "error" });
    }
  }, [showToast]);

  const updateSprint = useCallback(async (id: string, updates: Partial<Sprint>) => {
    setSprints((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
    try {
      const { fetchAPI } = await import("./api");
      const backendPayload: any = { ...updates };
      if (updates.startDate) backendPayload.start_date = updates.startDate;
      if (updates.endDate) backendPayload.end_date = updates.endDate;
      await fetchAPI(`/sprints/${id}`, { method: "PATCH", body: JSON.stringify(backendPayload) });
      showToast({ title: "Sprint updated", type: "success" });
    } catch (err) {
      showToast({ title: "Update failed", type: "error" });
    }
  }, [showToast]);

  const deleteSprint = useCallback(async (id: string) => {
    const sprint = sprints.find((s) => s.id === id);
    setSprints((prev) => prev.filter((s) => s.id !== id));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/sprints/${id}`, { method: "DELETE" });
      showToast({ title: "Sprint deleted", type: "success" });
    } catch (err) {
      if (sprint) setSprints((prev) => [...prev, sprint]);
      showToast({ title: "Delete failed", type: "error" });
    }
  }, [sprints, showToast]);

  // Time tracking actions
  const addTimeEntry = useCallback(async (entry: Omit<TimeEntry, "id" | "createdAt">) => {
    const tempId = `time-temp-${Date.now()}`;
    const newEntry: TimeEntry = { ...entry, id: tempId, createdAt: new Date().toISOString() };
    setTimeEntries((prev) => [...prev, newEntry]);
    try {
      const { fetchAPI, mapBackendTimeEntry } = await import("./api");
      const savedEntry = await fetchAPI("/time-entries/", {
        method: "POST",
        body: JSON.stringify({
          duration: entry.hours ? Math.round(entry.hours * 60) : undefined,
          date: entry.date,
          description: entry.description || "",
          task_id: entry.taskId,
          user_id: entry.userId,
          start_at: entry.startAt,
          end_at: entry.endAt,
        }),
      });
      setTimeEntries((prev) => prev.map((e) => e.id === tempId ? mapBackendTimeEntry(savedEntry) : e));
      showToast({ title: "Time logged", type: "success" });
    } catch (err) {
      setTimeEntries((prev) => prev.filter((e) => e.id !== tempId));
      showToast({ title: "Time logging failed", type: "error" });
    }
  }, [showToast]);

  const updateTimeEntry = useCallback(async (id: string, updates: Partial<TimeEntry>) => {
    setTimeEntries((prev) => prev.map((e) => e.id === id ? { ...e, ...updates } : e));
    try {
      const { fetchAPI } = await import("./api");
      const backendPayload: any = { ...updates };
      if (updates.hours !== undefined) backendPayload.duration = Math.round(updates.hours * 60);
      await fetchAPI(`/time-entries/${id}`, { method: "PATCH", body: JSON.stringify(backendPayload) });
      showToast({ title: "Entry updated", type: "success" });
    } catch (err) {
      showToast({ title: "Update failed", type: "error" });
    }
  }, [showToast]);

  const deleteTimeEntry = useCallback(async (id: string) => {
    const entry = timeEntries.find((e) => e.id === id);
    setTimeEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/time-entries/${id}`, { method: "DELETE" });
      showToast({ title: "Entry deleted", type: "success" });
    } catch (err) {
      if (entry) setTimeEntries((prev) => [...prev, entry]);
      showToast({ title: "Delete failed", type: "error" });
    }
  }, [timeEntries, showToast]);

  const getTaskTimeEntries = useCallback((taskId: string) => timeEntries.filter((e) => e.taskId === taskId), [timeEntries]);
  const getUserTimeEntries = useCallback((userId: string, startDate?: string, endDate?: string) => {
    return timeEntries.filter((e) => {
      if (e.userId !== userId) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }, [timeEntries]);


  const getTaskActivities = useCallback(async (taskId: string): Promise<TimeEntry[]> => {
    try {
      const { getTaskActivities: apiFetch, mapBackendTimeEntry } = await import("./api");
      const entries = await apiFetch(taskId);
      return Array.isArray(entries) ? entries.map(mapBackendTimeEntry) : [];
    } catch {
      return [];
    }
  }, []);

  // Resource allocation actions
  const addResourceAllocation = useCallback((allocation: Omit<ResourceAllocation, "id">) => {
    const newAllocation: ResourceAllocation = { ...allocation, id: `ra-${Date.now()}` };
    setResourceAllocations((prev) => [...prev, newAllocation]);
    showToast({ title: "Resource allocated", type: "success" });
  }, [showToast]);

  const updateResourceAllocation = useCallback((id: string, updates: Partial<ResourceAllocation>) => {
    setResourceAllocations((prev) => prev.map((a) => a.id === id ? { ...a, ...updates } : a));
    showToast({ title: "Allocation updated", type: "success" });
  }, [showToast]);

  const deleteResourceAllocation = useCallback((id: string) => {
    setResourceAllocations((prev) => prev.filter((a) => a.id !== id));
    showToast({ title: "Allocation removed", type: "success" });
  }, [showToast]);

  const getUserAllocations = useCallback((userId: string) => resourceAllocations.filter((a) => a.userId === userId), [resourceAllocations]);
  const getProjectAllocations = useCallback((projectId: string) => resourceAllocations.filter((a) => a.projectId === projectId), [resourceAllocations]);

  // Modal actions
  const openModal = useCallback((type: ModalType, data?: Record<string, unknown>) => setModal({ type, data }), []);
  const closeModal = useCallback(() => setModal({ type: null }), []);

  // Utility functions
  const getUser = useCallback((id: string) => users.find((u) => u.id === id), [users]);
  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);
  const getTask = useCallback((id: string) => tasks.find((t) => t.id === id), [tasks]);
  const getTeam = useCallback((id: string) => teams.find((t) => t.id === id), [teams]);
  const getProgram = useCallback((id: string) => programs.find((p) => p.id === id), [programs]);
  const getPortfolio = useCallback((id: string) => portfolios.find((p) => p.id === id), [portfolios]);
  const getSprint = useCallback((id: string) => sprints.find((s) => s.id === id), [sprints]);

  const getFilteredTasks = useCallback((projectId: string) => {
    let result = tasks.filter(t => t.projectId === projectId);
    return applyTaskFilters(result, taskFilters, taskSort, workflowStatuses);
  }, [tasks, taskFilters, taskSort, workflowStatuses]);

  // Custom Filters actions
  const addCustomFilter = useCallback(async (projectId: string, name: string, filters: TaskFilters, sort: TaskSort) => {
    try {
      const { fetchAPI, mapBackendCustomFilter } = await import("./api");
      const saved = await fetchAPI(`/projects/${projectId}/custom-filters`, {
        method: "POST",
        body: JSON.stringify({ name, filters, sort }),
      });
      const mapped = mapBackendCustomFilter(saved);
      setCustomFilters(prev => [...prev, mapped]);
      showToast({ title: "Filter saved", description: mapped.name, type: "success" });
      setActiveCustomFilterId(mapped.id);
    } catch (err: any) {
      showToast({ title: "Failed to save filter", description: err.message, type: "error" });
    }
  }, [showToast]);

  const updateCustomFilter = useCallback(async (id: string, updates: Partial<CustomFilter>) => {
    setCustomFilters(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    try {
      const { fetchAPI } = await import("./api");
      const payload: any = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.filters !== undefined) payload.filters = updates.filters;
      if (updates.sort !== undefined) payload.sort = updates.sort;
      await fetchAPI(`/custom-filters/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      showToast({ title: "Filter updated", type: "success" });
    } catch (err: any) {
      showToast({ title: "Failed to update filter", type: "error" });
    }
  }, [showToast]);

  const deleteCustomFilter = useCallback(async (id: string) => {
    setCustomFilters(prev => prev.filter(f => f.id !== id));
    if (activeCustomFilterId === id) {
      setActiveCustomFilterId(null);
    }
    try {
      const { fetchAPI } = await import("./api");
      await fetchAPI(`/custom-filters/${id}`, { method: "DELETE" });
      showToast({ title: "Filter deleted", type: "success" });
    } catch (err: any) {
      showToast({ title: "Failed to delete filter", type: "error" });
    }
  }, [activeCustomFilterId, showToast]);

  const applyCustomFilter = useCallback((filter: CustomFilter | null) => {
    if (filter) {
      setTaskFilters(filter.filters);
      setTaskSort(filter.sort);
      setActiveCustomFilterId(filter.id);
    } else {
      setTaskFilters({});
      setTaskSort({ field: 'title', direction: 'asc' });
      setActiveCustomFilterId(null);
    }
  }, []);

  const value: AppContextType = {
    tasks, projects, teams, programs, portfolios, clients, users, timeEntries, resourceAllocations, sprints, workflowStatuses, currentUser, currentProject, selectedTasks, modal, toasts, searchOpen, aiCopilotOpen, isAuthenticated, token, isAuthInitialized, taskFilters, taskSort, customFilters, activeCustomFilterId,
    setTaskFilters, setTaskSort, getFilteredTasks,
    addCustomFilter, updateCustomFilter, deleteCustomFilter, applyCustomFilter,
    addTask, updateTask, deleteTask, updateTaskStatus, assignTask, selectTask, selectAllTasks, clearSelectedTasks, bulkUpdateTaskStatus, bulkAssignTasks, bulkDeleteTasks,
    addWorkflowStatus, updateWorkflowStatus, deleteWorkflowStatus, reorderStatuses, getProjectStatuses, getStatusGroup, isTaskDone, isTaskOverdue,
    setCurrentProject, addProject, updateProject, deleteProject,
    addTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, setTeamLead,
    addUser,
    addProgram, updateProgram, deleteProgram,
    addPortfolio, updatePortfolio, deletePortfolio,
    addClient, updateClient, deleteClient,
    addSprint, updateSprint, deleteSprint,
    addTimeEntry, updateTimeEntry, deleteTimeEntry, getTaskTimeEntries, getUserTimeEntries,
    getTaskActivities,
    addResourceAllocation, updateResourceAllocation, deleteResourceAllocation, getUserAllocations, getProjectAllocations,
    openModal, closeModal,
    showToast, dismissToast,
    setSearchOpen, setAiCopilotOpen,
    hasPermission, canManageTask, canManageProject,
    getUser, getProject, getTask, getTeam, getProgram, getPortfolio, getSprint,
    loginAction, signupAction, logoutAction, isMounted,
    toggleWatchTask, getTaskWatcherCount, isWatchingTask,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
