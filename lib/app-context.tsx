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
  TaskStatus,
  TaskPriority,
  Team,
  Program,
  Portfolio,
  Sprint,
  Client,
  UserRole,
} from "./types";

// User Roles

export interface UserWithRole extends User {
  systemRole: UserRole;
  permissions: string[];
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
type ModalType =
  | "create-task"
  | "edit-task"
  | "create-project"
  | "edit-project"
  | "create-sprint"
  | "task-detail"
  | "project-detail"
  | "create-team"
  | "edit-team"
  | "create-program"
  | "edit-program"
  | "create-portfolio"
  | "edit-portfolio"
  | "assign-task"
  | "change-status"
  | "search"
  | "confirm-delete"
  | "add-member"
  | "log-time"
  | "resource-allocation"
  | "user-profile"
  | "client-detail"
  | "create-user"
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

// Time Entry interface
export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  date: string;
  description?: string;
  createdAt: string;
  // Timer-based fields
  startAt?: string | null;
  endAt?: string | null;
  isRunning?: boolean;
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
  clients: Client[];
  users: User[];
  timeEntries: TimeEntry[];
  resourceAllocations: ResourceAllocation[];
  sprints: Sprint[];
  currentUser: UserWithRole;
  currentProject: string | null;
  selectedTasks: string[];
  modal: ModalState;
  toasts: Toast[];
  searchOpen: boolean;
  aiCopilotOpen: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

interface AppContextType extends AppState {
  // Task actions
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "key">) => void;
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
  addProject: (project: Omit<Project, "id" | "createdAt">) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Team actions
  addTeam: (team: Omit<Team, "id">) => Promise<Team>;
  updateTeam: (id: string, updates: Partial<Team>) => void;
  deleteTeam: (id: string) => void;
  addTeamMember: (teamId: string, userId: string) => void;
  removeTeamMember: (teamId: string, userId: string) => void;
  setTeamLead: (teamId: string, userId: string) => void;

  // User actions
  addUser: (user: { name: string; email: string; password: string; role?: string }) => Promise<User>;

  // Program actions
  addProgram: (program: Omit<Program, "id">) => void;
  updateProgram: (id: string, updates: Partial<Program>) => void;
  deleteProgram: (id: string) => void;

  // Portfolio actions
  addPortfolio: (portfolio: Omit<Portfolio, "id">) => void;
  updatePortfolio: (id: string, updates: Partial<Portfolio>) => void;
  deletePortfolio: (id: string) => void;

  // Client actions
  addClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => Promise<Client>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Sprint actions
  addSprint: (sprint: Omit<Sprint, "id">) => void;
  updateSprint: (id: string, updates: Partial<Sprint>) => void;
  deleteSprint: (id: string) => void;

  // Time tracking actions
  addTimeEntry: (entry: Omit<TimeEntry, "id" | "createdAt">) => void;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;
  getTaskTimeEntries: (taskId: string) => TimeEntry[];
  getUserTimeEntries: (
    userId: string,
    startDate?: string,
    endDate?: string,
  ) => TimeEntry[];

  // Activity timer actions
  startActivity: (taskId: string, description?: string) => Promise<TimeEntry | null>;
  stopActivity: (entryId: string, description?: string) => Promise<TimeEntry | null>;
  getTaskActivities: (taskId: string) => Promise<TimeEntry[]>;

  // Resource allocation actions
  addResourceAllocation: (allocation: Omit<ResourceAllocation, "id">) => void;
  updateResourceAllocation: (
    id: string,
    updates: Partial<ResourceAllocation>,
  ) => void;
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
  signupAction: (
    name: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logoutAction: () => void;
  isMounted: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Create current user with role
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
  const [resourceAllocations, setResourceAllocations] = useState<
    ResourceAllocation[]
  >([]);
  const [currentUser, setCurrentUser] = useState<UserWithRole>({
    id: "loading",
    name: "Loading...",
    email: "",
    role: "viewer" as UserRole,
    systemRole: "viewer" as UserRole,
    permissions: rolePermissions["viewer"],
  });
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiCopilotOpen, setAiCopilotOpen] = useState(false);



  const loginAction = useCallback(async (email: string, password: string) => {
    try {
      const { login: authLogin } = await import("./auth");
      const response = await authLogin(email, password);
      localStorage.setItem("auth_token", response.access_token);
      setToken(response.access_token);
      setIsAuthenticated(true);
      showToast({ title: "Logged in successfully", type: "success" });
      // Reload page to refresh context and fetch data
      window.location.href = "/";
    } catch (error: any) {
      showToast({
        title: "Login failed",
        description: error.message,
        type: "error",
      });
      throw error;
    }
  }, []);

