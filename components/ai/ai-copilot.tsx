'use client';

import { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/app-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserAvatar } from '@/components/ui/user-avatar';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  AlertTriangle,
  TrendingUp,
  ListTodo,
  Calendar,
} from 'lucide-react';
import { currentUser, users } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  actions?: {
    label: string;
    action: string;
  }[];
}

const quickActions = [
  { icon: <ListTodo className="size-4" />, label: 'Create a sprint', prompt: 'Create a sprint for next 2 weeks' },
  { icon: <AlertTriangle className="size-4" />, label: 'Risk analysis', prompt: 'Show me the risk analysis for current projects' },
  { icon: <TrendingUp className="size-4" />, label: 'Progress report', prompt: 'Generate a progress report for this week' },
  { icon: <Calendar className="size-4" />, label: 'Schedule tasks', prompt: 'Help me schedule tasks for the team' },
];

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: `Hello! I'm your AI Project Management Copilot. I can help you with:

- **Planning**: Break down goals into tasks, suggest timelines, create sprints
- **Monitoring**: Track progress, detect blockers, identify risks
- **Reporting**: Generate status reports, executive summaries
- **Optimization**: Balance resources, optimize sprints, tune performance

What would you like help with today?`,
    timestamp: new Date(),
    suggestions: [
      'Why is the Infrastructure project at risk?',
      'Create tasks for the mobile app feature',
      'Show me team workload distribution',
    ],
  },
];

export function AICopilot() {
  const { aiCopilotOpen, setAiCopilotOpen, openModal, showToast, addTask, isMounted } = useApp();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);


  // Listen for keyboard shortcut to open AI copilot
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAiCopilotOpen(!aiCopilotOpen);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [aiCopilotOpen, setAiCopilotOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'create_tasks':
        openModal('create-task');
        showToast({ title: 'Opening task creator', type: 'info' });
        break;
      case 'create_sprint':
        showToast({ title: 'Sprint created', description: 'Sprint 25 has been created', type: 'success' });
        break;
      case 'export_pdf':
        showToast({ title: 'Exporting report', description: 'PDF will be downloaded shortly', type: 'info' });
        break;
      case 'send_team':
        showToast({ title: 'Report sent', description: 'Team has been notified', type: 'success' });
        break;
      default:
        showToast({ title: 'Feature coming soon', type: 'info' });
    }
  };

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      let response: Message;
      
      if (userMessage.toLowerCase().includes('risk') || userMessage.toLowerCase().includes('infrastructure')) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Based on my analysis of the **Infrastructure Upgrade** project:

**Risk Factors Identified:**
1. **Resource Bottleneck** - James Liu is overallocated (120% capacity)
2. **Dependency Delays** - 2 external vendor deliverables are behind schedule
3. **Budget Concerns** - Current spend is at 63% with only 60% progress

**AI Confidence Score:** 62% (down from 78% last week)

**Recommendations:**
1. Consider reassigning 2 tasks to free up James's bandwidth
2. Escalate vendor delays to procurement
3. Schedule a budget review meeting

