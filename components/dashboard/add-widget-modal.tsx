'use client';

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  PieChart, 
  BarChart3, 
  Users, 
  FolderKanban, 
  Calendar,
  Plus
} from 'lucide-react';
import type { ChartWidgetConfig } from './chart-widget';

export type NewWidgetType = 
  | { kind: 'chart', config: Omit<ChartWidgetConfig, 'id'> }
  | { kind: 'panel', component: 'employeeMetrics' | 'projectMetrics' | 'dueDateTasks' | 'unassignedTasks' };

interface AddWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (widget: NewWidgetType) => void;
}

const WIDGET_TEMPLATES = [
  {
    category: 'Analytics Charts',
    items: [
      {
        title: 'Task Distribution (Pie)',
        description: 'See how tasks are distributed across the team',
        icon: <PieChart className="size-5 text-primary" />,
        widget: {
          kind: 'chart',
          config: {
            title: 'Tasks per User',
            chartType: 'pie',
            dataSource: 'tasks-per-user',
            filters: { statusGroup: 'all' }
          }
        } as NewWidgetType
      },
      {
        title: 'Team Workload (Bar)',
        description: 'Compare active task counts across team members',
        icon: <BarChart3 className="size-5 text-primary" />,
        widget: {
          kind: 'chart',
          config: {
            title: 'Active Workload',
            chartType: 'bar',
            dataSource: 'user-workload',
            filters: {}
          }
        } as NewWidgetType
      },
      {
        title: 'Project Status (Pie)',
        description: 'Overview of project health and phases',
        icon: <PieChart className="size-5 text-accent" />,
        widget: {
          kind: 'chart',
          config: {
            title: 'Projects by Status',
            chartType: 'pie',
            dataSource: 'projects-by-status',
            filters: {}
          }
        } as NewWidgetType
      },
      {
        title: 'Project Progress (Bar)',
        description: 'Stacked bar showing completion per project',
        icon: <BarChart3 className="size-5 text-accent" />,
        widget: {
          kind: 'chart',
          config: {
            title: 'Tasks per Project',
            chartType: 'bar',
            dataSource: 'tasks-per-project',
            filters: {}
          }
        } as NewWidgetType
      },
      {
        title: 'Task Status (Pie)',
        description: 'Breakdown of Open vs In Progress vs Done',
        icon: <PieChart className="size-5 text-success" />,
        widget: {
          kind: 'chart',
          config: {
            title: 'Task Status Distribution',
            chartType: 'pie',
            dataSource: 'tasks-by-status',
            filters: {}
          }
        } as NewWidgetType
      },
      {
        title: 'Task Priority (Bar)',
        description: 'Distribution of priorities across tasks',
        icon: <BarChart3 className="size-5 text-destructive" />,
        widget: {
          kind: 'chart',
          config: {
            title: 'Tasks by Priority',
            chartType: 'bar',
            dataSource: 'tasks-by-priority',
            filters: { statusGroup: 'active' }
          }
        } as NewWidgetType
      }
    ]
  },
  {
    category: 'Data Panels',
    items: [
      {
        title: 'Employee Metrics Table',
        description: 'Detailed sortable table of tasks per user',
        icon: <Users className="size-5 text-primary" />,
        widget: {
          kind: 'panel',
          component: 'employeeMetrics'
        } as NewWidgetType
      },
      {
        title: 'Project Metrics List',
        description: 'Detailed list of projects with progress bars',
        icon: <FolderKanban className="size-5 text-accent" />,
        widget: {
          kind: 'panel',
          component: 'projectMetrics'
        } as NewWidgetType
      },
      {
        title: 'Unassigned Tasks',
        description: 'List of active tasks that need an owner',
        icon: <Users className="size-5 text-warning-foreground" />,
        widget: {
          kind: 'panel',
          component: 'unassignedTasks'
        } as NewWidgetType
      },
      {
        title: 'Due Date Calendar',
        description: 'Interactive calendar to find tasks by deadline',
        icon: <Calendar className="size-5 text-warning-foreground" />,
        widget: {
          kind: 'panel',
          component: 'dueDateTasks'
        } as NewWidgetType
      }
    ]
  }
];

export function AddWidgetModal({ open, onOpenChange, onAdd }: AddWidgetModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>Add Dashboard Widget</DialogTitle>
          <DialogDescription>
            Select a new widget or chart to add to your dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {WIDGET_TEMPLATES.map((section, idx) => (
              <div key={idx} className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {section.category}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.items.map((item, itemIdx) => (
                    <div 
                      key={itemIdx}
                      className="group flex flex-col p-4 rounded-xl border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer"
                      onClick={() => {
                        onAdd(item.widget);
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-muted group-hover:bg-background transition-colors">
                          {item.icon}
                        </div>
                        <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
