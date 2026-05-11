import { BackendProject, BackendTask, BackendTeam, BackendUser, Project, Task, Team, ProjectStatus, TaskStatus, TaskPriority, UserRole } from './types';
import type { LoginResponse } from './auth';
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8100/api/v1";

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      typeof errorData.detail === "object"
        ? JSON.stringify(errorData.detail)
        : errorData.detail || `API error: ${response.status} ${response.statusText}`,
    );
  }

  // Some endpoints might return empty responses for 204 or similar
  if (response.status === 204) return null;

  return response.json();
}

// Mappers to bridge backend schema with frontend mock schema requirements
export function mapBackendProject(backendProject: BackendProject): Project {
  return {
    ...backendProject,
    type: 'agile-kanban', // Default for now
    id: String(backendProject.id),
    name: backendProject.name,
    key: backendProject.project_key || backendProject.name.substring(0, 3).toUpperCase(),
    status: (backendProject.status?.toLowerCase() || 'active') as ProjectStatus,
    progress: backendProject.progress || 0,
    aiConfidence: backendProject.ai_confidence || 85,
    riskLevel: backendProject.risk_level || 'low',
    startDate: backendProject.start_date || new Date().toISOString(),
    endDate: backendProject.end_date,
    owner: backendProject.owner ? {
      id: String(backendProject.owner.id),
      name: backendProject.owner.name,
      email: backendProject.owner.email,
      role: (backendProject.owner.role || 'project-manager') as UserRole
    } : { id: 'unknown', name: 'Unknown Owner', email: '', role: 'viewer' },
    members: backendProject.members ? backendProject.members.map((m: BackendUser) => ({
      id: String(m.id),
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      role: (m.role || 'contributor') as UserRole
    })) : [],
    taskCount: backendProject.task_count || 0,
    clientId: backendProject.client_id,
    teamId: backendProject.team_id,
    programId: backendProject.program_id
  };
}

