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
import { projects, tasks, users, dashboardMetrics } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Chart data
const velocityData = [
  { sprint: 'Sprint 18', planned: 40, completed: 38 },
  { sprint: 'Sprint 19', planned: 42, completed: 45 },
  { sprint: 'Sprint 20', planned: 45, completed: 42 },
  { sprint: 'Sprint 21', planned: 40, completed: 40 },
  { sprint: 'Sprint 22', planned: 42, completed: 44 },
  { sprint: 'Sprint 23', planned: 42, completed: 28 },
];

const burndownData = [
  { day: 'Day 1', remaining: 42, ideal: 42 },
  { day: 'Day 2', remaining: 40, ideal: 39 },
  { day: 'Day 3', remaining: 38, ideal: 36 },
  { day: 'Day 4', remaining: 35, ideal: 33 },
  { day: 'Day 5', remaining: 32, ideal: 30 },
  { day: 'Day 6', remaining: 30, ideal: 27 },
  { day: 'Day 7', remaining: 28, ideal: 24 },
  { day: 'Day 8', remaining: 25, ideal: 21 },
  { day: 'Day 9', remaining: 22, ideal: 18 },
  { day: 'Day 10', remaining: 18, ideal: 15 },
];

const taskDistribution = [
  { name: 'Completed', value: 24, color: '#22C55E' },
  { name: 'In Progress', value: 8, color: '#7B68EE' },
  { name: 'Open', value: 12, color: '#94A3B8' },
  { name: 'On Hold', value: 3, color: '#F59E0B' },
];

const teamPerformance = [
  { name: 'Sarah Chen', completed: 15, capacity: 12, efficiency: 125 },
  { name: 'Michael Park', completed: 10, capacity: 10, efficiency: 100 },
  { name: 'James Liu', completed: 8, capacity: 10, efficiency: 80 },
  { name: 'Emma Wilson', completed: 12, capacity: 12, efficiency: 100 },
];

const budgetData = [
  { month: 'Oct', budget: 50000, spent: 45000 },
  { month: 'Nov', budget: 50000, spent: 52000 },
  { month: 'Dec', budget: 50000, spent: 48000 },
  { month: 'Jan', budget: 50000, spent: 35000 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('this-month');

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
                      Sprint 23 is progressing at 65% with a projected completion rate of 85%. Team velocity has been 
                      consistent over the last 5 sprints averaging 42 points. However, the Infrastructure Upgrade project 
                      shows a 35% risk of missing the March deadline. Consider reallocating resources from the Mobile App 
                      project which is currently under capacity by 18%.
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
                      <p className="text-2xl font-bold mt-1">42 pts</p>
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
                      <p className="text-2xl font-bold mt-1">82%</p>
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
                      <p className="text-2xl font-bold mt-1">3.2 days</p>
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
                      <p className="text-2xl font-bold mt-1">75%</p>
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
                  {[
                    { title: 'Weekly Sprint Summary', date: 'Jan 19, 2026', type: 'Sprint Report' },
                    { title: 'Q4 Portfolio Review', date: 'Jan 15, 2026', type: 'Executive Summary' },
                    { title: 'Risk Assessment - Infrastructure', date: 'Jan 12, 2026', type: 'Risk Analysis' },
                    { title: 'Team Capacity Planning', date: 'Jan 10, 2026', type: 'Resource Report' },
                  ].map((report, index) => (
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
                  ))}
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
