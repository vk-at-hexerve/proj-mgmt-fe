import type { User, Tag, Task, Sprint, Project, AIInsight, DashboardMetrics, ProjectTemplate, Client, Product, Invoice } from './types';

export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Morgan',
  email: 'alex@nexuspm.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  role: 'project-manager',
};

export const users: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Sarah Chen',
    email: 'sarah@nexuspm.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    role: 'contributor',
  },
  {
    id: 'user-3',
    name: 'Michael Park',
    email: 'michael@nexuspm.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    role: 'contributor',
  },
  {
    id: 'user-4',
    name: 'Emma Wilson',
    email: 'emma@nexuspm.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    role: 'program-manager',
  },
  {
    id: 'user-5',
    name: 'James Liu',
    email: 'james@nexuspm.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    role: 'contributor',
  },
];

export const tags: Tag[] = [
  { id: 'tag-1', name: 'Frontend', color: '#7B68EE' },
  { id: 'tag-2', name: 'Backend', color: '#3B82F6' },
  { id: 'tag-3', name: 'Design', color: '#F59E0B' },
  { id: 'tag-4', name: 'Bug', color: '#EF4444' },
  { id: 'tag-5', name: 'Feature', color: '#22C55E' },
  { id: 'tag-6', name: 'Documentation', color: '#8B5CF6' },
];

export const sprints: Sprint[] = [
  {
    id: 'sprint-1',
    name: 'Sprint 23',
    goal: 'Complete user authentication and dashboard MVP',
    startDate: '2026-01-13',
    endDate: '2026-01-27',
    status: 'active',
    projectId: 'proj-1',
    velocity: 42,
  },
  {
    id: 'sprint-2',
    name: 'Sprint 24',
    goal: 'API integration and reporting features',
    startDate: '2026-01-27',
    endDate: '2026-02-10',
    status: 'planning',
    projectId: 'proj-1',
  },
];