Would you like me to automatically create tasks for these recommendations?`,
          timestamp: new Date(),
          actions: [
            { label: 'Create tasks', action: 'create_tasks' },
            { label: 'Schedule meeting', action: 'schedule_meeting' },
            { label: 'View full analysis', action: 'view_analysis' },
          ],
        };
      } else if (userMessage.toLowerCase().includes('sprint') || userMessage.toLowerCase().includes('create')) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I'll help you create a new sprint. Based on team velocity (avg. 42 points) and current backlog, here's my suggested sprint:

**Sprint 25** (Jan 27 - Feb 10)
- **Goal:** Complete API integration and notification system
- **Capacity:** 40 story points (accounting for PTO)

**Suggested Tasks:**
1. NXS-106: Real-time notifications (13 pts) - Michael Park
2. NXS-103: CI/CD pipeline (3 pts) - James Liu
3. NXS-108: User profile management (5 pts) - Sarah Chen
4. New: API error handling (8 pts) - Unassigned
5. New: Integration tests (8 pts) - Unassigned

**Total:** 37 points (92.5% of capacity)

Should I create this sprint?`,
          timestamp: new Date(),
          actions: [
            { label: 'Create sprint', action: 'create_sprint' },
            { label: 'Modify tasks', action: 'modify_tasks' },
            { label: 'Adjust dates', action: 'adjust_dates' },
          ],
        };
      } else if (userMessage.toLowerCase().includes('report') || userMessage.toLowerCase().includes('progress')) {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Here's your **Weekly Progress Report** for Nexus Platform:

**Sprint 23 Status:**
- Progress: 65% complete (7 of 10 tasks done)
- Velocity: On track (28/42 points completed)
- Blockers: 1 critical bug (NXS-104)

**Key Highlights:**
- Mobile responsive layouts completed ahead of schedule
- Authentication flow 80% complete
- Dashboard wireframes pending final approval

**Concerns:**
- API rate limiting bug needs urgent attention
- 2 tasks at risk of missing sprint deadline

**Team Performance:**
- Sarah Chen: 15 points completed (125% of target)
- Michael Park: 10 points completed (100% of target)
- James Liu: 8 points completed (80% of target)

Would you like me to format this for stakeholders?`,
          timestamp: new Date(),
          actions: [
            { label: 'Export PDF', action: 'export_pdf' },
            { label: 'Send to team', action: 'send_team' },
            { label: 'Schedule recurring', action: 'schedule_report' },
          ],
        };
      } else if (userMessage.toLowerCase().includes('task') && userMessage.toLowerCase().includes('create')) {
        // Actually create a task
        addTask({
          title: 'New task from AI Copilot',
          description: 'This task was created by the AI Copilot based on your request.',
          type: 'task',
          priority: 'medium',
          statusId: 'open',
          projectId: 'proj-1',
          reporter: users[0],
          tags: [],
        });
        
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I've created a new task for you! You can find it in your task list. Would you like me to:

- Add more details to the task
- Assign it to a team member
- Create related tasks`,
          timestamp: new Date(),
          suggestions: [
            'Assign this task to Sarah',
            'Add story points to the task',
            'Create a subtask',
          ],
        };
      } else {
        response = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I understand you're asking about "${userMessage}". Let me analyze the relevant data from your projects and provide insights.

Based on current project data:
- **Active Projects:** 3
- **Current Sprint:** Sprint 23 (65% complete)
- **Team Utilization:** 82%

Is there something specific you'd like me to help you with? I can assist with:
- Task planning and assignment
- Risk analysis and mitigation
- Progress tracking and reporting
- Resource optimization`,
          timestamp: new Date(),
          suggestions: [
            'Show me overdue tasks',
            'Optimize team workload',
            'Predict project completion date',
          ],
        };
      }

      setMessages((prev) => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    simulateResponse(input);
  };

  const handleQuickAction = (prompt: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    simulateResponse(prompt);
  };

  if (!isMounted) return null;

  if (!aiCopilotOpen) {
    return (
      <Button
        onClick={() => setAiCopilotOpen(true)}
        className="fixed bottom-6 right-6 size-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 z-50"
        size="icon"
      >
        <Bot className="size-6" />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        'fixed bottom-6 right-6 shadow-2xl z-50 flex flex-col transition-all duration-300',
        isExpanded ? 'w-[600px] h-[700px]' : 'w-[400px] h-[550px]'
      )}
    >
      {/* Header */}
      <CardHeader className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-primary to-accent">
              <Bot className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">AI Copilot</h3>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setAiCopilotOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3',
                message.role === 'user' && 'flex-row-reverse'
              )}
            >
              {message.role === 'assistant' ? (
                <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-primary to-accent shrink-0">
                  <Sparkles className="size-4 text-primary-foreground" />
                </div>
              ) : (
                <UserAvatar user={currentUser} size="md" className="shrink-0" />
              )}
              <div
                className={cn(
                  'rounded-lg p-3 max-w-[85%] space-y-3',
                  message.role === 'assistant'
                    ? 'bg-muted'
                    : 'bg-primary text-primary-foreground'
                )}
              >
                <div 
                  className={cn(
                    'text-sm prose prose-sm max-w-none',
                    message.role === 'user' && 'prose-invert'
                  )}
                  dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />')
                  }}
                />

                {/* Actions */}
                {message.actions && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {message.actions.map((action) => (
                      <Button
                        key={action.action}
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleActionClick(action.action)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {message.suggestions && (
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">Suggested questions:</p>
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="block w-full text-left text-xs text-primary hover:underline"
                        onClick={() => handleQuickAction(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-primary to-accent shrink-0">
                <Sparkles className="size-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-border flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="h-7 text-xs whitespace-nowrap shrink-0 gap-1.5 bg-transparent"
              onClick={() => handleQuickAction(action.prompt)}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <CardContent className="p-4 pt-2 border-t border-border flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your projects..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
            <Send className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