  const signupAction = useCallback(
    async (name: string, email: string, password: string) => {
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
    },
    [],
  );

  const logoutAction = useCallback(() => {
    const { logout: authLogout } = require("./auth");
    authLogout();
    setToken(null);
    setIsAuthenticated(false);
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  React.useEffect(() => {
    if (!isMounted || !token) return;

    import("./api").then(
      ({
        fetchAPI,
        mapBackendProject,
        mapBackendTask,
        mapBackendTeam,
        mapBackendTimeEntry,
        mapBackendPortfolio,
        mapBackendProgram,
        mapBackendSprint,
        mapBackendClient,
      }) => {
        // Load from the API
        Promise.all([
          fetchAPI("/projects").catch(() => null),
          fetchAPI("/tasks").catch(() => null),
          fetchAPI("/teams").catch(() => null),
          fetchAPI("/time-entries").catch(() => null),
          fetchAPI("/portfolios").catch(() => null),
          fetchAPI("/programs").catch(() => null),
          fetchAPI("/clients").catch(() => null),
          fetchAPI("/users").catch(() => null),
          fetchAPI("/users/me").catch(() => null),
          fetchAPI("/sprints").catch(() => null),
        ]).then(
          ([
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
          ]) => {
            if (projectsData && Array.isArray(projectsData)) {
              setProjects(projectsData.map(mapBackendProject) as any);
            }
            if (tasksData && Array.isArray(tasksData)) {
              setTasks(tasksData.map(mapBackendTask) as any);
            }
            if (teamsData && Array.isArray(teamsData)) {
              setTeams(teamsData.map(mapBackendTeam) as any);
            }
            if (timeEntriesData && Array.isArray(timeEntriesData)) {
              setTimeEntries(timeEntriesData.map(mapBackendTimeEntry) as any);
            }
            if (portfoliosData && Array.isArray(portfoliosData)) {
              setPortfolios(portfoliosData.map(mapBackendPortfolio) as any);
            }
            if (programsData && Array.isArray(programsData)) {
              setPrograms(programsData.map(mapBackendProgram) as any);
            }
            if (clientsData && Array.isArray(clientsData)) {
              setClients(clientsData.map(mapBackendClient) as any);
            }
            if (usersData && Array.isArray(usersData)) {
              setUsers(usersData as any);
            }
            if (sprintsData && Array.isArray(sprintsData)) {
              setSprints(sprintsData.map(mapBackendSprint) as any);
            }
            if (meData) {
              setCurrentUser({
                ...meData,
                systemRole: meData.role || "project-manager",
                permissions:
                  rolePermissions[
                  (meData.role as UserRole) || "project-manager"
                  ] || rolePermissions["project-manager"],
              });
            }
          },
        );
      },
    );
  }, [token]);

  // Toast action - defined first since other functions use it
  const showToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  // Permission helpers
  const hasPermission = useCallback(
    (permission: string) => {
      if (currentUser.permissions.includes("*")) return true;
      return currentUser.permissions.includes(permission);
    },
    [currentUser.permissions],
  );

  const canManageTask = useCallback(
    (task: Task) => {
      if (hasPermission("tasks:manage")) return true;
      if (
        hasPermission("tasks:own") &&
        (task.assignee?.id === currentUser.id ||
          task.reporter.id === currentUser.id)
      )
        return true;
      return false;
    },
    [hasPermission, currentUser.id],
  );

  const canManageProject = useCallback(
    (project: Project) => {
      if (hasPermission("projects:manage")) return true;
      if (project.owner.id === currentUser.id) return true;
      return false;
    },
    [hasPermission, currentUser.id],
  );

  // Task actions
  const addTask = useCallback(
    async (task: Omit<Task, "id" | "createdAt" | "updatedAt" | "key">) => {
      const project = projects.find((p) => p.id === task.projectId);
      const tempId = `task-${Date.now()}`;
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
        setProjects((prev) =>
          prev.map((p) =>
            p.id === project.id ? { ...p, taskCount: nextTaskNumber } : p,
          ),
        );
      }

      try {
        const { fetchAPI, mapBackendTask } = await import("./api");

        const payload: any = {
          title: task.title,
          description: task.description || "",
          project_id: task.projectId,
          story_points: task.storyPoints || 0,
          start_date: task.startDate || null,
          due_date: task.dueDate || null,
          sprint_id: task.sprintId || null,
          status:
            task.status === "open"
              ? "TODO"
              : task.status === "in-progress"
                ? "IN_PROGRESS"
                : task.status === "pending-approval"
                  ? "IN_REVIEW"
                  : task.status === "closed"
                    ? "DONE"
                    : task.status === "assigned"
                      ? "ASSIGNED"
                      : "TODO",
          priority:
            task.priority === "critical"
              ? "URGENT"
              : task.priority.toUpperCase(),
        };

        if (task.assignee?.id) {
          payload.assignee_id = task.assignee.id;
        }

        const savedTask = await fetchAPI("/tasks", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setTasks((prev) =>
          prev.map((t) => (t.id === tempId ? { ...t, ...mapBackendTask(savedTask), dueDate: t.dueDate, type: t.type, startDate: t.startDate } : t)),
        );
        showToast({
          title: "Task created",
          description: savedTask.task_code || savedTask.title,
          type: "success",
        });
      } catch (error: any) {
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
        showToast({
          title: "Task creation failed",
          description: error.message || "An unexpected error occurred",
          type: "error"
        });
      }
    },
    [projects, showToast],
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? { ...task, ...updates, updatedAt: new Date().toISOString() }
            : task,
        ),
      );

      try {
        const { fetchAPI } = await import("./api");
        const payload: any = { ...updates };

        if (payload.status) {
          payload.status =
            payload.status === "open"
              ? "TODO"
              : payload.status === "in-progress"
                ? "IN_PROGRESS"
                : payload.status === "pending-approval"
                  ? "IN_REVIEW"
                  : payload.status === "closed"
                    ? "DONE"
                    : payload.status === "assigned"
                      ? "ASSIGNED"
                      : payload.status.toUpperCase();
        }

        if (payload.priority) {
          payload.priority =
            payload.priority === "critical"
              ? "URGENT"
              : payload.priority.toUpperCase();
        }

        if (payload.storyPoints !== undefined) {
          payload.story_points = payload.storyPoints;
          delete payload.storyPoints;
        }

        if (payload.startDate !== undefined) {
          payload.start_date = payload.startDate;
          delete payload.startDate;
        }

        if (payload.dueDate !== undefined) {
          payload.due_date = payload.dueDate;
          delete payload.dueDate;
        }

        if (payload.assignee) {
          payload.assignee_id = payload.assignee.id;
          delete payload.assignee;
        }

        await fetchAPI(`/tasks/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        showToast({ title: "Task updated", type: "success" });
      } catch (err) {
        showToast({ title: "Task update failed", type: "error" });
      }
    },
    [showToast],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      setTasks((prev) => prev.filter((t) => t.id !== id));

      try {
        const { fetchAPI } = await import("./api");
        await fetchAPI(`/tasks/${id}`, { method: "DELETE" });
        showToast({
          title: "Task deleted",
          description: task?.key,
          type: "success",
        });
      } catch (err) {
        if (task) setTasks((prev) => [...prev, task]);
        showToast({ title: "Delete failed", type: "error" });
      }
    },
    [tasks, showToast],
  );

  const updateTaskStatus = useCallback(
    async (id: string, status: TaskStatus) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? { ...task, status, updatedAt: new Date().toISOString() }
            : task,
        ),
      );

      try {
        const { fetchAPI } = await import("./api");
        const mappedStatus =
          status === "open"
            ? "TODO"
            : status === "in-progress"
              ? "IN_PROGRESS"
              : status === "pending-approval"
                ? "IN_REVIEW"
                : status === "closed"
                  ? "DONE"
                  : status === "assigned"
                    ? "ASSIGNED"
                    : status.replace("-", "_").toUpperCase();

        await fetchAPI(`/tasks/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: mappedStatus }),
        });
        showToast({ title: "Status updated", type: "success" });
      } catch (err) {
        showToast({ title: "Status update failed", type: "error" });
      }
    },
    [showToast],
  );

  const assignTask = useCallback(
    async (taskId: string, userId: string | null) => {
      const user = userId ? users.find((u) => u.id === userId) : null;
      const newStatus = user ? "ASSIGNED" : "TODO";

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
              ...task,
              assignee: user || undefined,
              status:
                user && task.status === "open" ? "assigned" : task.status,
              updatedAt: new Date().toISOString(),
            }
            : task,
        ),
      );

      try {
        const { fetchAPI } = await import("./api");
        await fetchAPI(`/tasks/${taskId}`, {
          method: "PATCH",
          body: JSON.stringify({ assignee_id: userId, status: newStatus }),
        });
        showToast({
          title: user ? "Task assigned" : "Task unassigned",
          description: user ? `Assigned to ${user.name}` : undefined,
          type: "success",
        });
      } catch (err) {
        showToast({ title: "Assignment failed", type: "error" });
      }
    },
    [users, showToast],
  );

  const selectTask = useCallback((id: string) => {
    setSelectedTasks((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }, []);

  const selectAllTasks = useCallback((ids: string[]) => {
    setSelectedTasks(ids);
  }, []);

  const clearSelectedTasks = useCallback(() => {
    setSelectedTasks([]);
  }, []);

  const bulkUpdateTaskStatus = useCallback(
    (ids: string[], status: TaskStatus) => {
      setTasks((prev) =>
        prev.map((task) =>
          ids.includes(task.id)
            ? { ...task, status, updatedAt: new Date().toISOString() }
            : task,
        ),
      );
      setSelectedTasks([]);
      showToast({ title: `${ids.length} tasks updated`, type: "success" });
    },
    [showToast],
  );

  const bulkAssignTasks = useCallback(
    (ids: string[], userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      setTasks((prev) =>
        prev.map((task) =>
          ids.includes(task.id)
            ? {
              ...task,
              assignee: user,
              status: task.status === "open" ? "assigned" : task.status,
              updatedAt: new Date().toISOString(),
            }
            : task,
        ),
      );
      setSelectedTasks([]);
      showToast({
        title: `${ids.length} tasks assigned`,
        description: `to ${user.name}`,
        type: "success",
      });
    },
    [users, showToast],
  );

  const bulkDeleteTasks = useCallback(
    (ids: string[]) => {
      setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
      setSelectedTasks([]);
      showToast({ title: `${ids.length} tasks deleted`, type: "success" });
    },
    [showToast],
  );

  // Sprint actions
  const addSprint = useCallback(
    async (sprint: Omit<Sprint, "id">, taskIds: string[] = []) => {
      const tempId = `sprint-temp-${Date.now()}`;
      const newSprint: Sprint = { ...sprint, id: tempId };
      setSprints((prev) => [...prev, newSprint]);

      if (taskIds.length > 0) {
        setTasks((prev) =>
          prev.map((task) =>
            taskIds.includes(task.id) ? { ...task, sprintId: tempId } : task,
          ),
        );
      }

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

        setSprints((prev) =>
          prev.map((s) =>
            s.id === tempId ? mapBackendSprint(savedSprint) : s,
          ),
        );

        if (taskIds.length > 0) {
          setTasks((prev) =>
            prev.map((task) =>
              taskIds.includes(task.id)
                ? { ...task, sprintId: savedSprint.id }
                : task,
            ),
          );
        }

        showToast({
          title: "Sprint created",
          description: savedSprint.name,
          type: "success",
        });
      } catch (error: any) {
        setSprints((prev) => prev.filter((s) => s.id !== tempId));
        if (taskIds.length > 0) {
          setTasks((prev) =>
            prev.map((task) =>
              taskIds.includes(task.id) && task.sprintId === tempId
                ? { ...task, sprintId: undefined }
                : task,
            ),
          );
        }
        showToast({
          title: "Sprint creation failed",
          description: error.message || "An unexpected error occurred",
          type: "error"
        });
      }
    },
    [showToast],
  );



  const updateSprint = useCallback((id: string, updates: Partial<Sprint>) => {
    setSprints((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  }, []);

  const deleteSprint = useCallback((id: string) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Project actions
  const addProject = useCallback(
    async (project: Omit<Project, "id">) => {
      const tempId = `proj-temp-${Date.now()}`;
      const newProject: Project = { ...project, id: tempId };
      setProjects((prev) => [...prev, newProject]);

      try {
        const { fetchAPI, mapBackendProject } = await import("./api");
        const savedProject = await fetchAPI("/projects", {
          method: "POST",
          body: JSON.stringify({
            name: project.name,
            project_key: project.key,
            description: project.description || "",
            start_date: project.startDate || null,
            end_date: project.endDate || null,
            status: "PLANNING",
            client_id: (project as any).clientId || null,
            team_id: (project as any).teamId || null,
            program_id: project.programId || null,
          }),
        });

        setProjects((prev) =>
          prev.map((p) =>
            p.id === tempId ? mapBackendProject(savedProject) : p,
          ),
        );
        showToast({
          title: "Project created",
          description: savedProject.name,
          type: "success",
        });
      } catch (error: any) {
        setProjects((prev) => prev.filter((p) => p.id !== tempId));
        showToast({
          title: "Project creation failed",
          description: error.message || "An unexpected error occurred",
          type: "error"
        });
      }
    },
    [showToast],
  );

  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>) => {
      // Optimistic UI update
      setProjects((prev) =>
        prev.map((project) =>
          project.id === id ? { ...project, ...updates } : project,
        ),
      );

      try {
        const { fetchAPI } = await import("./api");
        const payload: any = { ...updates };
        // Map UI names to DB names if necessary
        if (payload.status)
          payload.status = payload.status.replace(/-/g, "_").toUpperCase();

        if (payload.startDate !== undefined) {
          payload.start_date = payload.startDate;
          delete payload.startDate;
        }

        if (payload.endDate !== undefined) {
          payload.end_date = payload.endDate;
          delete payload.endDate;
        }

        if (payload.clientId !== undefined) {
          payload.client_id = payload.clientId || null;
          delete payload.clientId;
        }

        if (payload.teamId !== undefined) {
          payload.team_id = payload.teamId || null;
          delete payload.teamId;
        }

        if (payload.programId !== undefined) {
          payload.program_id = payload.programId || null;
          delete payload.programId;
        }

        // These are frontend-only fields; strip them before sending
        delete payload.key;
        delete payload.type;
        delete payload.name;
        delete payload.owner;
        delete payload.members;
        delete payload.aiConfidence;
        delete payload.riskLevel;
        delete payload.taskCount;
        delete payload.templateId;

        await fetchAPI(`/projects/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        showToast({ title: "Project updated", type: "success" });
      } catch (error) {
        // Rollback optimistic state
        showToast({ title: "Update failed", type: "error" });
      }
    },
    [showToast],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      const project = projects.find((p) => p.id === id);

      // Optimistic UI update
      setProjects((prev) => prev.filter((p) => p.id !== id));

      try {
        const { fetchAPI } = await import("./api");
        await fetchAPI(`/projects/${id}`, { method: "DELETE" });
        showToast({
          title: "Project deleted",
          description: project?.name,
          type: "success",
        });
      } catch (error) {
        // Rollback
        if (project) setProjects((prev) => [...prev, project]);
        showToast({ title: "Delete failed", type: "error" });
      }
    },
    [projects, showToast],
  );

  // Team actions
  const addTeam = useCallback(
    async (team: Omit<Team, "id">) => {
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
            project_ids: team.projectIds,
            capacity: team.capacity || 40,
            member_ids: team.members.map(m => m.id),
          }),
        });
        if (!savedTeam) throw new Error("No response from server");
        const savedTeamMapped = mapBackendTeam(savedTeam as any);
        setTeams((prev) =>
          prev.map((t) =>
            t.id === tempId ? savedTeamMapped : t,
          ),
        );
        showToast({
          title: "Team created",
          description: savedTeam.name,
          type: "success",
        });
        return savedTeamMapped;
      } catch (err) {
        setTeams((prev) => prev.filter((t) => t.id !== tempId));
        showToast({ title: "Team creation failed", type: "error" });
        throw err;
      }
    },
    [showToast],
  );

  const updateTeam = useCallback(
    async (id: string, updates: Partial<Team>) => {
      setTeams((prev) =>
        prev.map((team) => (team.id === id ? { ...team, ...updates } : team)),
      );

      try {
        const { fetchAPI } = await import("./api");

        // Map updates to backend schema
        const backendUpdates: any = { ...updates };
        if (updates.name) backendUpdates.name = updates.name;
        if (updates.description !== undefined) backendUpdates.description = updates.description;
        if (updates.projectManager) backendUpdates.project_manager_id = updates.projectManager.id;
        if (updates.lead !== undefined) backendUpdates.lead_id = updates.lead?.id || null;
        if (updates.productManager !== undefined) backendUpdates.product_manager_id = updates.productManager?.id || null;
        if (updates.projectIds) backendUpdates.project_ids = updates.projectIds;
        if (updates.capacity !== undefined) backendUpdates.capacity = updates.capacity;
        if (updates.members) backendUpdates.member_ids = updates.members.map(m => m.id);

        await fetchAPI(`/teams/${id}`, {
          method: "PATCH",
          body: JSON.stringify(backendUpdates),
        });
        showToast({ title: "Team updated", type: "success" });
      } catch (err) {
        showToast({ title: "Update failed", type: "error" });
      }
    },
    [showToast],
  );

  const deleteTeam = useCallback(
    async (id: string) => {
      const team = teams.find((t) => t.id === id);
      setTeams((prev) => prev.filter((t) => t.id !== id));

      try {
        const { fetchAPI } = await import("./api");
        await fetchAPI(`/teams/${id}`, { method: "DELETE" });
        showToast({
          title: "Team deleted",
          description: team?.name,
          type: "success",
        });
      } catch (err) {
        if (team) setTeams((prev) => [...prev, team]);
        showToast({ title: "Delete failed", type: "error" });
      }
    },
    [teams, showToast],
  );

  const addTeamMember = useCallback(
    async (teamId: string, userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      // Optimistic UI update
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId && !team.members.some((m) => m.id === userId)
            ? { ...team, members: [...team.members, user] }
            : team,
        ),
      );

      try {
        const { fetchAPI } = await import("./api");
        await fetchAPI(`/teams/${teamId}/members/${userId}`, {
          method: "POST",
        });
        showToast({
          title: "Member added",
          description: user.name,
          type: "success",
        });
      } catch (err) {
        // Rollback on failure
        setTeams((prev) =>
          prev.map((team) =>
            team.id === teamId
              ? { ...team, members: team.members.filter((m) => m.id !== userId) }
              : team,
          ),
        );
        showToast({ title: "Failed to add member", type: "error" });
      }
    },
    [users, showToast],
  );

  const removeTeamMember = useCallback(
    async (teamId: string, userId: string) => {
      const user = users.find((u) => u.id === userId);

      // Optimistic UI update
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId
            ? { ...team, members: team.members.filter((m) => m.id !== userId) }
            : team,
        ),
      );

      try {
        const { fetchAPI } = await import("./api");
        await fetchAPI(`/teams/${teamId}/members/${userId}`, {
          method: "DELETE",
        });
        showToast({
          title: "Member removed",
          description: user?.name,
          type: "success",
        });
      } catch (err) {
        // Rollback on failure
        if (user) {
          setTeams((prev) =>
            prev.map((team) =>
              team.id === teamId
                ? { ...team, members: [...team.members, user] }
                : team,
            ),
          );
        }
        showToast({ title: "Failed to remove member", type: "error" });
      }
    },
    [users, showToast],
  );

  const setTeamLead = useCallback(
    (teamId: string, userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;
      setTeams((prev) =>
        prev.map((team) =>
          team.id === teamId ? { ...team, lead: user } : team,
        ),
      );
      showToast({
        title: "Team lead updated",
        description: user.name,
        type: "success",
      });
    },
    [users, showToast],
  );

  // User actions
  const addUser = useCallback(
    async (userData: { name: string; email: string; password: string; role?: string }) => {
      try {
        const { fetchAPI } = await import("./api");
        const savedUser = await fetchAPI("/users", {
          method: "POST",
          body: JSON.stringify({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role || "MEMBER",
          }),
        });
        const newUser: User = {
          id: String(savedUser.id),
          name: savedUser.name,
          email: savedUser.email,
          role: (savedUser.role?.toLowerCase()?.replace('_', '-') || 'contributor') as any,
        };
        setUsers((prev) => [...prev, newUser]);
        showToast({
          title: "User created",
          description: savedUser.name,
          type: "success",
        });
        return newUser;
      } catch (error: any) {
        showToast({
          title: "User creation failed",
          description: error.message || "An unexpected error occurred",
          type: "error",
        });
        throw error;
      }
    },
    [showToast],
  );

  // Program actions
  const addProgram = useCallback(
    (program: Omit<Program, "id">) => {
      const newProgram: Program = {
        ...program,
        id: `prog-${Date.now()}`,
      };
      setPrograms((prev) => [...prev, newProgram]);
      showToast({
        title: "Program created",
        description: newProgram.name,
        type: "success",
      });
    },
    [showToast],
  );

  const updateProgram = useCallback(
    (id: string, updates: Partial<Program>) => {
      setPrograms((prev) =>
        prev.map((program) =>
          program.id === id ? { ...program, ...updates } : program,
        ),
      );
      showToast({ title: "Program updated", type: "success" });
    },
    [showToast],
  );

  const deleteProgram = useCallback(
    (id: string) => {
      const program = programs.find((p) => p.id === id);
      setPrograms((prev) => prev.filter((p) => p.id !== id));
      showToast({
        title: "Program deleted",
        description: program?.name,
        type: "success",
      });
    },
    [programs, showToast],
  );

  // Portfolio actions
  const addPortfolio = useCallback(
    (portfolio: Omit<Portfolio, "id">) => {
      const newPortfolio: Portfolio = {
        ...portfolio,
        id: `port-${Date.now()}`,
      };
      setPortfolios((prev) => [...prev, newPortfolio]);
      showToast({
        title: "Portfolio created",
        description: newPortfolio.name,
        type: "success",
      });
    },
    [showToast],
  );

  const updatePortfolio = useCallback(
    (id: string, updates: Partial<Portfolio>) => {
      setPortfolios((prev) =>
        prev.map((portfolio) =>
          portfolio.id === id ? { ...portfolio, ...updates } : portfolio,
        ),
      );
      showToast({ title: "Portfolio updated", type: "success" });
    },
    [showToast],
  );

  const deletePortfolio = useCallback(
    (id: string) => {
      const portfolio = portfolios.find((p) => p.id === id);
      setPortfolios((prev) => prev.filter((p) => p.id !== id));
      showToast({
        title: "Portfolio deleted",
        description: portfolio?.name,
        type: "success",
      });
    },
    [portfolios, showToast],
  );

  // Client actions
  const addClient = useCallback(
    async (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => {
      const tempId = `client-temp-${Date.now()}`;
      const now = new Date().toISOString();
      const newClient: Client = {
        ...client,
        id: tempId,
        createdAt: now,
        updatedAt: now,
      };
      setClients((prev) => [...prev, newClient]);

      try {
        const { fetchAPI, mapBackendClient } = await import("./api");
        const savedClient = await fetchAPI("/clients", {
          method: "POST",
          body: JSON.stringify(client),
        });
        const savedClientMapped = mapBackendClient(savedClient);
        setClients((prev) =>
          prev.map((c) => (c.id === tempId ? savedClientMapped : c)),
        );
        showToast({
          title: "Client created",
          description: savedClient.name,
          type: "success",
        });
        return savedClientMapped;
      } catch (err) {
        setClients((prev) => prev.filter((c) => c.id !== tempId));
        showToast({ title: "Client creation failed", type: "error" });
        throw err;
      }
    },
    [showToast],
  );

  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>) => {
      setClients((prev) =>
        prev.map((client) =>
          client.id === id
            ? { ...client, ...updates, updatedAt: new Date().toISOString() }
            : client,
        ),
      );

      try {
        const { fetchAPI } = await import("./api");
        await fetchAPI(`/clients/${id}`, {
          method: "PATCH",
          body: JSON.stringify(updates),
        });
        showToast({ title: "Client updated", type: "success" });
      } catch (err) {
        showToast({ title: "Client update failed", type: "error" });
      }
    },
    [showToast],
  );

  const deleteClient = useCallback(
    async (id: string) => {
      const client = clients.find((c) => c.id === id);
      setClients((prev) => prev.filter((c) => c.id !== id));

      try {
        const { fetchAPI } = await import("./api");
        await fetchAPI(`/clients/${id}`, { method: "DELETE" });
        showToast({
          title: "Client deleted",
          description: client?.name,
          type: "success",
        });
      } catch (err) {
        if (client) setClients((prev) => [...prev, client]);
        showToast({ title: "Delete failed", type: "error" });
      }
    },
    [clients, showToast],
  );

  // Time tracking actions
  const addTimeEntry = useCallback(
    async (entry: Omit<TimeEntry, "id" | "createdAt">) => {
      const tempId = `time-temp-${Date.now()}`;
      const newEntry: TimeEntry = {
        ...entry,
        id: tempId,
        createdAt: new Date().toISOString(),
      };
      setTimeEntries((prev) => [...prev, newEntry]);

      try {
        const { fetchAPI, mapBackendTimeEntry } = await import("./api");
        const savedEntry = await fetchAPI("/time-entries", {
          method: "POST",
          body: JSON.stringify({
            duration: Math.round(entry.hours * 60), // backend expects minutes
            date: entry.date,
            description: entry.description || "",
            task_id: entry.taskId,
            user_id: entry.userId,
          }),
        });
        setTimeEntries((prev) =>
          prev.map((e) =>
            e.id === tempId ? mapBackendTimeEntry(savedEntry) : e,
          ),
        );
        showToast({
          title: "Time logged",
          description: `${entry.hours}h logged`,
          type: "success",
        });
      } catch (err) {
        setTimeEntries((prev) => prev.filter((e) => e.id !== tempId));
        showToast({ title: "Time logging failed", type: "error" });
      }
    },
    [showToast],
  );

  const updateTimeEntry = useCallback(
    (id: string, updates: Partial<TimeEntry>) => {
      setTimeEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, ...updates } : entry,
        ),
      );
      showToast({ title: "Time entry updated", type: "success" });
    },
    [showToast],
  );

  const deleteTimeEntry = useCallback(
    (id: string) => {
      setTimeEntries((prev) => prev.filter((e) => e.id !== id));
      showToast({ title: "Time entry deleted", type: "success" });
    },
    [showToast],
  );

  const getTaskTimeEntries = useCallback(
    (taskId: string) => {
      return timeEntries.filter((e) => e.taskId === taskId);
    },
    [timeEntries],
  );

  const getUserTimeEntries = useCallback(
    (userId: string, startDate?: string, endDate?: string) => {
      return timeEntries.filter((e) => {
        if (e.userId !== userId) return false;
        if (startDate && e.date < startDate) return false;
        if (endDate && e.date > endDate) return false;
        return true;
      });
    },
    [timeEntries],
  );

  // Activity timer actions
  const startActivity = useCallback(
    async (taskId: string, description?: string) => {
      try {
        const { startActivity: apiStart, mapBackendTimeEntry } = await import("./api");
        const savedEntry = await apiStart(taskId, description);
        const mapped = mapBackendTimeEntry(savedEntry);
        setTimeEntries((prev) => {
          // Remove any existing running entries for this user (auto-stopped by backend)
          const updated = prev.map((e) =>
            e.userId === mapped.userId && e.isRunning ? { ...e, isRunning: false } : e
          );
          return [mapped, ...updated];
        });
        showToast({ title: "Timer started", type: "success" });
        return mapped;
      } catch (err: any) {
        showToast({ title: "Failed to start timer", description: err.message, type: "error" });
        return null;
      }
    },
    [showToast],
  );

  const stopActivity = useCallback(
    async (entryId: string, description?: string) => {
      try {
        const { stopActivity: apiStop, mapBackendTimeEntry } = await import("./api");
        const savedEntry = await apiStop(entryId, description);
        const mapped = mapBackendTimeEntry(savedEntry);
        setTimeEntries((prev) =>
          prev.map((e) => (e.id === entryId ? mapped : e)),
        );
        showToast({ title: "Timer stopped", description: `${mapped.hours.toFixed(1)}h logged`, type: "success" });
        return mapped;
      } catch (err: any) {
        showToast({ title: "Failed to stop timer", description: err.message, type: "error" });
        return null;
      }
    },
    [showToast],
  );

  const getTaskActivitiesFn = useCallback(
    async (taskId: string): Promise<TimeEntry[]> => {
      try {
        const { getTaskActivities: apiFetch, mapBackendTimeEntry } = await import("./api");
        const entries = await apiFetch(taskId);
        if (Array.isArray(entries)) {
          const mapped = entries.map(mapBackendTimeEntry);
          return mapped;
        }
        return [];
      } catch {
        return [];
      }
    },
    [],
  );

  // Resource allocation actions
  const addResourceAllocation = useCallback(
    (allocation: Omit<ResourceAllocation, "id">) => {
      const newAllocation: ResourceAllocation = {
        ...allocation,
        id: `ra-${Date.now()}`,
      };
      setResourceAllocations((prev) => [...prev, newAllocation]);
      showToast({ title: "Resource allocated", type: "success" });
    },
    [showToast],
  );

  const updateResourceAllocation = useCallback(
    (id: string, updates: Partial<ResourceAllocation>) => {
      setResourceAllocations((prev) =>
        prev.map((allocation) =>
          allocation.id === id ? { ...allocation, ...updates } : allocation,
        ),
      );
      showToast({ title: "Allocation updated", type: "success" });
    },
    [showToast],
  );

  const deleteResourceAllocation = useCallback(
    (id: string) => {
      setResourceAllocations((prev) => prev.filter((a) => a.id !== id));
      showToast({ title: "Allocation removed", type: "success" });
    },
    [showToast],
  );

  const getUserAllocations = useCallback(
    (userId: string) => {
      return resourceAllocations.filter((a) => a.userId === userId);
    },
    [resourceAllocations],
  );

  const getProjectAllocations = useCallback(
    (projectId: string) => {
      return resourceAllocations.filter((a) => a.projectId === projectId);
    },
    [resourceAllocations],
  );

  // Modal actions
  const openModal = useCallback(
    (type: ModalType, data?: Record<string, unknown>) => {
      setModal({ type, data });
    },
    [],
  );

  const closeModal = useCallback(() => {
    setModal({ type: null });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Utility functions
  const getUser = useCallback(
    (id: string) => users.find((u) => u.id === id),
    [users],
  );
  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  );
  const getTask = useCallback(
    (id: string) => tasks.find((t) => t.id === id),
    [tasks],
  );
  const getTeam = useCallback(
    (id: string) => teams.find((t) => t.id === id),
    [teams],
  );
  const getProgram = useCallback(
    (id: string) => programs.find((p) => p.id === id),
    [programs],
  );
  const getPortfolio = useCallback(
    (id: string) => portfolios.find((p) => p.id === id),
    [portfolios],
  );
  const getSprint = useCallback(
    (id: string) => sprints.find((s) => s.id === id),
    [sprints],
  );

  const value: AppContextType = {
    tasks,
    projects,
    teams,
    programs,
    portfolios,
    clients,
    users,
    timeEntries,
    resourceAllocations,
    sprints,
    currentUser,
    currentProject,
    selectedTasks,
    modal,
    toasts,
    searchOpen,
    aiCopilotOpen,
    isAuthenticated,
    token,
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
    // User actions
    addUser,
    // Program actions
    addProgram,
    updateProgram,
    deleteProgram,
    // Portfolio actions
    addPortfolio,
    updatePortfolio,
    deletePortfolio,
    // Client actions
    addClient,
    updateClient,
    deleteClient,
    // Sprint actions
    addSprint,
    updateSprint,
    deleteSprint,
    // Time tracking actions
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getTaskTimeEntries,
    getUserTimeEntries,
    // Activity timer actions
    startActivity,
    stopActivity,
    getTaskActivities: getTaskActivitiesFn,
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
    getSprint,
    // Auth actions
    loginAction,
    signupAction,
    logoutAction,
    isMounted,
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