export const tasks: Task[] = [
  {
    id: 'task-1',
    key: 'NXS-101',
    title: 'Implement user authentication flow',
    description: 'Set up complete authentication with OAuth, magic links, and password recovery',
    status: 'in-progress',
    priority: 'high',
    type: 'story',
    assignee: users[1],
    reporter: currentUser,
    tags: [tags[1], tags[4]],
    storyPoints: 8,
    dueDate: '2026-01-25',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-18',
    sprintId: 'sprint-1',
    projectId: 'proj-1',
  },
  {
    id: 'task-2',
    key: 'NXS-102',
    title: 'Design dashboard wireframes',
    description: 'Create high-fidelity wireframes for the main dashboard',
    status: 'pending-approval',
    priority: 'high',
    type: 'task',
    assignee: users[2],
    reporter: currentUser,
    tags: [tags[2]],
    storyPoints: 5,
    dueDate: '2026-01-22',
    createdAt: '2026-01-08',
    updatedAt: '2026-01-19',
    sprintId: 'sprint-1',
    projectId: 'proj-1',
  },
  {
    id: 'task-3',
    key: 'NXS-103',
    title: 'Set up CI/CD pipeline',
    description: 'Configure automated testing and deployment workflows',
    status: 'open',
    priority: 'medium',
    type: 'task',
    reporter: currentUser,
    tags: [tags[1]],
    storyPoints: 3,
    dueDate: '2026-01-30',
    createdAt: '2026-01-12',
    updatedAt: '2026-01-12',
    sprintId: 'sprint-1',
    projectId: 'proj-1',
  },
  {
    id: 'task-4',
    key: 'NXS-104',
    title: 'API rate limiting not working',
    description: 'Rate limiting middleware fails under high load conditions',
    status: 'assigned',
    priority: 'critical',
    type: 'bug',
    assignee: users[4],
    reporter: users[1],
    tags: [tags[1], tags[3]],
    storyPoints: 5,
    dueDate: '2026-01-21',
    createdAt: '2026-01-17',
    updatedAt: '2026-01-18',
    sprintId: 'sprint-1',
    projectId: 'proj-1',
  },
  {
    id: 'task-5',
    key: 'NXS-105',
    title: 'Create API documentation',
    description: 'Document all REST endpoints with examples and schemas',
    status: 'in-progress',
    priority: 'low',
    type: 'task',
    assignee: users[2],
    reporter: currentUser,
    tags: [tags[5]],
    storyPoints: 3,
    dueDate: '2026-02-05',
    createdAt: '2026-01-15',
    updatedAt: '2026-01-19',
    sprintId: 'sprint-1',
    projectId: 'proj-1',
  },
  {
    id: 'task-6',
    key: 'NXS-106',
    title: 'Implement real-time notifications',
    description: 'Add WebSocket support for live updates across the platform',
    status: 'open',
    priority: 'medium',
    type: 'story',
    reporter: currentUser,
    tags: [tags[0], tags[1], tags[4]],
    storyPoints: 13,
    dueDate: '2026-02-15',
    createdAt: '2026-01-14',
    updatedAt: '2026-01-14',
    projectId: 'proj-1',
  },
  {
    id: 'task-7',
    key: 'NXS-107',
    title: 'Mobile responsive layouts',
    description: 'Ensure all views work properly on mobile devices',
    status: 'closed',
    priority: 'high',
    type: 'story',
    assignee: users[1],
    reporter: currentUser,
    tags: [tags[0], tags[2]],
    storyPoints: 8,
    dueDate: '2026-01-18',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-18',
    sprintId: 'sprint-1',
    projectId: 'proj-1',
  },
  {
    id: 'task-8',
    key: 'NXS-108',
    title: 'User profile management',
    description: 'Allow users to update their profile information and preferences',
    status: 'on-hold',
    priority: 'low',
    type: 'story',
    assignee: users[4],
    reporter: users[3],
    tags: [tags[0], tags[4]],
    storyPoints: 5,
    dueDate: '2026-02-20',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-16',
    projectId: 'proj-1',
  },
  // Additional backlog items (no sprintId)
  {
    id: 'task-9',
    key: 'NXS-109',
    title: 'Implement dark mode theme',
    description: 'Add dark mode support across all components with system preference detection',
    status: 'open',
    priority: 'medium',
    type: 'story',
    reporter: currentUser,
    tags: [tags[0], tags[2]],
    storyPoints: 5,
    createdAt: '2026-01-15',
    updatedAt: '2026-01-15',
    projectId: 'proj-1',
  },
  {
    id: 'task-10',
    key: 'NXS-110',
    title: 'Export reports to PDF',
    description: 'Allow users to export project reports and analytics to PDF format',
    status: 'open',
    priority: 'low',
    type: 'task',
    reporter: users[3],
    tags: [tags[4]],
    storyPoints: 3,
    createdAt: '2026-01-16',
    updatedAt: '2026-01-16',
    projectId: 'proj-1',
  },
  {
    id: 'task-11',
    key: 'NXS-111',
    title: 'Keyboard shortcuts implementation',
    description: 'Add keyboard shortcuts for common actions like creating tasks, navigation, etc.',
    status: 'open',
    priority: 'medium',
    type: 'task',
    reporter: currentUser,
    tags: [tags[0]],
    storyPoints: 3,
    createdAt: '2026-01-17',
    updatedAt: '2026-01-17',
    projectId: 'proj-1',
  },
  {
    id: 'task-12',
    key: 'NXS-112',
    title: 'Performance optimization',
    description: 'Optimize bundle size and improve initial load time by 40%',
    status: 'open',
    priority: 'high',
    type: 'story',
    reporter: users[4],
    tags: [tags[0], tags[1]],
    storyPoints: 8,
    createdAt: '2026-01-18',
    updatedAt: '2026-01-18',
    projectId: 'proj-1',
  },
  {
    id: 'task-13',
    key: 'NXS-113',
    title: 'Search functionality enhancement',
    description: 'Add fuzzy search and filters for tasks, projects, and team members',
    status: 'open',
    priority: 'medium',
    type: 'story',
    reporter: currentUser,
    tags: [tags[0], tags[1], tags[4]],
    storyPoints: 5,
    createdAt: '2026-01-19',
    updatedAt: '2026-01-19',
    projectId: 'proj-1',
  },
  {
    id: 'task-14',
    key: 'NXS-114',
    title: 'Email notification system',
    description: 'Set up email notifications for task assignments, due dates, and mentions',
    status: 'open',
    priority: 'high',
    type: 'story',
    reporter: users[3],
    tags: [tags[1], tags[4]],
    storyPoints: 8,
    createdAt: '2026-01-19',
    updatedAt: '2026-01-19',
    projectId: 'proj-1',
  },
  {
    id: 'task-15',
    key: 'NXS-115',
    title: 'Slack integration',
    description: 'Integrate with Slack for real-time notifications and commands',
    status: 'open',
    priority: 'low',
    type: 'task',
    reporter: currentUser,
    tags: [tags[1]],
    storyPoints: 5,
    createdAt: '2026-01-20',
    updatedAt: '2026-01-20',
    projectId: 'proj-1',
  },
  {
    id: 'task-16',
    key: 'NXS-116',
    title: 'Drag and drop file upload',
    description: 'Enable drag and drop for file attachments on tasks and comments',
    status: 'open',
    priority: 'medium',
    type: 'task',
    reporter: users[2],
    tags: [tags[0]],
    storyPoints: 3,
    createdAt: '2026-01-20',
    updatedAt: '2026-01-20',
    projectId: 'proj-1',
  },
];

