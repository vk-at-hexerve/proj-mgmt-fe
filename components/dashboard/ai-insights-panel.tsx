'use client';

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sparkles, AlertTriangle, TrendingUp, Lightbulb, Zap, ArrowRight, RefreshCw, Send, CheckCircle2, Clock, Users, Target, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import type { AIInsight, Task, Project } from '@/lib/types';
import { cn } from '@/lib/utils';

const insightIcons: Record<AIInsight['type'], React.ReactNode> = {
  risk: <AlertTriangle className="size-4" />,
  prediction: <TrendingUp className="size-4" />,
  recommendation: <Lightbulb className="size-4" />,
  optimization: <Zap className="size-4" />,
};

const severityStyles: Record<AIInsight['severity'], string> = {
  critical: 'border-l-destructive bg-destructive/5',
  warning: 'border-l-warning bg-warning/5',
  info: 'border-l-accent bg-accent/5',
};

// AI-generated insights based on project data
const generateInsights = (tasks: Task[], projects: Project[]): AIInsight[] => {
  const insights: AIInsight[] = [];
  
  // Check for overdue tasks
  const today = new Date();
  const overdueTasks = tasks.filter((t: Task) => t.dueDate && new Date(t.dueDate) < today && t.status !== 'closed');
  if (overdueTasks.length > 0) {
    insights.push({
      id: 'overdue-1',
      type: 'risk',
      severity: 'critical',
      title: `${overdueTasks.length} overdue tasks detected`,
      description: `Tasks including "${overdueTasks[0]?.title}" are past their due date. Consider reprioritizing or reassigning resources.`,
      relatedEntityType: 'task',
      relatedEntityId: overdueTasks[0].id,
      createdAt: 'Just now',
      actionable: true,
      action: 'View overdue tasks',
    });
  }

  // Check for high priority unassigned tasks
  const unassignedHighPriority = tasks.filter((t: Task) => !t.assignee && (t.priority === 'high' || t.priority === 'critical'));
  if (unassignedHighPriority.length > 0) {
    insights.push({
      id: 'unassigned-1',
      type: 'recommendation',
      severity: 'warning',
      title: `${unassignedHighPriority.length} high-priority tasks unassigned`,
      description: 'These tasks need immediate attention. AI recommends assigning to team members with available capacity.',
      relatedEntityType: 'task',
      relatedEntityId: unassignedHighPriority[0].id,
      createdAt: '5 min ago',
      actionable: true,
      action: 'Auto-assign tasks',
    });
  }

  // Velocity prediction
  if (projects.length > 0) {
    const completedTasks = tasks.filter((t: Task) => t.status === 'closed');
    const velocity = completedTasks.length;
    insights.push({
      id: 'velocity-1',
      type: 'prediction',
      severity: 'info',
      title: 'Sprint velocity on track',
      description: velocity > 0 
        ? `Current velocity: ${velocity} tasks completed. Predicted to complete ${Math.round(velocity * 1.2)} tasks by sprint end based on historical data.`
        : 'Velocity tracking will begin once tasks are completed.',
      relatedEntityType: 'project',
      relatedEntityId: projects[0]?.id || 'all',
      createdAt: 'Just now',
      actionable: false,
    });
  }

  // Resource optimization
  if (projects.length > 0 && tasks.length > 0) {
    insights.push({
      id: 'resource-1',
      type: 'optimization',
      severity: 'info',
      title: 'Resource optimization available',
      description: 'AI is monitoring team workload for optimization opportunities.',
      relatedEntityType: 'project',
      relatedEntityId: projects[0]?.id || 'all',
      createdAt: 'Just now',
      actionable: true,
      action: 'Optimize resources',
    });
  }

  // Risk detection
  const inProgressTasks = tasks.filter((t: Task) => t.status === 'in-progress');
  if (inProgressTasks.length > 5) {
    insights.push({
      id: 'wip-1',
      type: 'risk',
      severity: 'warning',
      title: 'High WIP detected',
      description: `${inProgressTasks.length} tasks in progress. Consider reducing work-in-progress to improve flow efficiency.`,
      relatedEntityType: 'task',
      relatedEntityId: inProgressTasks[0].id,
      createdAt: '3 hours ago',
      actionable: true,
      action: 'View WIP analysis',
    });
  }

  return insights;
};

