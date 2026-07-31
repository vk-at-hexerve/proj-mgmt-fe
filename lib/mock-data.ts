import type { User, Tag, Task, Sprint, Project, AIInsight, DashboardMetrics, ProjectTemplate, Client, Product, Invoice } from './types';

export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Morgan',
  email: 'alex@nexuspm.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  role: 'project-manager',
};

export const users: User[] = [];

export const tags: Tag[] = [
  { id: 'tag-1', name: 'Frontend', color: '#7B68EE' },
  { id: 'tag-2', name: 'Backend', color: '#3B82F6' },
  { id: 'tag-3', name: 'Design', color: '#F59E0B' },
  { id: 'tag-4', name: 'Bug', color: '#EF4444' },
  { id: 'tag-5', name: 'Feature', color: '#22C55E' },
  { id: 'tag-6', name: 'Documentation', color: '#8B5CF6' },
];

export const sprints: Sprint[] = [];

export const tasks: Task[] = [];

export const projects: Project[] = [];

export const aiInsights: AIInsight[] = [];

export const dashboardMetrics: DashboardMetrics = {
  totalProjects: 0,
  activeProjects: 0,
  tasksCompleted: 0,
  tasksInProgress: 0,
  overdueTasks: 0,
  averageVelocity: 0,
  budgetUtilization: 0,
  teamUtilization: 0,
  aiConfidenceScore: 0,
  upcomingDeadlines: 0,
};

export interface Team {
  id: string;
  name: string;
  description: string;
  members: User[];
  lead: User;
  projectIds: string[];
  avatar?: string;
  velocity: number;
  capacity: number;
}

export const teams: Team[] = [];

export interface Program {
  id: string;
  name: string;
  description: string;
  portfolioId: string;
  projects: Project[];
  owner: User;
  startDate: string;
  endDate?: string;
  aiConfidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  budget: number;
  spent: number;
  status: 'active' | 'on-hold' | 'completed' | 'planning';
}

export const programs: Program[] = [];

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  programs: Program[];
  owner: User;
  budget: number;
  spent: number;
  aiConfidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  status: 'active' | 'on-hold' | 'completed';
}

export const portfolios: Portfolio[] = [];

// Calendar events derived from tasks
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'task' | 'sprint' | 'milestone' | 'meeting';
  color: string;
  taskId?: string;
  projectId?: string;
}

export const generateCalendarEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = [];

  // Add task due dates
  tasks.forEach((task) => {
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      events.push({
        id: `event-${task.id}`,
        title: task.title,
        start: dueDate,
        end: dueDate,
        type: 'task',
        color: task.priority === 'critical' ? '#EF4444' : task.priority === 'high' ? '#F59E0B' : '#3B82F6',
        taskId: task.id,
        projectId: task.projectId,
      });
    }
  });

  // Add sprint dates
  sprints.forEach((sprint) => {
    events.push({
      id: `event-sprint-${sprint.id}-start`,
      title: `${sprint.name} Start`,
      start: new Date(sprint.startDate),
      end: new Date(sprint.startDate),
      type: 'sprint',
      color: '#7B68EE',
      projectId: sprint.projectId,
    });
    events.push({
      id: `event-sprint-${sprint.id}-end`,
      title: `${sprint.name} End`,
      start: new Date(sprint.endDate),
      end: new Date(sprint.endDate),
      type: 'sprint',
      color: '#7B68EE',
      projectId: sprint.projectId,
    });
  });

  // Add some sample milestones
  events.push({
    id: 'milestone-1',
    title: 'MVP Release',
    start: new Date('2026-02-15'),
    end: new Date('2026-02-15'),
    type: 'milestone',
    color: '#22C55E',
    projectId: 'proj-1',
  });

  events.push({
    id: 'milestone-2',
    title: 'Beta Launch',
    start: new Date('2026-03-01'),
    end: new Date('2026-03-01'),
    type: 'milestone',
    color: '#22C55E',
    projectId: 'proj-2',
  });

  return events;
};

// Gantt chart data
export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'project' | 'task' | 'milestone';
  dependencies?: string[];
  assignee?: User;
  projectId?: string;
  isMilestone?: boolean;
  parentId?: string;
}