export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Nexus Platform',
    key: 'NXS',
    description: 'Main product development for the Nexus PM platform',
    type: 'agile-scrum',
    status: 'active',
    startDate: '2025-10-01',
    endDate: '2026-06-30',
    owner: currentUser,
    members: users,
    aiConfidence: 78,
    riskLevel: 'medium',
    progress: 45,
    budget: 500000,
    spent: 180000,
  },
  {
    id: 'proj-2',
    name: 'Mobile App',
    key: 'MOB',
    description: 'Native mobile application for iOS and Android',
    type: 'agile-kanban',
    status: 'active',
    startDate: '2025-12-01',
    owner: users[3],
    members: [users[1], users[2], users[4]],
    aiConfidence: 85,
    riskLevel: 'low',
    progress: 25,
    budget: 200000,
    spent: 45000,
  },
  {
    id: 'proj-3',
    name: 'Infrastructure Upgrade',
    key: 'INF',
    description: 'Cloud infrastructure modernization project',
    type: 'waterfall',
    status: 'active',
    startDate: '2025-11-15',
    endDate: '2026-03-31',
    owner: users[4],
    members: [users[1], users[4]],
    aiConfidence: 62,
    riskLevel: 'high',
    progress: 60,
    budget: 150000,
    spent: 95000,
  },
];

export const aiInsights: AIInsight[] = [
  {
    id: 'insight-1',
    type: 'risk',
    title: 'Sprint velocity declining',
    description: 'The current sprint velocity is 15% below the 3-sprint average. Consider reducing scope or addressing blockers.',
    severity: 'warning',
    relatedEntityType: 'project',
    relatedEntityId: 'proj-1',
    createdAt: '2026-01-19',
    actionable: true,
    action: 'Review sprint backlog',
  },
  {
    id: 'insight-2',
    type: 'prediction',
    title: 'Potential deadline risk',
    description: 'Based on current progress, the Infrastructure Upgrade project has a 35% chance of missing the March deadline.',
    severity: 'critical',
    relatedEntityType: 'project',
    relatedEntityId: 'proj-3',
    createdAt: '2026-01-18',
    actionable: true,
    action: 'View risk analysis',
  },
  {
    id: 'insight-3',
    type: 'recommendation',
    title: 'Optimize task assignment',
    description: 'Sarah Chen has capacity for 2 more tasks this sprint. Consider reassigning NXS-103 for faster completion.',
    severity: 'info',
    relatedEntityType: 'task',
    relatedEntityId: 'task-3',
    createdAt: '2026-01-19',
    actionable: true,
    action: 'Auto-assign task',
  },
  {
    id: 'insight-4',
    type: 'optimization',
    title: 'Budget reallocation opportunity',
    description: 'Mobile App project is under budget by 18%. Funds could be reallocated to Infrastructure Upgrade.',
    severity: 'info',
    relatedEntityType: 'project',
    relatedEntityId: 'proj-2',
    createdAt: '2026-01-17',
    actionable: true,
    action: 'View budget analysis',
  },
];

