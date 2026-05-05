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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreHorizontal,
  Layers,
  DollarSign,
  TrendingUp,
  Target,
  FolderKanban,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { projects } from '@/lib/mock-data';
import { portfolios, programs } from '@/lib/mock-data'; // Import programs variable
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
};

export default function PortfoliosPage() {
  const { portfolios: contextPortfolios, programs: contextPrograms, openModal, showToast } = useApp();
  const portfolios = contextPortfolios as any[];
  const programs = contextPrograms as any[];
  const [selectedPortfolio, setSelectedPortfolio] = useState(portfolios[0]?.id);

  const currentPortfolio = portfolios.find(p => p.id === selectedPortfolio) || portfolios[0];
  const portfolioPrograms = programs.filter(p => currentPortfolio?.programIds?.includes(p.id));
  const portfolioProjects = portfolioPrograms.flatMap((prog: any) => 
    projects.filter(p => prog.projectIds?.includes(p.id))
  );

  const totalBudget = portfolios.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalSpent = portfolios.reduce((sum, p) => sum + (p.spent || 0), 0);
  const avgProgress = portfolios.reduce((sum, p) => sum + (p.progress || 0), 0) / (portfolios.length || 1);
  const avgAIConfidence = portfolios.reduce((sum, p) => sum + (p.aiConfidence || 0), 0) / (portfolios.length || 1);

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title="Portfolios" subtitle="Strategic overview of all investment portfolios" />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Portfolios</h1>
                <p className="text-muted-foreground">Strategic overview of all investment portfolios</p>
              </div>
              <Button className="gap-2" onClick={() => openModal('create-portfolio')}>
                <Plus className="size-4" />
                New Portfolio
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Layers className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Portfolios</p>
                      <p className="text-2xl font-bold">{portfolios.length}</p>
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
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                        <Badge variant="outline" className="text-success gap-1">
                          <ArrowUpRight className="size-3" />
                          12%
                        </Badge>
                      </div>
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
                      <p className="text-sm text-muted-foreground">Avg Progress</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{Math.round(avgProgress)}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Sparkles className="size-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">AI Confidence</p>
                      <p className="text-2xl font-bold">{Math.round(avgAIConfidence)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {portfolios.map((portfolio) => {
                const pPrograms = programs.filter(p => portfolio.programIds.includes(p.id));
                const pProjects = pPrograms.flatMap(prog => 
                  projects.filter(p => prog.projectIds.includes(p.id))
                );
                const budgetUsed = (portfolio.spent / portfolio.budget) * 100;

                return (
                  <Card
                    key={portfolio.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      selectedPortfolio === portfolio.id && 'ring-2 ring-primary'
                    )}
                    onClick={() => setSelectedPortfolio(portfolio.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Layers className="size-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{portfolio.name}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                              {pPrograms.length} Programs | {pProjects.length} Projects
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
                            <DropdownMenuItem onClick={() => setSelectedPortfolio(portfolio.id)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => showToast({ title: 'Coming soon', description: 'Edit portfolio feature in development', type: 'info' })}>Edit Portfolio</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => showToast({ title: 'Exporting...', description: 'Portfolio report will download shortly', type: 'success' })}>Export Report</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {portfolio.description}
                      </p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{portfolio.progress}%</span>
                        </div>
                        <Progress value={portfolio.progress} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Budget Utilization</span>
                          <span className="font-medium">{Math.round(budgetUsed)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={budgetUsed} 
                            className={cn('h-2 flex-1', budgetUsed > 80 && '[&>div]:bg-warning')}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Spent: {formatCurrency(portfolio.spent)}</span>
                          <span>Budget: {formatCurrency(portfolio.budget)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-6">
                            <AvatarImage src={portfolio.owner.avatar || '/placeholder.svg'} />
                            <AvatarFallback className="text-xs">
                              {portfolio.owner.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">{portfolio.owner.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRiskBadgeVariant(portfolio.riskLevel)} className="capitalize">
                            {portfolio.riskLevel} Risk
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selected Portfolio Details */}
            {currentPortfolio && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentPortfolio.name}</CardTitle>
                      <CardDescription>{currentPortfolio.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Sparkles className="size-3" />
                        AI Confidence: {currentPortfolio.aiConfidence}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="programs">
                    <TabsList>
                      <TabsTrigger value="programs" className="gap-2">
                        <Target className="size-4" />
                        Programs ({portfolioPrograms.length})
                      </TabsTrigger>
                      <TabsTrigger value="projects" className="gap-2">
                        <FolderKanban className="size-4" />
                        Projects ({portfolioProjects.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="programs" className="mt-4">
                      <div className="space-y-4">
                        {portfolioPrograms.map((program) => {
                          const programProjects = projects.filter(p => program.projectIds.includes(p.id));
                          
                          return (
                            <div
                              key={program.id}
                              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                            >
                              <div className="p-2 rounded-lg bg-accent/10">
                                <Target className="size-5 text-accent" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{program.name}</p>
                                  <Badge variant={getRiskBadgeVariant(program.riskLevel)} className="capitalize">
                                    {program.riskLevel}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {program.description}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>{programProjects.length} Projects</span>
                                  <span>Budget: {formatCurrency(program.budget)}</span>
                                  <span>Spent: {formatCurrency(program.spent)}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">{program.progress}%</p>
                                <p className="text-xs text-muted-foreground">Complete</p>
                              </div>
                              <div className="w-24">
                                <Progress value={program.progress} className="h-2" />
                              </div>
                            </div>
                          );
                        })}
                        {portfolioPrograms.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Target className="size-12 mx-auto mb-3 opacity-50" />
                            <p>No programs in this portfolio</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="projects" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {portfolioProjects.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                          >
                            <div className="p-2 rounded-lg bg-primary/10">
                              <FolderKanban className="size-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {project.key}
                                </Badge>
                                <p className="font-medium truncate">{project.name}</p>
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                <Progress value={project.progress} className="h-1.5 flex-1" />
                                <span className="text-sm font-medium">{project.progress}%</span>
                              </div>
                            </div>
                            <Badge variant={getRiskBadgeVariant(project.riskLevel)} className="capitalize shrink-0">
                              {project.riskLevel}
                            </Badge>
                          </div>
                        ))}
                        {portfolioProjects.length === 0 && (
                          <div className="col-span-2 text-center py-8 text-muted-foreground">
                            <FolderKanban className="size-12 mx-auto mb-3 opacity-50" />
                            <p>No projects in this portfolio</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        <AICopilot />
      </div>
    </div>
  );
}
