'use client';

import { useState } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AICopilot } from '@/components/ai/ai-copilot';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  MoreHorizontal,
  Search,
  Users,
  TrendingUp,
  Zap,
  FolderKanban,
  Mail,
  Crown,
  UserPlus,
  Settings,
  Trash2,
  Edit,
  UserMinus,
  Shield,
} from 'lucide-react';
// import { projects } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export default function TeamsClient() {
  const { teams, tasks, projects, openModal, removeTeamMember, setTeamLead, deleteTeam, showToast, isTaskDone, getStatusGroup } = useApp();
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(teams[0]?.id);
  const [memberToRemove, setMemberToRemove] = useState<{ teamId: string; userId: string; userName: string } | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<{ id: string; name: string } | null>(null);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase()) ||
    (team.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const currentTeam = teams.find(t => t.id === selectedTeam) || teams[0];
  const teamProjects = currentTeam ? projects.filter(p => currentTeam.projectIds.includes(p.id)) : [];

  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);
  const avgVelocity = teams.length > 0 ? teams.reduce((sum, t) => sum + t.velocity, 0) / teams.length : 0;
  const totalCapacity = teams.reduce((sum, t) => sum + t.capacity, 0);
  const utilizationRate = teams.length > 0
    ? teams.reduce((sum, t) => sum + (t.capacity > 0 ? (t.velocity / t.capacity) * 100 : 0), 0) / teams.length
    : 0;

  const handleRemoveMember = () => {
    if (memberToRemove) {
      removeTeamMember(memberToRemove.teamId, memberToRemove.userId);
      setMemberToRemove(null);
    }
  };

  const handleDeleteTeam = () => {
    if (teamToDelete) {
      deleteTeam(teamToDelete.id);
      if (selectedTeam === teamToDelete.id && teams.length > 1) {
        setSelectedTeam(teams.find(t => t.id !== teamToDelete.id)?.id || '');
      }
      setTeamToDelete(null);
    }
  };

  const handleViewProfile = (userId: string) => {
    showToast({ title: 'User Profile', description: 'User profile view coming soon', type: 'info' });
  };

  const handleViewTasks = (userId: string) => {
    showToast({ title: 'User Tasks', description: 'Redirecting to user tasks...', type: 'info' });
  };

  const handleSendMessage = (userId: string) => {
    showToast({ title: 'Send Message', description: 'Messaging feature coming soon', type: 'info' });
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="Teams"
          subtitle="Manage and coordinate work across teams"
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex justify-end gap-2 mb-4">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => openModal('create-user')}>
                <UserPlus className="size-4" />
                Create User
              </Button>
              <Button size="sm" className="gap-1" onClick={() => openModal('create-team')}>
                <Plus className="size-4" />
                Create Team
              </Button>
            </div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Teams</p>
                      <p className="text-2xl font-bold">{teams.length}</p>
                      <p className="text-xs text-muted-foreground">{totalMembers} members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <TrendingUp className="size-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Velocity</p>
                      <p className="text-2xl font-bold">{Math.round(avgVelocity)}</p>
                      <p className="text-xs text-muted-foreground">story points/sprint</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Zap className="size-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Capacity</p>
                      <p className="text-2xl font-bold">{totalCapacity}</p>
                      <p className="text-xs text-muted-foreground">story points</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Users className="size-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Utilization</p>
                      <p className="text-2xl font-bold">{Math.round(utilizationRate)}%</p>
                      <Progress value={utilizationRate} className="h-1.5 mt-1 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Teams List */}
              <div className="space-y-4">
                {filteredTeams.map((team: any) => {
                  const teamProjectsList = projects.filter((p: any) => team.projectIds.includes(p.id));
                  const utilization = team.capacity > 0 ? (team.velocity / team.capacity) * 100 : 0;

                  return (
                    <Card
                      key={team.id}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        selectedTeam === team.id && 'ring-2 ring-primary'
                      )}
                      onClick={() => setSelectedTeam(team.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Users className="size-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium truncate">{team.name}</h3>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="size-8 shrink-0">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => showToast({ title: 'Team Details', description: 'Click the team card to view details', type: 'info' })}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openModal('edit-team', { teamId: team.id })}>
                                    <Edit className="size-4 mr-2" />
                                    Edit Team
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openModal('add-member', { teamId: team.id })}>
                                    <UserPlus className="size-4 mr-2" />
                                    Add Member
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setTeamToDelete({ id: team.id, name: team.name })}
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete Team
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                              {team.description}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="size-3.5" />
                                {team.members.length}
                              </span>
                              <span className="flex items-center gap-1">
                                <FolderKanban className="size-3.5" />
                                {teamProjectsList.length}
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="size-3.5" />
                                {team.velocity}
                              </span>
                            </div>
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Utilization</span>
                                <span className="font-medium">{Math.round(utilization)}%</span>
                              </div>
                              <Progress
                                value={utilization}
                                className={cn('h-1.5', utilization > 90 && '[&>div]:bg-warning')}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredTeams.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="size-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No teams found</p>
                  </div>
                )}
              </div>

              {/* Team Details */}
              {currentTeam && (
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-primary/10">
                            <Users className="size-6 text-primary" />
                          </div>
                          <div>
                            <CardTitle>{currentTeam.name}</CardTitle>
                            <CardDescription>{currentTeam.description}</CardDescription>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-muted-foreground">PM:</span>
                                <span className="text-xs font-medium">{currentTeam.projectManager.name}</span>
                              </div>
                              {currentTeam.lead && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground">Lead:</span>
                                  <span className="text-xs font-medium">{currentTeam.lead.name}</span>
                                </div>
                              )}
                              {currentTeam.productManager && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground">Product:</span>
                                  <span className="text-xs font-medium">{currentTeam.productManager.name}</span>
                                </div>
                              )}
                              {currentTeam.scrumMaster && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs text-muted-foreground">Scrum:</span>
                                  <span className="text-xs font-medium">{currentTeam.scrumMaster.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-transparent"
                            onClick={() => openModal('add-member', { teamId: currentTeam.id })}
                          >
                            <UserPlus className="size-4" />
                            Add Member
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8 bg-transparent"
                            onClick={() => openModal('edit-team', { teamId: currentTeam.id })}
                            title="Edit Team"
                          >
                            <Edit className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="members">
                        <TabsList>
                          <TabsTrigger value="members">Members ({currentTeam.members.length})</TabsTrigger>
                          <TabsTrigger value="projects">Projects ({teamProjects.length})</TabsTrigger>
                          <TabsTrigger value="performance">Performance</TabsTrigger>
                        </TabsList>

                        <TabsContent value="members" className="mt-4">
                          <div className="space-y-3">
                            {currentTeam.members.map((member) => {
                              const isLead = member.id === currentTeam.lead?.id;
                              const isPM = member.id === currentTeam.projectManager.id;
                              const isProdM = member.id === currentTeam.productManager?.id;
                              const isScrumMaster = member.id === currentTeam.scrumMaster?.id;
                              const memberTasks = tasks.filter(t => t.assignee?.id === member.id);
                              const inProgressTasks = memberTasks.filter(t => getStatusGroup(t.statusId) === 'IN_PROGRESS').length;

                              return (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                                >
                                  <UserAvatar user={member} size="lg" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">{member.name}</p>
                                      <div className="flex gap-1 flex-wrap">
                                        {isPM && (
                                          <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                                            PM
                                          </Badge>
                                        )}
                                        {isLead && (
                                          <Badge variant="outline" className="gap-1 text-warning border-warning/30">
                                            <Crown className="size-3" />
                                            Lead
                                          </Badge>
                                        )}
                                        {isProdM && (
                                          <Badge variant="outline" className="gap-1 text-accent border-accent/30">
                                            Product
                                          </Badge>
                                        )}
                                        {isScrumMaster && (
                                          <Badge variant="outline" className="gap-1 text-success border-success/30">
                                            <Shield className="size-3" />
                                            Scrum
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {member.role?.replace('-', ' ') || 'Member'}
                                      <span className="text-border">|</span>
                                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                                        <Mail className="size-3" />
                                        {member.email}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium">{inProgressTasks} tasks</p>
                                    <p className="text-xs text-muted-foreground">in progress</p>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-8">
                                        <MoreHorizontal className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewProfile(member.id)}>
                                        View Profile
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleViewTasks(member.id)}>
                                        View Tasks
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleSendMessage(member.id)}>
                                        Send Message
                                      </DropdownMenuItem>
                                      {!isLead && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => setTeamLead(currentTeam.id, member.id)}>
                                            <Crown className="size-4 mr-2" />
                                            Make Team Lead
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            className="text-destructive"
                                            onClick={() => setMemberToRemove({
                                              teamId: currentTeam.id,
                                              userId: member.id,
                                              userName: member.name
                                            })}
                                          >
                                            <UserMinus className="size-4 mr-2" />
                                            Remove from Team
                                          </DropdownMenuItem>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              );
                            })}
                          </div>
                        </TabsContent>

                        <TabsContent value="projects" className="mt-4">
                          <div className="space-y-3">
                            {teamProjects.map((project: any) => (
                              <div
                                key={project.id}
                                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                              >
                                <div className="p-2 rounded-lg bg-accent/10">
                                  <FolderKanban className="size-5 text-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {project.key}
                                    </Badge>
                                    <p className="font-medium">{project.name}</p>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {project.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-sm font-medium">{project.progress}%</p>
                                    <Progress value={project.progress} className="h-1.5 w-20 mt-1" />
                                  </div>
                                  <Badge
                                    variant={project.riskLevel === 'high' ? 'destructive' : 'outline'}
                                    className="capitalize"
                                  >
                                    {project.riskLevel}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                            {teamProjects.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <FolderKanban className="size-12 mx-auto mb-3 opacity-50" />
                                <p>No projects assigned to this team</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="performance" className="mt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Sprint Velocity</p>
                                <p className="text-3xl font-bold mt-1">{currentTeam.velocity}</p>
                                <p className="text-xs text-muted-foreground mt-1">story points/sprint</p>
                                <div className="mt-3 pt-3 border-t border-border">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">vs Last Sprint</span>
                                    <Badge variant="outline" className="text-success border-success/30">
                                      +12%
                                    </Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Sprint Capacity</p>
                                <p className="text-3xl font-bold mt-1">{currentTeam.capacity}</p>
                                <p className="text-xs text-muted-foreground mt-1">story points</p>
                                <div className="mt-3 pt-3 border-t border-border">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Utilization</span>
                                    <span className="font-medium">
                                      {currentTeam.capacity > 0
                                        ? Math.round((currentTeam.velocity / currentTeam.capacity) * 100)
                                        : 0}%
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Active Tasks</p>
                                <p className="text-3xl font-bold mt-1">
                                  {tasks.filter(t => currentTeam.members.some(m => m.id === t.assignee?.id) && !isTaskDone(t)).length}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">across all projects</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground">Completed This Sprint</p>
                                <p className="text-3xl font-bold mt-1">
                                  {tasks.filter(t => currentTeam.members.some(m => m.id === t.assignee?.id) && isTaskDone(t)).length}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">tasks closed</p>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
        <AICopilot />
      </div>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.userName} from the team?
              This will not delete their account or tasks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Team Confirmation Dialog */}
      <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{teamToDelete?.name}"?
              This action cannot be undone. Team members will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteTeam}
            >
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
