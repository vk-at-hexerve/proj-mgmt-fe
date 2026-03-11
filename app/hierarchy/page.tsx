'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AICopilot } from '@/components/ai/ai-copilot';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Layers,
  Target,
  FolderKanban,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Users,
  Calendar,
  LayoutList,
  Network,
} from 'lucide-react';
import { projects } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { Portfolio, Program } from '@/lib/mock-data';
import type { Project } from '@/lib/types';

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'critical': return 'text-destructive';
    case 'high': return 'text-destructive';
    case 'medium': return 'text-warning';
    case 'low': return 'text-success';
    default: return 'text-muted-foreground';
  }
};

const getRiskBadgeVariant = (risk: string): 'destructive' | 'secondary' | 'outline' => {
  switch (risk) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-success/10 text-success border-success/20';
    case 'planning': return 'bg-accent/10 text-accent border-accent/20';
    case 'on-hold': return 'bg-warning/10 text-warning border-warning/20';
    case 'completed': return 'bg-muted text-muted-foreground border-border';
    case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);

// ─── Project Row ────────────────────────────────────────────────────────────

function ProjectRow({
  project,
  isLast,
}: {
  project: Project;
  isLast: boolean;
}) {
  const { showToast } = useApp();
  return (
    <div className="flex items-start gap-2 group">
      {/* Tree connector */}
      <div className="flex flex-col items-center self-stretch w-6 shrink-0">
        <div className="w-px bg-border h-5 shrink-0" />
        <div className="flex items-center gap-0">
          <div className="w-5 h-px bg-border" />
        </div>
        {!isLast && <div className="w-px bg-border flex-1 mt-0" />}
      </div>

      <div
        className={cn(
          'flex-1 flex items-center gap-4 p-3 rounded-lg border border-border mb-2',
          'bg-card hover:bg-muted/30 transition-colors'
        )}
      >
        <div className="p-1.5 rounded-md bg-primary/10 shrink-0">
          <FolderKanban className="size-4 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs shrink-0">
              {project.key}
            </Badge>
            <span className="font-medium text-sm truncate">{project.name}</span>
            <Badge
              className={cn('text-xs capitalize border', getStatusColor(project.status))}
              variant="outline"
            >
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {project.description}
            </p>
          )}
        </div>

        {/* Members */}
        <div className="hidden md:flex items-center -space-x-1.5 shrink-0">
          {project.members.slice(0, 3).map((m) => (
            <TooltipProvider key={m.id} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="size-6 ring-2 ring-background">
                    <AvatarImage src={m.avatar || '/placeholder.svg'} />
                    <AvatarFallback className="text-xs">
                      {m.name.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>{m.name}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {project.members.length > 3 && (
            <div className="size-6 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-xs text-muted-foreground">
              +{project.members.length - 3}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="hidden lg:flex items-center gap-2 w-28 shrink-0">
          <Progress value={project.progress} className="h-1.5 flex-1" />
          <span className="text-xs font-medium w-8 text-right">{project.progress}%</span>
        </div>

        {/* Risk */}
        <div className="hidden sm:block shrink-0">
          <Badge variant={getRiskBadgeVariant(project.riskLevel)} className="capitalize text-xs">
            {project.riskLevel}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 opacity-0 group-hover:opacity-100 shrink-0"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => showToast({ title: 'Opening project', description: project.name, type: 'info' })}>
              View Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => showToast({ title: 'Edit project', description: 'Feature in development', type: 'info' })}>
              Edit Project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Program Section ─────────────────────────────────────────────────────────

function ProgramSection({
  program,
  isLast,
}: {
  program: Program;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { showToast, openModal } = useApp();
  const programProjects = projects.filter((p) => program.projectIds.includes(p.id));
  const budgetPct = Math.round((program.spent / program.budget) * 100);

  return (
    <div className="flex items-start gap-2 group/prog">
      {/* Tree connector */}
      <div className="flex flex-col items-center self-stretch w-6 shrink-0">
        <div className="w-px bg-border h-5 shrink-0" />
        <div className="w-5 h-px bg-border" />
        {!isLast && <div className="w-px bg-border flex-1" />}
      </div>

      <div className="flex-1 min-w-0 mb-3">
        {/* Program header row */}
        <div
          className={cn(
            'flex items-center gap-3 p-3 rounded-lg border border-border',
            'bg-card hover:bg-muted/20 transition-colors cursor-pointer'
          )}
          onClick={() => setExpanded((v) => !v)}
        >
          <button
            className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
            onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          >
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>

          <div className="p-1.5 rounded-md bg-accent/10 shrink-0">
            <Target className="size-4 text-accent" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{program.name}</span>
              <Badge
                className={cn('text-xs capitalize border', getStatusColor(program.status))}
                variant="outline"
              >
                {program.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {program.description}
            </p>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <FolderKanban className="size-3" />
              {programProjects.length} projects
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="size-3" />
              {formatCurrency(program.spent)} / {formatCurrency(program.budget)}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 w-24 shrink-0">
            <Progress value={program.progress} className="h-1.5 flex-1" />
            <span className="text-xs font-medium w-8 text-right">{program.progress}%</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Badge variant="outline" className="gap-1 text-xs">
              <Sparkles className="size-3" />
              {program.aiConfidence}%
            </Badge>
            <Badge variant={getRiskBadgeVariant(program.riskLevel)} className="capitalize text-xs">
              {program.riskLevel}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover/prog:opacity-100 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => showToast({ title: 'View program', description: program.name, type: 'info' })}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => showToast({ title: 'Edit program', description: 'Feature in development', type: 'info' })}>
                Edit Program
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openModal('create-project')}>
                Add Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Projects under this program */}
        {expanded && programProjects.length > 0 && (
          <div className="mt-1 pl-5">
            {programProjects.map((project, idx) => (
              <ProjectRow
                key={project.id}
                project={project}
                isLast={idx === programProjects.length - 1}
              />
            ))}
          </div>
        )}
        {expanded && programProjects.length === 0 && (
          <div className="mt-2 pl-10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 px-3 rounded-lg border border-dashed border-border">
              <FolderKanban className="size-3.5" />
              <span>No projects assigned to this program</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-xs ml-auto"
                onClick={() => openModal('create-project')}
              >
                <Plus className="size-3 mr-1" />
                Add
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Portfolio Card ──────────────────────────────────────────────────────────

function PortfolioCard({ portfolio }: { portfolio: Portfolio }) {
  const [expanded, setExpanded] = useState(true);
  const { programs, openModal, showToast } = useApp();
  const portfolioPrograms = programs.filter((p) => portfolio.programIds.includes(p.id));
  const allProjects = portfolioPrograms.flatMap((prog) =>
    projects.filter((p) => prog.projectIds.includes(p.id))
  );
  const budgetPct = Math.round((portfolio.spent / portfolio.budget) * 100);

  return (
    <Card className={cn('overflow-hidden transition-shadow hover:shadow-md')}>
      {/* Portfolio header */}
      <CardHeader
        className="pb-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button className="size-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
              {expanded ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
            </button>
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Layers className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{portfolio.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {portfolioPrograms.length} Programs &middot; {allProjects.length} Projects
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className={cn('text-xs capitalize border', getStatusColor(portfolio.status))}
              variant="outline"
            >
              {portfolio.status}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs hidden sm:flex">
              <Sparkles className="size-3" />
              {portfolio.aiConfidence}%
            </Badge>
            <Badge
              variant={getRiskBadgeVariant(portfolio.riskLevel)}
              className="capitalize text-xs hidden sm:flex"
            >
              {portfolio.riskLevel}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => showToast({ title: 'View portfolio', description: portfolio.name, type: 'info' })}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => showToast({ title: 'Edit portfolio', description: 'Feature in development', type: 'info' })}>
                  Edit Portfolio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModal('create-program')}>
                  Add Program
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => showToast({ title: 'Exporting...', type: 'success' })}>
                  Export Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Portfolio stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted shrink-0">
              <TrendingUp className="size-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-sm font-semibold">{portfolio.progress}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted shrink-0">
              <DollarSign className="size-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-semibold">
                {formatCurrency(portfolio.spent)} / {formatCurrency(portfolio.budget)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted shrink-0">
              <Users className="size-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              <p className="text-sm font-semibold truncate">{portfolio.owner.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted shrink-0">
              <AlertTriangle className={cn('size-3.5', getRiskColor(portfolio.riskLevel))} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Risk</p>
              <p className={cn('text-sm font-semibold capitalize', getRiskColor(portfolio.riskLevel))}>
                {portfolio.riskLevel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Budget utilization</span>
            <span>{budgetPct}%</span>
          </div>
          <Progress
            value={budgetPct}
            className={cn('h-1.5', budgetPct > 80 && '[&>div]:bg-warning')}
          />
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 pb-4">
          <Separator className="mb-4" />

          {/* Programs tree */}
          {portfolioPrograms.length > 0 ? (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="p-1 rounded bg-muted shrink-0">
                  <Target className="size-3 text-muted-foreground" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Programs ({portfolioPrograms.length})
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 text-xs ml-auto"
                  onClick={() => openModal('create-program')}
                >
                  <Plus className="size-3 mr-1" />
                  Add Program
                </Button>
              </div>

              {/* Root tree line */}
              <div className="pl-3">
                {portfolioPrograms.map((program, idx) => (
                  <ProgramSection
                    key={program.id}
                    program={program}
                    isLast={idx === portfolioPrograms.length - 1}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 px-3 rounded-lg border border-dashed border-border">
              <Target className="size-3.5" />
              <span>No programs in this portfolio</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-xs ml-auto"
                onClick={() => openModal('create-program')}
              >
                <Plus className="size-3 mr-1" />
                Add Program
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HierarchyPage() {
  const { portfolios, programs, openModal } = useApp();

  const totalProjects = programs.reduce((sum, prog) => sum + prog.projectIds.length, 0);
  const totalBudget = portfolios.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = portfolios.reduce((sum, p) => sum + p.spent, 0);
  const avgProgress = portfolios.reduce((sum, p) => sum + p.progress, 0) / (portfolios.length || 1);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="Hierarchy"
          subtitle="Portfolio → Program → Project"
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Network className="size-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Strategic Hierarchy</h2>
                  <p className="text-sm text-muted-foreground">
                    End-to-end view from portfolio investment to project execution
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={() => openModal('create-portfolio')}>
                  <Plus className="size-4" />
                  New Portfolio
                </Button>
              </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Layers className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Portfolios</p>
                    <p className="text-2xl font-bold">{portfolios.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Target className="size-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Programs</p>
                    <p className="text-2xl font-bold">{programs.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <FolderKanban className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Projects</p>
                    <p className="text-2xl font-bold">{totalProjects}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <DollarSign className="size-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                    <p className="text-xs text-muted-foreground">{Math.round((totalSpent / totalBudget) * 100)}% used</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded bg-primary/10">
                  <Layers className="size-3 text-primary" />
                </div>
                <span>Portfolio</span>
              </div>
              <ChevronRight className="size-3" />
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded bg-accent/10">
                  <Target className="size-3 text-accent" />
                </div>
                <span>Program</span>
              </div>
              <ChevronRight className="size-3" />
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded bg-muted">
                  <FolderKanban className="size-3 text-primary" />
                </div>
                <span>Project</span>
              </div>
            </div>

            {/* Portfolio tree */}
            <div className="space-y-4">
              {portfolios.map((portfolio) => (
                <PortfolioCard key={portfolio.id} portfolio={portfolio} />
              ))}
            </div>

            {portfolios.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Layers className="size-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No portfolios yet</p>
                <p className="text-sm mt-1">Create your first portfolio to start organizing your work</p>
                <Button className="mt-4 gap-2" onClick={() => openModal('create-portfolio')}>
                  <Plus className="size-4" />
                  Create Portfolio
                </Button>
              </div>
            )}
          </div>
        </main>
        <AICopilot />
      </div>
    </div>
  );
}