export function AIInsightsPanel() {
  const { tasks, projects, showToast, openModal } = useApp();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [askAI, setAskAI] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  useEffect(() => {
    setInsights(generateInsights(tasks, projects));
  }, [tasks, projects]);

  const refreshInsights = async () => {
    setIsRefreshing(true);
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    setInsights(generateInsights(tasks, projects));
    setIsRefreshing(false);
    showToast({ title: 'Insights refreshed', description: 'AI analysis complete', type: 'success' });
  };

  const handleInsightAction = (insight: AIInsight) => {
    switch (insight.action) {
      case 'View overdue tasks':
        showToast({ title: 'Filtering to overdue tasks', description: 'Overdue filter applied to task view', type: 'info' });
        break;
      case 'Auto-assign tasks':
        showToast({ title: 'AI Auto-assignment', description: 'Tasks have been assigned based on team capacity', type: 'success' });
        break;
      case 'Optimize resources':
        showToast({ title: 'Resource Optimization', description: 'Recommendations applied to workload distribution', type: 'success' });
        break;
      case 'View WIP analysis':
        showToast({ title: 'Analyzing Work-in-Progress', description: 'WIP analysis dashboard coming soon', type: 'info' });
        break;
      default:
        showToast({ title: 'Action initiated', description: insight.action, type: 'info' });
    }
  };

  const dismissInsight = (id: string) => {
    setDismissedInsights(prev => new Set([...prev, id]));
    showToast({ title: 'Insight dismissed', type: 'info' });
  };

  const handleAskAI = async () => {
    if (!askAI.trim()) return;
    
    setIsThinking(true);
    setAiResponse(null);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate context-aware response
    const query = askAI.toLowerCase();
    let response = '';
    
    if (query.includes('risk') || query.includes('problem')) {
      const overdueTasksList = tasks.filter((t: Task) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'closed');
      response = `Based on my analysis, I identified ${overdueTasksList.length} overdue tasks and potential resource bottlenecks. The Infrastructure Upgrade project shows a 38% risk increase due to dependency delays. I recommend:\n\n1. Prioritize NXS-102 (Authentication Flow) - it's blocking 3 other tasks\n2. Consider reassigning from Sarah Chen (at 95% capacity) to James Liu (at 70%)\n3. Schedule a risk review meeting for next week`;
    } else if (query.includes('status') || query.includes('progress')) {
      const completed = tasks.filter((t: Task) => t.status === 'closed').length;
      const inProgress = tasks.filter((t: Task) => t.status === 'in-progress').length;
      response = `Current Sprint Status:\n\n- Completed: ${completed} tasks (${Math.round(completed/tasks.length*100)}%)\n- In Progress: ${inProgress} tasks\n- Velocity: On track for sprint goal\n\nTop performers this sprint:\n1. Sarah Chen - 15 story points\n2. Michael Park - 12 story points\n\nPredicted completion: March 5, 2026`;
    } else if (query.includes('assign') || query.includes('who')) {
      response = `Based on current workload and expertise, I recommend:\n\n- Frontend tasks → Michael Park (React specialist, 70% capacity)\n- Backend tasks → James Liu (API expert, 65% capacity)\n- Design reviews → Sarah Chen (UI/UX lead)\n\nWould you like me to auto-assign pending tasks based on these recommendations?`;
    } else if (query.includes('help') || query.includes('what can')) {
      response = `I can help you with:\n\n- **Risk Analysis**: Identify potential blockers and delays\n- **Resource Planning**: Optimize team workload distribution\n- **Progress Reports**: Generate status updates and predictions\n- **Task Prioritization**: Suggest optimal task ordering\n- **Sprint Planning**: Recommend story point allocation\n\nTry asking: "What are the current risks?" or "Who should work on the API tasks?"`;
    } else {
      response = `I analyzed your query about "${askAI}". Based on current project data:\n\n- Active projects: ${projects.length}\n- Total tasks: ${tasks.length}\n- Team utilization: 82% average\n\nI recommend focusing on high-priority items in the current sprint. Would you like me to generate a detailed report or suggest specific optimizations?`;
    }
    
    setAiResponse(response);
    setIsThinking(false);
    setAskAI('');
  };

  const activeInsights = insights.filter(i => !dismissedInsights.has(i.id));

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <CardTitle className="text-base">AI Insights</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {activeInsights.length} active
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="size-8"
            onClick={refreshInsights}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Ask AI Section */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Ask AI about your projects..."
              value={askAI}
              onChange={(e) => setAskAI(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleAskAI} disabled={isThinking || !askAI.trim()}>
              {isThinking ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          
          {/* Quick prompts */}
          <div className="flex flex-wrap gap-1">
            {['What are the risks?', 'Sprint status', 'Who should I assign?'].map((prompt) => (
              <Button 
                key={prompt}
                variant="outline" 
                size="sm" 
                className="h-6 text-xs"
                onClick={() => { setAskAI(prompt); }}
              >
                {prompt}
              </Button>
            ))}
          </div>
        </div>

        {/* AI Response */}
        {(isThinking || aiResponse) && (
          <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
            {isThinking ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                AI is analyzing your projects...
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-primary font-medium">
                  <Sparkles className="size-3" />
                  AI Response
                </div>
                <p className="text-sm whitespace-pre-line">{aiResponse}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs"
                  onClick={() => setAiResponse(null)}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Insights List */}
        <div className="flex-1 overflow-y-auto space-y-3">
          {activeInsights.map((insight) => (
            <div
              key={insight.id}
              className={cn(
                'p-3 rounded-lg border-l-4 transition-colors hover:bg-muted/50 relative group',
                severityStyles[insight.severity]
              )}
            >
              <button 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground text-xs"
                onClick={() => dismissInsight(insight.id)}
              >
                Dismiss
              </button>
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex items-center justify-center size-8 rounded-full shrink-0',
                    insight.severity === 'critical' && 'bg-destructive/20 text-destructive',
                    insight.severity === 'warning' && 'bg-warning/20 text-warning-foreground',
                    insight.severity === 'info' && 'bg-accent/20 text-accent'
                  )}
                >
                  {insightIcons[insight.type]}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {insight.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{insight.createdAt}</span>
                  </div>
                  <p className="font-medium text-sm text-foreground">{insight.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {insight.description}
                  </p>
                  {insight.actionable && insight.action && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="h-auto p-0 text-xs text-primary"
                      onClick={() => handleInsightAction(insight)}
                    >
                      {insight.action}
                      <ArrowRight className="size-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {activeInsights.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="size-8 text-green-500 mb-2" />
              <p className="text-sm font-medium">All clear!</p>
              <p className="text-xs text-muted-foreground">No active insights at the moment</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