export const generateGanttData = (): GanttTask[] => {
  const ganttTasks: GanttTask[] = [];

  // Add projects as parent items
  projects.forEach((project) => {
    ganttTasks.push({
      id: project.id,
      name: project.name,
      start: new Date(project.startDate),
      end: project.endDate ? new Date(project.endDate) : new Date('2026-06-30'),
      progress: project.progress,
      type: 'project',
    });
  });

  // Add tasks with estimated durations
  tasks.forEach((task) => {
    const createdDate = new Date(task.createdAt);
    const dueDate = task.dueDate ? new Date(task.dueDate) : new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    let progress = task.storyPoints ? Math.min(100, task.storyPoints * 10) : 0;

    ganttTasks.push({
      id: task.id,
      name: `${task.key}: ${task.title}`,
      start: createdDate,
      end: dueDate,
      progress,
      type: task.type === 'epic' ? 'project' : 'task',
      assignee: task.assignee,
      projectId: task.projectId,
      isMilestone: task.isMilestone,
    });
  });

  return ganttTasks;
};

// Project Templates
export const projectTemplates: ProjectTemplate[] = [
  {
    id: 'tpl-blank',
    name: 'Blank Project',
    description: 'Start from scratch with a custom project structure',
    category: 'custom',
    icon: 'FolderPlus',
    color: '#9CA3AF',
    projectType: 'agile-scrum',
    suggestedTags: [],
    defaultTasks: [],
  },
  {
    id: 'tpl-lead',
    name: 'Lead Tracking',
    description: 'Track and manage potential clients and leads',
    category: 'sales',
    icon: 'Target',
    color: '#8B5CF6',
    projectType: 'agile-kanban',
    suggestedTags: ['Lead', 'Prospect', 'Follow-up', 'Hot', 'Cold'],
    defaultTasks: [],
  },
  {
    id: 'tpl-opportunity',
    name: 'Opportunity / Deal',
    description: 'Manage sales deals from discovery to close',
    category: 'sales',
    icon: 'Handshake',
    color: '#10B981',
    projectType: 'agile-kanban',
    suggestedTags: ['Deal', 'Proposal', 'Contract', 'Negotiation'],
    defaultTasks: [],
  },
  {
    id: 'tpl-finance',
    name: 'Finance',
    description: 'Track invoices, payments, and subscriptions',
    category: 'finance',
    icon: 'Receipt',
    color: '#F59E0B',
    projectType: 'agile-kanban',
    suggestedTags: ['Invoice', 'Payment', 'Subscription', 'Refund'],
    defaultTasks: [],
  },
  {
    id: 'tpl-onboarding',
    name: 'Customer Onboarding',
    description: 'Guide new customers through setup and training',
    category: 'onboarding',
    icon: 'UserCheck',
    color: '#3B82F6',
    projectType: 'agile-kanban',
    suggestedTags: ['Onboarding', 'Kickoff', 'Training', 'Integration'],
    defaultTasks: [],
  },
  {
    id: 'tpl-managed-service',
    name: 'Managed Service / BAU',
    description: 'Manage recurring service delivery and BAU operations',
    category: 'services',
    icon: 'Wrench',
    color: '#6366F1',
    projectType: 'agile-kanban',
    suggestedTags: ['BAU', 'Service', 'Monthly', 'Renewal'],
    defaultTasks: [],
  },
  {
    id: 'tpl-ai-agent',
    name: 'AI Agent',
    description: 'Track AI-driven automation workflows and escalations',
    category: 'ai',
    icon: 'Bot',
    color: '#D946EF',
    projectType: 'agile-kanban',
    suggestedTags: ['AI', 'Automation', 'Escalation', 'Exception'],
    defaultTasks: [],
  },
  {
    id: 'tpl-customer-health',
    name: 'Customer Health',
    description: 'Monitor customer health scores and churn risk',
    category: 'customer-success',
    icon: 'HeartPulse',
    color: '#EF4444',
    projectType: 'agile-kanban',
    suggestedTags: ['Health', 'Churn', 'At Risk', 'Retention'],
    defaultTasks: [],
  },
];

