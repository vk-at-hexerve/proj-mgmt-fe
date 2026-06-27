import React, { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Search, FolderKanban, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export function AllProjectsView() {
  const { projects, setCurrentProject, sprints, tasks, isTaskOverdue } = useApp();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleProjectClick = (projectId: string) => {
    setCurrentProject(projectId);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex flex-col space-y-4 p-6 border-b border-border bg-card">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FolderKanban className="size-6 text-primary" />
            All Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of all projects you have access to across the workspace.
          </p>
        </div>
        <div className="flex items-center gap-4 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects by name, key, or description..."
              className="pl-9 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-md border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[250px]">Project</TableHead>
                <TableHead className="w-[100px]">Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Progress</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Active Sprint</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No projects found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => {
                  const projectSprints = sprints.filter((s) => s.projectId === project.id);
                  const activeSprint = projectSprints.find((s) => s.status === 'active');
                  const overdueTasksCount = tasks.filter(t => t.projectId === project.id && isTaskOverdue(t)).length;

                  return (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer group hover:bg-muted/50 transition-colors"
                      onClick={() => handleProjectClick(project.id)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{project.name}</span>
                            {overdueTasksCount > 0 && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 h-4">
                                {overdueTasksCount} overdue {overdueTasksCount === 1 ? 'task' : 'tasks'}
                              </Badge>
                            )}
                          </div>
                          {project.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {project.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {project.key}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            project.status === 'active'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : project.status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }
                        >
                          {project.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={project.progress} className="h-2 flex-1" />
                          <span className="text-xs font-medium text-muted-foreground w-8">
                            {Math.round(project.progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center -space-x-2">
                          {project.members.slice(0, 3).map((member) => (
                            <UserAvatar
                              key={member.id}
                              user={member}
                              size="sm"
                              className="border-2 border-background"
                            />
                          ))}
                          {project.members.length > 3 && (
                            <div className="flex items-center justify-center size-7 rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                              +{project.members.length - 3}
                            </div>
                          )}
                          {project.members.length === 0 && (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeSprint ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{activeSprint.name}</span>
                            <span className="text-xs text-muted-foreground">
                              Ends {format(new Date(activeSprint.endDate), 'MMM d')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No active sprint</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(project.createdAt), 'MMM d, yyyy')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ArrowRight className="inline-block size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