export function mapBackendTask(backendTask: BackendTask): Task {
  const statusMap: Record<string, TaskStatus> = {
    'TODO': 'open',
    'ASSIGNED': 'assigned',
    'IN_PROGRESS': 'in-progress',
    'IN_REVIEW': 'pending-approval',
    'DONE': 'closed',
  };

  const priorityMap: Record<string, TaskPriority> = {
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'URGENT': 'critical',
  };

  return {
    ...backendTask,
    id: String(backendTask.id),
    key: backendTask.task_code || `TSK-${backendTask.id}`,
    title: backendTask.title,
    description: backendTask.description || '',
    status: statusMap[backendTask.status] || 'open',
    priority: priorityMap[backendTask.priority] || 'medium',
    type: 'task',
    projectId: String(backendTask.project_id),
    storyPoints: backendTask.story_points || 0,
    assignee: backendTask.assignee ? {
      id: String(backendTask.assignee.id),
      name: backendTask.assignee.name,
      email: backendTask.assignee.email,
      avatar: backendTask.assignee.avatar,
      role: 'contributor' as UserRole
    } : undefined,
    reporter: backendTask.reporter ? {
      id: String(backendTask.reporter.id),
      name: backendTask.reporter.name,
      email: backendTask.reporter.email,
      role: (backendTask.reporter.role || 'contributor') as UserRole
    } : { id: 'u1', name: 'System Admin', email: 'admin@hexerve.com', role: 'super-admin' as UserRole },
    tags: [],
    startDate: backendTask.start_date,
    dueDate: backendTask.due_date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function mapBackendTeam(backendTeam: BackendTeam): Team {
  const defaultUser = { id: 'u1', name: 'System Admin', email: 'admin@hexerve.com', role: 'super-admin' as UserRole };

  return {
    ...backendTeam,
    projects: [], // Placeholder
    id: String(backendTeam.id),
    name: backendTeam.name || "Unnamed Team",
    description: backendTeam.description || "",
    avatar: undefined,
    projectManager: backendTeam.project_manager ? {
      id: String(backendTeam.project_manager.id),
      name: backendTeam.project_manager.name,
      email: backendTeam.project_manager.email,
      role: (backendTeam.project_manager.role || 'project-manager') as UserRole
    } : { id: 'unknown', name: 'Not Assigned', email: '', role: 'project-manager' as UserRole },
    lead: backendTeam.lead ? {
      id: String(backendTeam.lead.id),
      name: backendTeam.lead.name,
      email: backendTeam.lead.email,
      role: (backendTeam.lead.role || 'team-lead') as UserRole
    } : undefined,
    productManager: backendTeam.product_manager ? {
      id: String(backendTeam.product_manager.id),
      name: backendTeam.product_manager.name,
      email: backendTeam.product_manager.email,
      role: (backendTeam.product_manager.role || 'portfolio-manager') as UserRole
    } : undefined,
    members: backendTeam.members ? backendTeam.members.map((m: BackendUser) => ({
      id: String(m.id),
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      role: (m.role || 'contributor') as UserRole
    })) : [],
    projectIds: backendTeam.project_ids ? backendTeam.project_ids.map(String) : [],
    velocity: Number(backendTeam.velocity) || 0,
    capacity: Number(backendTeam.capacity) || 0,
  };
}

export function mapBackendPortfolio(backendPortfolio: any) {
  return {
    ...backendPortfolio,
    id: String(backendPortfolio.id),
    name: backendPortfolio.name,
    description: backendPortfolio.description || "",
    progress: backendPortfolio.progress || 0,
    budget: backendPortfolio.budget || 0,
    spent: backendPortfolio.spent || 0,
    programs: backendPortfolio.programs ? backendPortfolio.programs.map(mapBackendProgram) : [],
  };
}

export function mapBackendProgram(backendProgram: any) {
  return {
    ...backendProgram,
    id: String(backendProgram.id),
    name: backendProgram.name,
    description: backendProgram.description || "",
    progress: backendProgram.progress || 0,
    budget: backendProgram.budget || 0,
    spent: backendProgram.spent || 0,
    projects: backendProgram.projects ? backendProgram.projects.map(mapBackendProject) : [],
  };
}

export function mapBackendSprint(backendSprint: any) {
  return {
    ...backendSprint,
    id: String(backendSprint.id),
    name: backendSprint.name,
    goal: backendSprint.goal || "",
    status: backendSprint.status || "active",
    startDate: backendSprint.start_date,
    endDate: backendSprint.end_date,
    velocity: backendSprint.velocity || 0,
    projectId: backendSprint.project_id ? String(backendSprint.project_id) : "",
  };
}


export function mapBackendClient(backendClient: any) {
  return {
    ...backendClient,
    id: String(backendClient.id),
    name: backendClient.name,
    email: backendClient.email || "",
    phone: backendClient.phone || "",
    company: backendClient.company || "",
    type: backendClient.type || "external",
    address: backendClient.address || "",
    notes: backendClient.notes || "",
  };
}

export function mapBackendInvoice(backendInvoice: any) {
  return {
    ...backendInvoice,
    id: String(backendInvoice.id),
    invoiceNumber: backendInvoice.invoice_number || `INV-${backendInvoice.id}`,
    amount: backendInvoice.amount,
    status: backendInvoice.status?.toLowerCase() || 'draft',
    dueDate: backendInvoice.due_date,
  };
}

export function mapBackendTimeEntry(backendEntry: any) {
  return {
    ...backendEntry,
    id: String(backendEntry.id),
    taskId: String(backendEntry.task_id),
    userId: String(backendEntry.user_id),
    hours: backendEntry.duration != null ? backendEntry.duration / 60 : 0, // Convert API minutes to frontend hours
    date: backendEntry.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    description: backendEntry.description || "",
    createdAt: new Date().toISOString(),
    // Timer fields
    startAt: backendEntry.start_at || null,
    endAt: backendEntry.end_at || null,
    isRunning: backendEntry.is_running || false,
  };
}

// ── Activity Timer API helpers ────────────────────────────────────────────

export async function startActivity(taskId: string, description?: string) {
  return fetchAPI("/time-entries/start", {
    method: "POST",
    body: JSON.stringify({ task_id: taskId, description: description || "" }),
  });
}

export async function stopActivity(entryId: string, description?: string) {
  return fetchAPI(`/time-entries/stop/${entryId}`, {
    method: "POST",
    body: JSON.stringify({ description }),
  });
}

export async function stopCurrentActivity(description?: string) {
  return fetchAPI("/time-entries/stop", {
    method: "POST",
    body: JSON.stringify({ description }),
  });
}

export async function getActiveActivity() {
  return fetchAPI("/time-entries/active");
}

export async function getTaskActivities(taskId: string) {
  return fetchAPI(`/time-entries/task/${taskId}`);
}
