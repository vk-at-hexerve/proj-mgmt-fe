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
    throw new Error(errorData.detail || `API error: ${response.status} ${response.statusText}`);
  }

  // Some endpoints might return empty responses for 204 or similar
  if (response.status === 204) return null;

  return response.json();
}

// Mappers to bridge backend schema with frontend mock schema requirements
export function mapBackendProject(backendProject: any) {
  return {
    ...backendProject,
    id: String(backendProject.id),
    name: backendProject.name,
    key: backendProject.name.substring(0, 3).toUpperCase(),
    status: backendProject.status?.toLowerCase() || 'active',
    type: 'agile-scrum',
    startDate: new Date().toISOString(),
    owner: { id: 'u1', name: 'System Admin', email: 'admin@hexerve.com', role: 'admin' }, // Fallback mock owner
    members: [],
    aiConfidence: 85,
    riskLevel: 'low',
    progress: 0
  };
}

export function mapBackendTask(backendTask: any) {
  const statusMap: Record<string, any> = {
    'TODO': 'open',
    'IN_PROGRESS': 'in-progress',
    'IN_REVIEW': 'pending-approval',
    'DONE': 'closed',
  };

  const priorityMap: Record<string, any> = {
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
    assignee: backendTask.assignee ? {
      id: String(backendTask.assignee.id),
      name: backendTask.assignee.name,
      email: backendTask.assignee.email,
      avatar: backendTask.assignee.avatar,
      role: 'contributor'
    } : undefined,
    reporter: { id: 'u1', name: 'System Admin', email: 'admin@hexerve.com', role: 'admin' }, // Fallback mock reporter
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function mapBackendTeam(backendTeam: any) {
  return {
    ...backendTeam,
    id: String(backendTeam.id),
    name: backendTeam.name || "Unnamed Team",
    description: backendTeam.description || "",
    avatar: undefined,
    lead: { id: 'u1', name: 'System Admin', email: 'admin@hexerve.com', role: 'admin' }, // Fallback mock 
    members: [], // Teams API usually returns members separately or needs joining
  };
}

export function mapBackendTimeEntry(backendEntry: any) {
  return {
    ...backendEntry,
    id: String(backendEntry.id),
    taskId: String(backendEntry.task_id),
    userId: String(backendEntry.user_id),
    hours: backendEntry.duration / 60, // Convert API minutes to frontend hours
    date: backendEntry.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    description: backendEntry.description || "",
    createdAt: new Date().toISOString(),
  };
}