// Clients
export const clients: Client[] = [];

// Products for invoicing
export const products: Product[] = [
  {
    id: 'prod-1',
    name: 'Software Development',
    description: 'Custom software development services',
    unitPrice: 150,
    unit: 'hour',
    taxRate: 0,
    category: 'Development',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'prod-2',
    name: 'UI/UX Design',
    description: 'User interface and experience design',
    unitPrice: 125,
    unit: 'hour',
    taxRate: 0,
    category: 'Design',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'prod-3',
    name: 'Project Management',
    description: 'Project coordination and management',
    unitPrice: 100,
    unit: 'hour',
    taxRate: 0,
    category: 'Management',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'prod-4',
    name: 'Consulting',
    description: 'Strategic consulting services',
    unitPrice: 200,
    unit: 'hour',
    taxRate: 0,
    category: 'Consulting',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'prod-5',
    name: 'Monthly Retainer - Basic',
    description: '20 hours of development support per month',
    unitPrice: 2500,
    unit: 'month',
    taxRate: 0,
    category: 'Retainer',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'prod-6',
    name: 'Monthly Retainer - Pro',
    description: '40 hours of development support per month',
    unitPrice: 4500,
    unit: 'month',
    taxRate: 0,
    category: 'Retainer',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'prod-7',
    name: 'Video Production',
    description: 'Video production and editing services',
    unitPrice: 175,
    unit: 'hour',
    taxRate: 0,
    category: 'Creative',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'prod-8',
    name: 'Social Media Management',
    description: 'Monthly social media management',
    unitPrice: 1500,
    unit: 'month',
    taxRate: 0,
    category: 'Marketing',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

// Sample invoices
export const invoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    clientId: 'client-1',
    projectId: 'proj-1',
    status: 'paid',
    issueDate: '2026-01-01',
    dueDate: '2026-01-31',
    lineItems: [
      { id: 'li-1', productId: 'prod-1', description: 'Software Development - January', quantity: 80, unitPrice: 150, taxRate: 0, total: 12000 },
      { id: 'li-2', productId: 'prod-3', description: 'Project Management', quantity: 20, unitPrice: 100, taxRate: 0, total: 2000 },
    ],
    subtotal: 14000,
    taxTotal: 0,
    total: 14000,
    notes: 'Thank you for your business!',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-15',
    paidAt: '2026-01-15',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    clientId: 'client-2',
    status: 'sent',
    issueDate: '2026-01-15',
    dueDate: '2026-02-14',
    lineItems: [
      { id: 'li-3', productId: 'prod-2', description: 'UI/UX Design - App Redesign', quantity: 40, unitPrice: 125, taxRate: 0, total: 5000 },
      { id: 'li-4', productId: 'prod-1', description: 'Frontend Development', quantity: 60, unitPrice: 150, taxRate: 0, total: 9000 },
    ],
    subtotal: 14000,
    taxTotal: 0,
    total: 14000,
    createdAt: '2026-01-15',
    updatedAt: '2026-01-15',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2026-003',
    clientId: 'client-5',
    status: 'draft',
    issueDate: '2026-01-20',
    dueDate: '2026-02-19',
    lineItems: [
      { id: 'li-5', productId: 'prod-7', description: 'Video Production - Q1 Campaign', quantity: 30, unitPrice: 175, taxRate: 0, total: 5250 },
    ],
    subtotal: 5250,
    taxTotal: 0,
    total: 5250,
    createdAt: '2026-01-20',
    updatedAt: '2026-01-20',
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV-2025-045',
    clientId: 'client-1',
    status: 'overdue',
    issueDate: '2025-12-01',
    dueDate: '2025-12-31',
    lineItems: [
      { id: 'li-6', productId: 'prod-4', description: 'Strategic Consulting', quantity: 15, unitPrice: 200, taxRate: 0, total: 3000 },
    ],
    subtotal: 3000,
    taxTotal: 0,
    total: 3000,
    notes: 'Payment overdue - please remit immediately',
    createdAt: '2025-12-01',
    updatedAt: '2026-01-10',
  },
];
