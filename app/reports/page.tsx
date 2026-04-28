'use client';

import { useState } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AICopilot } from '@/components/ai/ai-copilot';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Clock,
  Sparkles,
  FileText,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { cn } from '@/lib/utils';
import type { Task, Project } from '@/lib/types';

export default function ReportsPage() {
  const { tasks, projects, users } = useApp();
  const [dateRange, setDateRange] = useState('this-month');

  // Velocity data - should be empty until real sprints are created
  const velocityData: any[] = [];

  const burndownData: any[] = [];

  const taskDistribution = [
    { name: 'Completed', value: tasks.filter(t => t.status === 'closed').length, color: '#22C55E' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, color: '#7B68EE' },
    { name: 'Open', value: tasks.filter(t => t.status === 'open' || t.status === 'assigned').length, color: '#94A3B8' },
    { name: 'On Hold', value: tasks.filter(t => t.status === 'on-hold').length, color: '#F59E0B' },
  ].filter(d => d.value > 0);

  const teamPerformance = users.slice(0, 4).map(u => {
    const userTasks = tasks.filter(t => t.assignee?.id === u.id);
    const completed = userTasks.filter(t => t.status === 'closed').length;
    return {
      name: u.name,
      completed: completed,
      capacity: 10,
      efficiency: userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0
    };
  });

  const budgetData: any[] = [];

  const aiInsightsText = projects.length > 0
    ? `Your active projects are currently being analyzed. Based on recent activity, the overall health is stable with ${tasks.filter(t => t.status === 'closed').length} tasks completed this period.`
    : "AI analysis will begin once you create your first project and add tasks. Nexus PM will provide velocity predictions, risk assessments, and resource optimization tips.";

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="Reports & Analytics"
          subtitle="AI-powered insights and performance metrics"
          actions={
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Download className="size-4" />
              Export
            </Button>
          }
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-between">
              <Tabs defaultValue="overview" className="w-auto">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="sprint">Sprint Reports</TabsTrigger>
                  <TabsTrigger value="team">Team Performance</TabsTrigger>
                  <TabsTrigger value="budget">Budget</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-3">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[150px]">
                    <Calendar className="size-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="this-quarter">This Quarter</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="sm" className="gap-2 text-primary bg-transparent">
                  <Sparkles className="size-4" />
                  AI Summary
                </Button>
              </div>
            </div>

            {/* AI Summary Card */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-gradient-to-br from-primary to-accent shrink-0">
                    <Sparkles className="size-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">AI-Generated Insights</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {aiInsightsText}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                        View detailed analysis
                        <ChevronRight className="size-4 ml-1" />
                      </Button>
                      <Button variant="link" size="sm" className="h-auto p-0 text-primary">
                        Generate executive report
                        <ChevronRight className="size-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Sprint Velocity</p>
                      <p className="text-2xl font-bold mt-1">
                        {tasks.filter(t => t.status === 'closed').reduce((acc, t) => acc + (t.storyPoints || 0), 0)} pts
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="size-4 text-success" />
                        <span className="text-sm text-success">+5% vs avg</span>
                      </div>
                    </div>
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="size-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Team Utilization</p>
                      <p className="text-2xl font-bold mt-1">
                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.assignee).length / tasks.length) * 100) : 0}%
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="size-4 text-success" />
                        <span className="text-sm text-success">Optimal range</span>
                      </div>
                    </div>
                    <div className="size-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <Users className="size-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Cycle Time</p>
                      <p className="text-2xl font-bold mt-1">
                        {projects.length > 0 ? '0 days' : '0 days'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingDown className="size-4 text-success" />
                        <span className="text-sm text-success">-0.5 days</span>
                      </div>
                    </div>
                    <div className="size-12 rounded-full bg-success/10 flex items-center justify-center">
                      <Clock className="size-6 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">AI Confidence</p>
                      <p className="text-2xl font-bold mt-1">
                        {projects.length > 0 ? '65%' : '0%'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="size-4 text-success" />
                        <span className="text-sm text-success">+3% this week</span>
                      </div>
                    </div>
                    <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="size-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Velocity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sprint Velocity</CardTitle>
                  <CardDescription>Planned vs completed story points per sprint</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={velocityData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="sprint" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="planned" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} name="Planned" />
                        <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Completed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Burndown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sprint Burndown</CardTitle>
                  <CardDescription>Current sprint progress vs ideal trajectory</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={burndownData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="ideal"
                          stroke="hsl(var(--muted-foreground))"
                          fill="hsl(var(--muted))"
                          strokeDasharray="5 5"
                          name="Ideal"
                        />
                        <Area
                          type="monotone"
                          dataKey="remaining"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary) / 0.2)"
                          name="Remaining"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Task Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Task Distribution</CardTitle>
                  <CardDescription>Current status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {taskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {taskDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                        <span className="text-sm font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Team Performance */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Team Performance</CardTitle>
                  <CardDescription>Individual contribution and efficiency metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamPerformance.map((member) => (
                      <div key={member.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-xs font-medium">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-medium text-sm">{member.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {member.completed}/{member.capacity} pts
                            </span>
                            <Badge
                              variant={member.efficiency >= 100 ? 'default' : 'secondary'}
                              className={cn(
                                member.efficiency >= 100 && 'bg-success text-success-foreground'
                              )}
                            >
                              {member.efficiency}%
                            </Badge>
                          </div>
                        </div>
                        <Progress
                          value={Math.min(member.efficiency, 100)}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Reports */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Generated Reports</CardTitle>
                    <CardDescription>AI-generated reports and analysis</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <FileText className="size-4" />
                    Generate New Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* No reports by default */}
                  {false ? [].map((report: any, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{report.title}</p>
                          <p className="text-xs text-muted-foreground">{report.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{report.type}</Badge>
                        <Button variant="ghost" size="icon" className="size-8">
                          <ArrowUpRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="size-12 mx-auto mb-3 opacity-50" />
                      <p>No reports generated yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <AICopilot />
      </div>
    </div>
  );
}
