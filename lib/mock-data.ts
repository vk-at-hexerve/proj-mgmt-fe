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
    id: 'tpl-1',
    name: 'Software Development',
    description: 'Full-stack web application development with agile methodology',
    category: 'software-development',
    icon: 'Code2',
    color: '#3B82F6',
    projectType: 'agile-scrum',
    suggestedTags: ['Frontend', 'Backend', 'API', 'Database', 'Testing'],
    defaultSprints: [
      { name: 'Sprint 1 - Foundation', durationDays: 14, goal: 'Set up project infrastructure and core architecture' },
      { name: 'Sprint 2 - Core Features', durationDays: 14, goal: 'Implement primary user features' },
      { name: 'Sprint 3 - Integration', durationDays: 14, goal: 'API integration and testing' },
    ],
    defaultTasks: [
      { title: 'Set up development environment', type: 'task', priority: 'high', storyPoints: 2 },
      { title: 'Create database schema', type: 'task', priority: 'high', storyPoints: 3 },
      { title: 'Implement user authentication', type: 'story', priority: 'critical', storyPoints: 8 },
      { title: 'Build REST API endpoints', type: 'story', priority: 'high', storyPoints: 13 },
      { title: 'Create UI components', type: 'story', priority: 'high', storyPoints: 8 },
      { title: 'Write unit tests', type: 'task', priority: 'medium', storyPoints: 5 },
      { title: 'Set up CI/CD pipeline', type: 'task', priority: 'medium', storyPoints: 3 },
      { title: 'Documentation', type: 'task', priority: 'low', storyPoints: 3 },
    ],
  },
  {
    id: 'tpl-2',
    name: 'Mobile App Development',
    description: 'Native or cross-platform mobile application development',
    category: 'mobile-development',
    icon: 'Smartphone',
    color: '#10B981',
    projectType: 'agile-scrum',
    suggestedTags: ['iOS', 'Android', 'React Native', 'UI/UX', 'API'],
    defaultSprints: [
      { name: 'Sprint 1 - Design & Setup', durationDays: 14, goal: 'Design system and project setup' },
      { name: 'Sprint 2 - Core Screens', durationDays: 14, goal: 'Build main app screens' },
      { name: 'Sprint 3 - Features', durationDays: 14, goal: 'Implement key features' },
      { name: 'Sprint 4 - Polish & Launch', durationDays: 14, goal: 'Testing, polish, and app store submission' },
    ],
    defaultTasks: [
      { title: 'Design app wireframes', type: 'task', priority: 'high', storyPoints: 5 },
      { title: 'Set up React Native project', type: 'task', priority: 'high', storyPoints: 2 },
      { title: 'Create navigation structure', type: 'story', priority: 'high', storyPoints: 5 },
      { title: 'Build onboarding flow', type: 'story', priority: 'medium', storyPoints: 5 },
      { title: 'Implement authentication', type: 'story', priority: 'critical', storyPoints: 8 },
      { title: 'Build home screen', type: 'story', priority: 'high', storyPoints: 5 },
      { title: 'Add push notifications', type: 'story', priority: 'medium', storyPoints: 5 },
      { title: 'App store submission', type: 'task', priority: 'high', storyPoints: 3 },
    ],
  },
  {
    id: 'tpl-3',
    name: 'Social Media Management',
    description: 'Plan and manage social media content across platforms',
    category: 'social-media',
    icon: 'Share2',
    color: '#EC4899',
    projectType: 'agile-kanban',
    suggestedTags: ['Instagram', 'Twitter', 'LinkedIn', 'Content', 'Analytics'],
    defaultTasks: [
      { title: 'Content calendar setup', type: 'task', priority: 'high', storyPoints: 3 },
      { title: 'Create brand guidelines', type: 'task', priority: 'high', storyPoints: 5 },
      { title: 'Design post templates', type: 'task', priority: 'medium', storyPoints: 5 },
      { title: 'Write weekly content batch', type: 'task', priority: 'high', storyPoints: 8 },
      { title: 'Schedule posts', type: 'task', priority: 'medium', storyPoints: 2 },
      { title: 'Engage with audience', type: 'task', priority: 'medium', storyPoints: 3 },
      { title: 'Weekly analytics review', type: 'task', priority: 'medium', storyPoints: 2 },
      { title: 'Influencer outreach', type: 'task', priority: 'low', storyPoints: 5 },
    ],
  },
  {
    id: 'tpl-4',
    name: 'Product Launch Campaign',
    description: 'Comprehensive product launch planning and execution',
    category: 'product-launch',
    icon: 'Rocket',
    color: '#F59E0B',
    projectType: 'waterfall',
    suggestedTags: ['Marketing', 'PR', 'Launch', 'Strategy', 'Sales'],
    defaultTasks: [
      { title: 'Define launch goals', type: 'epic', priority: 'critical', storyPoints: 3 },
      { title: 'Market research', type: 'story', priority: 'high', storyPoints: 8 },
      { title: 'Create messaging strategy', type: 'story', priority: 'high', storyPoints: 5 },
      { title: 'Develop marketing materials', type: 'story', priority: 'high', storyPoints: 13 },
      { title: 'Press release draft', type: 'task', priority: 'medium', storyPoints: 3 },
      { title: 'Launch event planning', type: 'story', priority: 'medium', storyPoints: 8 },
      { title: 'Email campaign setup', type: 'task', priority: 'high', storyPoints: 5 },
      { title: 'Post-launch analysis', type: 'task', priority: 'medium', storyPoints: 3 },
    ],
  },
  {
    id: 'tpl-5',
    name: 'Creative & Video Production',
    description: 'Video content creation from concept to delivery',
    category: 'creative-video',
    icon: 'Video',
    color: '#8B5CF6',
    projectType: 'agile-kanban',
    suggestedTags: ['Video', 'Creative', 'Production', 'Editing', 'Animation'],
    defaultTasks: [
      { title: 'Concept development', type: 'story', priority: 'high', storyPoints: 5 },
      { title: 'Scriptwriting', type: 'task', priority: 'high', storyPoints: 5 },
      { title: 'Storyboarding', type: 'task', priority: 'medium', storyPoints: 5 },
      { title: 'Pre-production planning', type: 'story', priority: 'high', storyPoints: 8 },
      { title: 'Filming/Recording', type: 'task', priority: 'critical', storyPoints: 13 },
      { title: 'Video editing', type: 'task', priority: 'high', storyPoints: 13 },
      { title: 'Sound design & mixing', type: 'task', priority: 'medium', storyPoints: 5 },
      { title: 'Final review & delivery', type: 'task', priority: 'high', storyPoints: 3 },
    ],
  },
  {
    id: 'tpl-6',
    name: 'Ads Management',
    description: 'Digital advertising campaign management across platforms',
    category: 'ads-management',
    icon: 'Megaphone',
    color: '#EF4444',
    projectType: 'agile-kanban',
    suggestedTags: ['PPC', 'Facebook Ads', 'Google Ads', 'Analytics', 'ROI'],
    defaultTasks: [
      { title: 'Define campaign objectives', type: 'task', priority: 'critical', storyPoints: 3 },
      { title: 'Audience research & targeting', type: 'story', priority: 'high', storyPoints: 5 },
      { title: 'Create ad creatives', type: 'story', priority: 'high', storyPoints: 8 },
      { title: 'Set up tracking pixels', type: 'task', priority: 'high', storyPoints: 3 },
      { title: 'Launch campaigns', type: 'task', priority: 'high', storyPoints: 3 },
      { title: 'A/B testing', type: 'task', priority: 'medium', storyPoints: 5 },
      { title: 'Daily optimization', type: 'task', priority: 'medium', storyPoints: 3 },
      { title: 'Weekly performance report', type: 'task', priority: 'medium', storyPoints: 2 },
    ],
  },
  {
    id: 'tpl-7',
    name: 'Marketing Campaign',
    description: 'Integrated marketing campaign planning and execution',
    category: 'marketing',
    icon: 'TrendingUp',
    color: '#06B6D4',
    projectType: 'hybrid',
    suggestedTags: ['Marketing', 'Content', 'SEO', 'Email', 'Social'],
    defaultTasks: [
      { title: 'Campaign strategy', type: 'epic', priority: 'critical', storyPoints: 5 },
      { title: 'Buyer persona research', type: 'task', priority: 'high', storyPoints: 5 },
      { title: 'Content strategy', type: 'story', priority: 'high', storyPoints: 8 },
      { title: 'SEO optimization', type: 'task', priority: 'medium', storyPoints: 5 },
      { title: 'Email sequences', type: 'story', priority: 'high', storyPoints: 8 },
      { title: 'Landing page creation', type: 'task', priority: 'high', storyPoints: 5 },
      { title: 'Campaign launch', type: 'task', priority: 'critical', storyPoints: 3 },
      { title: 'Performance analysis', type: 'task', priority: 'medium', storyPoints: 3 },
    ],
  },
  {
    id: 'tpl-8',
    name: 'Operations & Process',
    description: 'Business operations and process improvement projects',
    category: 'operations',
    icon: 'Settings',
    color: '#64748B',
    projectType: 'waterfall',
    suggestedTags: ['Process', 'Operations', 'Efficiency', 'Documentation'],
    defaultTasks: [
      { title: 'Current process analysis', type: 'story', priority: 'high', storyPoints: 8 },
      { title: 'Identify bottlenecks', type: 'task', priority: 'high', storyPoints: 5 },
      { title: 'Design improved workflow', type: 'story', priority: 'high', storyPoints: 8 },
      { title: 'Create documentation', type: 'task', priority: 'medium', storyPoints: 5 },
      { title: 'Train team members', type: 'task', priority: 'medium', storyPoints: 5 },
      { title: 'Implement changes', type: 'task', priority: 'high', storyPoints: 8 },
      { title: 'Monitor & measure', type: 'task', priority: 'medium', storyPoints: 3 },
      { title: 'Continuous improvement', type: 'task', priority: 'low', storyPoints: 3 },
    ],
  },
  {
    id: 'tpl-9',
    name: 'Blank Project',
    description: 'Start from scratch with a custom project structure',
    category: 'custom',
    icon: 'FolderPlus',
    color: '#9CA3AF',
    projectType: 'agile-scrum',
    suggestedTags: [],
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