export const dashboardMetrics: DashboardMetrics = {
  totalProjects: 3,
  activeProjects: 3,
  tasksCompleted: 24,
  tasksInProgress: 8,
  overdueTasks: 2,
  averageVelocity: 38,
  budgetUtilization: 67,
  teamUtilization: 82,
  aiConfidenceScore: 75,
  upcomingDeadlines: 5,
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

export const teams: Team[] = [
  {
    id: 'team-1',
    name: 'Platform Engineering',
    description: 'Core platform development and infrastructure',
    members: [users[0], users[1], users[4]],
    lead: users[0],
    projectIds: ['proj-1', 'proj-3'],
    velocity: 42,
    capacity: 80,
  },
  {
    id: 'team-2',
    name: 'Mobile Squad',
    description: 'Native mobile application development',
    members: [users[2], users[3]],
    lead: users[3],
    projectIds: ['proj-2'],
    velocity: 28,
    capacity: 40,
  },
  {
    id: 'team-3',
    name: 'Design Systems',
    description: 'UI/UX design and component library',
    members: [users[2]],
    lead: users[2],
    projectIds: ['proj-1', 'proj-2'],
    velocity: 15,
    capacity: 20,
  },
];

export interface Program {
  id: string;
  name: string;
  description: string;
  portfolioId: string;
  projectIds: string[];
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

export const programs: Program[] = [
  {
    id: 'prog-1',
    name: 'Digital Transformation',
    description: 'Modernizing core business systems and processes',
    portfolioId: 'port-1',
    projectIds: ['proj-1', 'proj-3'],
    owner: users[3],
    startDate: '2025-09-01',
    endDate: '2026-08-31',
    aiConfidence: 72,
    riskLevel: 'medium',
    progress: 48,
    budget: 650000,
    spent: 275000,
    status: 'active',
  },
  {
    id: 'prog-2',
    name: 'Mobile First Initiative',
    description: 'Expanding mobile presence across all product lines',
    portfolioId: 'port-1',
    projectIds: ['proj-2'],
    owner: users[3],
    startDate: '2025-11-01',
    endDate: '2026-06-30',
    aiConfidence: 85,
    riskLevel: 'low',
    progress: 25,
    budget: 200000,
    spent: 45000,
    status: 'active',
  },
  {
    id: 'prog-3',
    name: 'Customer Experience 2.0',
    description: 'Enhanced customer portal and self-service capabilities',
    portfolioId: 'port-2',
    projectIds: [],
    owner: users[0],
    startDate: '2026-02-01',
    aiConfidence: 90,
    riskLevel: 'low',
    progress: 5,
    budget: 400000,
    spent: 15000,
    status: 'planning',
  },
];

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  programIds: string[];
  owner: User;
  budget: number;
  spent: number;
  aiConfidence: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  status: 'active' | 'on-hold' | 'completed';
}

export const portfolios: Portfolio[] = [
  {
    id: 'port-1',
    name: 'Technology Initiatives',
    description: 'All technology and infrastructure modernization programs',
    programIds: ['prog-1', 'prog-2'],
    owner: users[3],
    budget: 850000,
    spent: 320000,
    aiConfidence: 76,
    riskLevel: 'medium',
    progress: 42,
    status: 'active',
  },
  {
    id: 'port-2',
    name: 'Customer Growth',
    description: 'Programs focused on customer acquisition and retention',
    programIds: ['prog-3'],
    owner: users[0],
    budget: 600000,
    spent: 15000,
    aiConfidence: 88,
    riskLevel: 'low',
    progress: 5,
    status: 'active',
  },
];

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
    
    let progress = 0;
    switch (task.status) {
      case 'closed': progress = 100; break;
      case 'pending-approval': progress = 90; break;
      case 'in-progress': progress = 50; break;
      case 'assigned': progress = 10; break;
      default: progress = 0;
    }

    ganttTasks.push({
      id: task.id,
      name: `${task.key}: ${task.title}`,
      start: createdDate,
      end: dueDate,
      progress,
      type: task.type === 'epic' ? 'project' : 'task',
      assignee: task.assignee,
      projectId: task.projectId,
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
export const clients: Client[] = [
  {
    id: 'client-1',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corporation',
    type: 'external',
    address: '123 Business Ave, San Francisco, CA 94102',
    notes: 'Enterprise client, primary contact: John Smith',
    createdAt: '2025-06-15',
    updatedAt: '2026-01-10',
  },
  {
    id: 'client-2',
    name: 'TechStart Inc',
    email: 'hello@techstart.io',
    phone: '+1 (555) 234-5678',
    company: 'TechStart Inc',
    type: 'external',
    address: '456 Startup Blvd, Austin, TX 78701',
    notes: 'Startup client, fast-paced projects',
    createdAt: '2025-08-20',
    updatedAt: '2026-01-15',
  },
  {
    id: 'client-3',
    name: 'Marketing Department',
    email: 'marketing@internal.com',
    type: 'internal',
    notes: 'Internal marketing team projects',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'client-4',
    name: 'HR Department',
    email: 'hr@internal.com',
    type: 'internal',
    notes: 'Internal HR and operations projects',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'client-5',
    name: 'Global Media Group',
    email: 'projects@globalmedia.com',
    phone: '+1 (555) 345-6789',
    company: 'Global Media Group',
    type: 'external',
    address: '789 Media Center, New York, NY 10001',
    notes: 'Media company, video and content projects',
    createdAt: '2025-10-01',
    updatedAt: '2026-01-18',
  },
];

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
