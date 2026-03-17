'use client';

// Resource Allocation Management Component
import { useState } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AICopilot } from '@/components/ai/ai-copilot';
import { useApp } from '@/lib/app-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Plus,
  MoreHorizontal,
  Search,
  Users,
  TrendingUp,
  Percent,
  FolderKanban,
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react';
import { users, projects } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function ResourcesClient() {
  const { resourceAllocations, addResourceAllocation, updateResourceAllocation, deleteResourceAllocation, getUserAllocations, getProjectAllocations, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'users' | 'projects'>('users');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editAllocation, setEditAllocation] = useState<string | null>(null);
  
  // Form states
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [allocationPercent, setAllocationPercent] = useState(50);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate totals
  const totalAllocatedHours = resourceAllocations.reduce((sum, a) => sum + (a.allocation * 40 / 100), 0);
  const overAllocatedUsers = users.filter(u => {
    const userTotal = getUserAllocations(u.id).reduce((sum, a) => sum + a.allocation, 0);
    return userTotal > 100;
  });

  const handleAddAllocation = () => {
    if (!selectedUser || !selectedProject) {
      showToast({ title: 'Error', description: 'Please select both user and project', type: 'error' });
      return;
    }
    
    addResourceAllocation({
      userId: selectedUser,
      projectId: selectedProject,
      allocation: allocationPercent,
      startDate: new Date().toISOString().split('T')[0],
    });
    
    setShowAddModal(false);
    setSelectedUser('');
    setSelectedProject('');
    setAllocationPercent(50);
  };

  const currentEditAllocation = editAllocation ? resourceAllocations.find(a => a.id === editAllocation) : null;

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="Resource Allocation"
          subtitle="Manage team capacity and project assignments"
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Resources</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                      <p className="text-xs text-muted-foreground">team members</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <FolderKanban className="size-5 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Projects</p>
                      <p className="text-2xl font-bold">{projects.length}</p>
                      <p className="text-xs text-muted-foreground">with allocations</p>
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
                      <p className="text-sm text-muted-foreground">Total Allocated</p>
                      <p className="text-2xl font-bold">{Math.round(totalAllocatedHours)}h</p>
                      <p className="text-xs text-muted-foreground">per week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', overAllocatedUsers.length > 0 ? 'bg-destructive/10' : 'bg-success/10')}>
                      <AlertTriangle className={cn('size-5', overAllocatedUsers.length > 0 ? 'text-destructive' : 'text-success')} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Over-Allocated</p>
                      <p className="text-2xl font-bold">{overAllocatedUsers.length}</p>
                      <p className="text-xs text-muted-foreground">users need attention</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'users' | 'projects')}>
                  <TabsList>
                    <TabsTrigger value="users">By User</TabsTrigger>
                    <TabsTrigger value="projects">By Project</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Button className="gap-2" onClick={() => setShowAddModal(true)}>
                <Plus className="size-4" />
                Add Allocation
              </Button>
            </div>

            {/* Content */}
            {viewMode === 'users' ? (
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                  const userAllocations = getUserAllocations(user.id);
                  const totalAllocation = userAllocations.reduce((sum, a) => sum + a.allocation, 0);
                  const isOverAllocated = totalAllocation > 100;

                  return (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="size-12">
                            <AvatarImage src={user.avatar || '/placeholder.svg'} />
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h3 className="font-medium">{user.name}</h3>
                                <p className="text-sm text-muted-foreground capitalize">{user.role?.replace('-', ' ') || 'Contributor'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={isOverAllocated ? 'destructive' : totalAllocation >= 80 ? 'secondary' : 'outline'}>
                                  <Percent className="size-3 mr-1" />
                                  {totalAllocation}% allocated
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total Allocation</span>
                                <span className={cn('font-medium', isOverAllocated && 'text-destructive')}>
                                  {totalAllocation}%
                                </span>
                              </div>
                              <Progress 
                                value={Math.min(totalAllocation, 100)} 
                                className={cn('h-2', isOverAllocated && '[&>div]:bg-destructive')}
                              />
                            </div>

                            {userAllocations.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {userAllocations.map((allocation) => {
                                  const project = projects.find(p => p.id === allocation.projectId);
                                  return (
                                    <div key={allocation.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-xs">
                                          {project?.key}
                                        </Badge>
                                        <span className="text-sm">{project?.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{allocation.allocation}%</Badge>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-7">
                                              <MoreHorizontal className="size-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditAllocation(allocation.id)}>
                                              <Edit className="size-4 mr-2" />
                                              Edit Allocation
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              className="text-destructive"
                                              onClick={() => deleteResourceAllocation(allocation.id)}
                                            >
                                              <Trash2 className="size-4 mr-2" />
                                              Remove
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {userAllocations.length === 0 && (
                              <p className="text-sm text-muted-foreground mt-4">No project allocations</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => {
                  const projectAllocations = getProjectAllocations(project.id);
                  const totalAllocation = projectAllocations.reduce((sum, a) => sum + a.allocation, 0);
                  const totalFTE = totalAllocation / 100;

                  return (
                    <Card key={project.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-primary/10">
                            <FolderKanban className="size-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">{project.key}</Badge>
                                <h3 className="font-medium">{project.name}</h3>
                              </div>
                              <Badge variant="outline">
                                {totalFTE.toFixed(1)} FTE
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

                            {projectAllocations.length > 0 && (
                              <div className="space-y-2">
                                {projectAllocations.map((allocation) => {
                                  const user = users.find(u => u.id === allocation.userId);
                                  return (
                                    <div key={allocation.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                      <div className="flex items-center gap-3">
                                        <Avatar className="size-8">
                                          <AvatarImage src={user?.avatar || '/placeholder.svg'} />
                                          <AvatarFallback className="text-xs">
                                            {user?.name.split(' ').map(n => n[0]).join('')}
                                          </AvatarFallback>
                                        </Avatar>
                                          <div>
                                            <p className="text-sm font-medium">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{user?.role?.replace('-', ' ') || 'Contributor'}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{allocation.allocation}%</Badge>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-7">
                                              <MoreHorizontal className="size-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditAllocation(allocation.id)}>
                                              <Edit className="size-4 mr-2" />
                                              Edit Allocation
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              className="text-destructive"
                                              onClick={() => deleteResourceAllocation(allocation.id)}
                                            >
                                              <Trash2 className="size-4 mr-2" />
                                              Remove
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {projectAllocations.length === 0 && (
                              <p className="text-sm text-muted-foreground">No resources allocated</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
        <AICopilot />
      </div>

      {/* Add Allocation Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource Allocation</DialogTitle>
            <DialogDescription>Assign a team member to a project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Team Member</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.key} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Allocation: {allocationPercent}%</Label>
              <Slider
                value={[allocationPercent]}
                onValueChange={(v) => setAllocationPercent(v[0])}
                min={5}
                max={100}
                step={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddAllocation}>Add Allocation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Allocation Modal */}
      <Dialog open={!!editAllocation} onOpenChange={() => setEditAllocation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Allocation</DialogTitle>
            <DialogDescription>Adjust the allocation percentage</DialogDescription>
          </DialogHeader>
          {currentEditAllocation && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Allocation: {currentEditAllocation.allocation}%</Label>
                <Slider
                  value={[currentEditAllocation.allocation]}
                  onValueChange={(v) => {
                    if (editAllocation) {
                      updateResourceAllocation(editAllocation, { allocation: v[0] });
                    }
                  }}
                  min={5}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setEditAllocation(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
