'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AICopilot } from '@/components/ai/ai-copilot';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  MoreHorizontal,
  Search,
  Target,
  Calendar,
  DollarSign,
  FolderKanban,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  LayoutGrid,
  List,
} from 'lucide-react';
import { projects } from '@/lib/mock-data';
import { portfolios } from '@/lib/mock-data'; // Added import for portfolios
import { cn } from '@/lib/utils';

const getRiskBadgeVariant = (risk: string) => {
  switch (risk) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'outline';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'text-success';
    case 'planning': return 'text-accent';
    case 'on-hold': return 'text-warning';
    case 'completed': return 'text-muted-foreground';
    default: return 'text-foreground';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const programs = []; // Added declaration for programs

export default function ProgramsClient() {
  const { programs: contextPrograms, portfolios: contextPortfolios, openModal, showToast } = useApp();
  const programs = contextPrograms as any[];
  const portfolios = contextPortfolios as any[];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = program.name.toLowerCase().includes(search.toLowerCase()) ||
      (program.description || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || program.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalBudget = programs.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalSpent = programs.reduce((sum, p) => sum + (p.spent || 0), 0);
  const avgProgress = programs.reduce((sum, p) => sum + (p.progress || 0), 0) / (programs.length || 1);
  const activePrograms = programs.filter(p => p.status === 'active').length;

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="Programs"
          subtitle="Manage and track strategic program initiatives"
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex justify-end mb-4">
              <Button size="sm" className="gap-1" onClick={() => openModal('create-program')}>
                <Plus className="size-4" />
                Create Program
              </Button>
            </div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Programs</p>
                      <p className="text-2xl font-bold">{programs.length}</p>
                      <p className="text-xs text-muted-foreground">{activePrograms} active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <DollarSign className="size-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(totalSpent)} spent ({Math.round((totalSpent / totalBudget) * 100)}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <TrendingUp className="size-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Progress</p>
                      <p className="text-2xl font-bold">{Math.round(avgProgress)}%</p>
                      <Progress value={avgProgress} className="h-1.5 mt-1 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="size-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">At Risk</p>
                      <p className="text-2xl font-bold">
                        {programs.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length}
                      </p>
                      <p className="text-xs text-muted-foreground">Programs need attention</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search programs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="size-8"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="size-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>

            {/* Programs Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPrograms.map((program) => {
                  const programProjects = projects.filter(p => program.projectIds?.includes(p.id));
                  const portfolio = portfolios.find(p => p.programIds?.includes(program.id));
                  const budgetUsed = ((program.spent || 0) / (program.budget || 1)) * 100;

                  return (
                    <Card key={program.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-accent/10">
                              <Target className="size-5 text-accent" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{program.name}</CardTitle>
                              <CardDescription className="text-xs mt-0.5 flex items-center gap-1">
                                <span className={cn('capitalize', getStatusColor(program.status))}>
                                  {program.status}
                                </span>
                                {portfolio && (
                                  <>
                                    <span className="text-border">|</span>
                                    <span>{portfolio.name}</span>
                                  </>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => showToast({ title: 'Opening...', description: `Viewing ${program.name}`, type: 'info' })}>View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => showToast({ title: 'Coming soon', description: 'Edit program feature in development', type: 'info' })}>Edit Program</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => showToast({ title: 'Opening Gantt', description: 'Loading timeline view...', type: 'info' })}>View Gantt</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => showToast({ title: 'Exporting...', description: 'Program report will download shortly', type: 'success' })}>Export Report</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {program.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <FolderKanban className="size-4" />
                            <span>{programProjects.length} Projects</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="size-4" />
                            <span>{formatDate(program.startDate)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{program.progress}%</span>
                          </div>
                          <Progress value={program.progress} className="h-2" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Budget</span>
                            <span className="font-medium">{formatCurrency(program.spent)} / {formatCurrency(program.budget)}</span>
                          </div>
                          <Progress
                            value={budgetUsed}
                            className={cn('h-1.5', budgetUsed > 80 && '[&>div]:bg-warning')}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Avatar className="size-6">
                              <AvatarImage src={program.owner?.avatar || '/placeholder.svg'} />
                              <AvatarFallback className="text-xs">
                                {(program.owner?.name || 'SU').split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{program.owner?.name || 'System User'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Sparkles className="size-3" />
                              {program.aiConfidence}%
                            </Badge>
                            <Badge variant={getRiskBadgeVariant(program.riskLevel) as "outline" | "destructive" | "secondary"} className="capitalize text-xs">
                              {program.riskLevel}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Program</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrograms.map((program) => {
                      const programProjects = projects.filter(p => program.projectIds?.includes(p.id));
                      const portfolio = portfolios.find(p => p.programIds?.includes(program.id));

                      return (
                        <TableRow key={program.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded bg-accent/10">
                                <Target className="size-4 text-accent" />
                              </div>
                              <div>
                                <p className="font-medium">{program.name}</p>
                                <p className="text-xs text-muted-foreground">{formatDate(program.startDate)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('capitalize', getStatusColor(program.status))}>
                              {program.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {portfolio?.name || '-'}
                          </TableCell>
                          <TableCell>{programProjects.length}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={program.progress} className="h-1.5 w-16" />
                              <span className="text-sm">{program.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{formatCurrency(program.spent)}</p>
                              <p className="text-xs text-muted-foreground">of {formatCurrency(program.budget)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRiskBadgeVariant(program.riskLevel) as "outline" | "destructive" | "secondary"} className="capitalize">
                              {program.riskLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-6">
                                <AvatarImage src={program.owner?.avatar || '/placeholder.svg'} />
                                <AvatarFallback className="text-xs">
                                  {(program.owner?.name || 'SU').split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{program.owner?.name || 'System User'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => showToast({ title: 'Opening...', description: `Viewing ${program.name}`, type: 'info' })}>View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => showToast({ title: 'Coming soon', description: 'Edit program feature in development', type: 'info' })}>Edit Program</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => showToast({ title: 'Opening Gantt', description: 'Loading timeline view...', type: 'info' })}>View Gantt</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => showToast({ title: 'Exporting...', description: 'Program report will download shortly', type: 'success' })}>Export Report</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}

            {filteredPrograms.length === 0 && (
              <div className="text-center py-12">
                <Target className="size-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground">No programs found</h3>
                <p className="text-muted-foreground mt-1">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </main>
        <AICopilot />
      </div>
    </div>
  );
}
