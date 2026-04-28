// Core data types for the PM platform

export type TaskStatus = 'open' | 'assigned' | 'in-progress' | 'pending-approval' | 'on-hold' | 'closed';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type ProjectType = 'agile-scrum' | 'agile-kanban' | 'waterfall' | 'hybrid';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type UserRole = 'super-admin' | 'org-admin' | 'portfolio-manager' | 'program-manager' | 'project-manager' | 'team-lead' | 'contributor' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  editHistory?: { content: string; editedAt: string }[];
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface TaskLink {
  id: string;
  sourceTaskId: string;
  targetTaskId: string;
  linkType: 'blocks' | 'blocked-by' | 'relates-to' | 'duplicates' | 'is-duplicated-by' | 'parent-of' | 'child-of';
}

export interface Task {
  id: string;
  key: string; // e.g., PRO-1234
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: 'epic' | 'story' | 'task' | 'subtask' | 'bug';
  assignee?: User;
  reporter: User;
  tags: Tag[];
  storyPoints?: number;
  estimatedHours?: number;
  startDate?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  sprintId?: string;
  projectId: string;
  // New fields
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  linkedTasks?: TaskLink[];
  group?: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  projectId: string;
  velocity?: number;
}

export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'cancelled' | 'planning';

export interface Project {
  id: string;
  name: string;
  key: string; // e.g., PRO (first 3 letters)
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  programId?: string;
  owner: User;
  members: User[];
  aiConfidence: number; // 0-100
  riskLevel: RiskLevel;
  progress: number; // 0-100
  budget?: number;
  spent?: number;
  clientId?: string; // External or internal client
  templateId?: string; // Template used to create the project
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  portfolioId: string;
  projects: Project[];
  owner: User;
  startDate: string;
  endDate?: string;
  aiConfidence: number;
  riskLevel: RiskLevel;
  progress: number;
  projectIds: string[];
  budget: number;
  spent: number;
  status: 'active' | 'on-hold' | 'completed' | 'planning';
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  programs: Program[];
  owner: User;
  budget: number;
  spent: number;
  aiConfidence: number;
  riskLevel: RiskLevel;
  programIds: string[];
  progress: number;
  status: 'active' | 'on-hold' | 'completed' | 'planning';
}

export interface AIInsight {
  id: string;
  type: 'risk' | 'recommendation' | 'prediction' | 'optimization';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  relatedEntityType: 'task' | 'project' | 'program' | 'portfolio';
  relatedEntityId: string;
  createdAt: string;
  actionable: boolean;
  action?: string;
}

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  tasksCompleted: number;
  tasksInProgress: number;
  overdueTasks: number;
  averageVelocity: number;
  budgetUtilization: number;
  teamUtilization: number;
  aiConfidenceScore: number;
  upcomingDeadlines: number;
}

// Project Templates
export type TemplateCategory = 
  | 'software-development'
  | 'mobile-development'
  | 'social-media'
  | 'product-launch'
  | 'creative-video'
  | 'ads-management'
  | 'marketing'
  | 'operations'
  | 'custom';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  color: string;
  defaultTasks: {
    title: string;
    type: 'epic' | 'story' | 'task' | 'subtask' | 'bug';
    priority: TaskPriority;
    estimatedHours?: number;
    storyPoints?: number;
  }[];
  defaultSprints?: {
    name: string;
    durationDays: number;
    goal?: string;
  }[];
  suggestedTags: string[];
  projectType: ProjectType;
}

// Clients
export type ClientType = 'external' | 'internal';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  type: ClientType;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Products for Invoices
export interface Product {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  unit: string; // e.g., 'hour', 'piece', 'month', 'project'
  taxRate: number; // percentage
  category?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Invoices
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  projectId?: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
}
// Backend API types for mapping
export interface BackendUser {
  id: number | string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface BackendProject {
  id: number | string;
  name: string;
  project_key?: string;
  description?: string;
  status?: string;
  progress?: number;
  ai_confidence?: number;
  risk_level?: RiskLevel;
  start_date?: string;
  owner?: BackendUser;
  members?: BackendUser[];
}

export interface BackendTask {
  id: number | string;
  task_code?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  project_id: number | string;
  assignee?: BackendUser;
  reporter?: BackendUser;
}

export interface BackendTeam {
  id: number | string;
  name: string;
  description?: string;
  lead?: BackendUser;
  members?: BackendUser[];
  project_ids?: (number | string)[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  lead: User;
  members: User[];
  projects: Project[];
  projectIds: string[];
  velocity: number;
  capacity: number;
}
