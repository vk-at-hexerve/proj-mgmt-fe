'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Sparkles, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import type { RiskLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

const riskColors: Record<RiskLevel, string> = {
  low: 'bg-success text-success-foreground',
  medium: 'bg-warning text-warning-foreground',
  high: 'bg-destructive text-destructive-foreground',
  critical: 'bg-destructive text-destructive-foreground',
};

const statusIcons = {
  active: <Clock className="size-3.5" />,
  completed: <CheckCircle2 className="size-3.5" />,
  'on-hold': <AlertCircle className="size-3.5" />,
  cancelled: <AlertCircle className="size-3.5" />,
};

const statusColors = {
  active: 'bg-accent/10 text-accent',
  completed: 'bg-success/10 text-success',
  'on-hold': 'bg-warning/10 text-warning-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

export function ProjectsOverview() {
  const { projects } = useApp();
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Active Projects</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary">
            View all
            <ArrowRight className="size-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {project.key}
                  </Badge>
                  <h4 className="font-medium text-foreground">{project.name}</h4>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {project.description}
                </p>
              </div>
              <Badge
                className={cn('flex items-center gap-1', statusColors[project.status])}
                variant="secondary"
              >
                {statusIcons[project.status]}
                <span className="capitalize">{project.status}</span>
              </Badge>
            </div>

            {/* Progress */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-1.5" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* AI Confidence */}
                <div className="flex items-center gap-1.5 text-xs">
                  <Sparkles className="size-3.5 text-primary" />
                  <span className="text-muted-foreground">AI Confidence:</span>
                  <span
                    className={cn(
                      'font-medium',
                      project.aiConfidence >= 80 && 'text-success',
                      project.aiConfidence >= 60 && project.aiConfidence < 80 && 'text-warning-foreground',
                      project.aiConfidence < 60 && 'text-destructive'
                    )}
                  >
                    {project.aiConfidence}%
                  </span>
                </div>

                {/* Risk */}
                <Badge className={cn('text-xs', riskColors[project.riskLevel])}>
                  {project.riskLevel} risk
                </Badge>
              </div>

              {/* Team */}
              <div className="flex -space-x-2">
                {project.members.slice(0, 4).map((member) => (
                  <Avatar key={member.id} className="size-6 border-2 border-card">
                    <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {project.members.length > 4 && (
                  <div className="flex items-center justify-center size-6 rounded-full bg-muted text-xs font-medium border-2 border-card">
                    +{project.members.length - 4}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
