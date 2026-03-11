'use client';

import { useState } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AICopilot } from '@/components/ai/ai-copilot';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react';

// Types for settings items
interface StatusItem {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
}

interface TagItem {
  id: string;
  name: string;
  color: string;
}

interface TypeItem {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface GroupItem {
  id: string;
  name: string;
  description?: string;
}

// Initial data
const initialStatuses: StatusItem[] = [
  { id: 'status-1', name: 'Open', color: '#6B7280', description: 'Task is newly created', order: 1 },
  { id: 'status-2', name: 'Assigned', color: '#3B82F6', description: 'Task has been assigned', order: 2 },
  { id: 'status-3', name: 'In Progress', color: '#F59E0B', description: 'Work is ongoing', order: 3 },
  { id: 'status-4', name: 'Pending Approval', color: '#8B5CF6', description: 'Awaiting review', order: 4 },
  { id: 'status-5', name: 'On Hold', color: '#EF4444', description: 'Work paused', order: 5 },
  { id: 'status-6', name: 'Closed', color: '#22C55E', description: 'Task completed', order: 6 },
];

const initialTags: TagItem[] = [
  { id: 'tag-1', name: 'Frontend', color: '#7B68EE' },
  { id: 'tag-2', name: 'Backend', color: '#3B82F6' },
  { id: 'tag-3', name: 'Design', color: '#F59E0B' },
  { id: 'tag-4', name: 'Bug', color: '#EF4444' },
  { id: 'tag-5', name: 'Feature', color: '#22C55E' },
  { id: 'tag-6', name: 'Documentation', color: '#8B5CF6' },
];

const initialTypes: TypeItem[] = [
  { id: 'type-1', name: 'Epic', icon: 'epic', color: '#8B5CF6' },
  { id: 'type-2', name: 'Story', icon: 'story', color: '#22C55E' },
  { id: 'type-3', name: 'Task', icon: 'task', color: '#3B82F6' },
  { id: 'type-4', name: 'Subtask', icon: 'subtask', color: '#6B7280' },
  { id: 'type-5', name: 'Bug', icon: 'bug', color: '#EF4444' },
];

const initialGroups: GroupItem[] = [
  { id: 'group-1', name: 'Development', description: 'Development team tasks' },
  { id: 'group-2', name: 'Design', description: 'Design and UX tasks' },
  { id: 'group-3', name: 'QA', description: 'Quality assurance tasks' },
  { id: 'group-4', name: 'DevOps', description: 'Infrastructure and deployment' },
];

export default function SettingsPage() {
  const [statuses, setStatuses] = useState<StatusItem[]>(initialStatuses);
  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [types, setTypes] = useState<TypeItem[]>(initialTypes);
  const [groups, setGroups] = useState<GroupItem[]>(initialGroups);

  // Modal states
  const [editingStatus, setEditingStatus] = useState<StatusItem | null>(null);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [editingType, setEditingType] = useState<TypeItem | null>(null);
  const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);

  const [showAddStatus, setShowAddStatus] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);

  // Form states
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6B7280');
  const [newStatusDescription, setNewStatusDescription] = useState('');

  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#3B82F6');

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Status handlers
  const handleAddStatus = () => {
    if (!newStatusName.trim()) return;
    const newStatus: StatusItem = {
      id: `status-${Date.now()}`,
      name: newStatusName.trim(),
      color: newStatusColor,
      description: newStatusDescription.trim(),
      order: statuses.length + 1,
    };
    setStatuses([...statuses, newStatus]);
    setNewStatusName('');
    setNewStatusColor('#6B7280');
    setNewStatusDescription('');
    setShowAddStatus(false);
  };

  const handleUpdateStatus = () => {
    if (!editingStatus) return;
    setStatuses(statuses.map(s => s.id === editingStatus.id ? editingStatus : s));
    setEditingStatus(null);
  };

  const handleDeleteStatus = (id: string) => {
    setStatuses(statuses.filter(s => s.id !== id));
  };

  // Tag handlers
  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    const newTag: TagItem = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      color: newTagColor,
    };
    setTags([...tags, newTag]);
    setNewTagName('');
    setNewTagColor('#3B82F6');
    setShowAddTag(false);
  };

  const handleUpdateTag = () => {
    if (!editingTag) return;
    setTags(tags.map(t => t.id === editingTag.id ? editingTag : t));
    setEditingTag(null);
  };

  const handleDeleteTag = (id: string) => {
    setTags(tags.filter(t => t.id !== id));
  };

  // Type handlers
  const handleAddType = () => {
    if (!newTypeName.trim()) return;
    const newType: TypeItem = {
      id: `type-${Date.now()}`,
      name: newTypeName.trim(),
      icon: newTypeName.toLowerCase(),
      color: newTypeColor,
    };
    setTypes([...types, newType]);
    setNewTypeName('');
    setNewTypeColor('#3B82F6');
    setShowAddType(false);
  };

  const handleUpdateType = () => {
    if (!editingType) return;
    setTypes(types.map(t => t.id === editingType.id ? editingType : t));
    setEditingType(null);
  };

  const handleDeleteType = (id: string) => {
    setTypes(types.filter(t => t.id !== id));
  };

  // Group handlers
  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: GroupItem = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
    };
    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setNewGroupDescription('');
    setShowAddGroup(false);
  };

  const handleUpdateGroup = () => {
    if (!editingGroup) return;
    setGroups(groups.map(g => g.id === editingGroup.id ? editingGroup : g));
    setEditingGroup(null);
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="Settings"
          subtitle="Manage your workspace configuration"
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="statuses" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="statuses">Statuses</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
                <TabsTrigger value="types">Types</TabsTrigger>
                <TabsTrigger value="groups">Groups</TabsTrigger>
              </TabsList>

              {/* Statuses Tab */}
              <TabsContent value="statuses">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Task Statuses</CardTitle>
                      <CardDescription>Configure workflow statuses for your tasks</CardDescription>
                    </div>
                    <Button onClick={() => setShowAddStatus(true)} className="gap-2">
                      <Plus className="size-4" />
                      Add Status
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statuses.map((status) => (
                          <TableRow key={status.id}>
                            <TableCell>
                              <GripVertical className="size-4 text-muted-foreground cursor-move" />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="size-3 rounded-full"
                                  style={{ backgroundColor: status.color }}
                                />
                                <span className="font-medium">{status.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" style={{ borderColor: status.color, color: status.color }}>
                                {status.color}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {status.description || '-'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingStatus(status)}>
                                    <Pencil className="size-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteStatus(status.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tags Tab */}
              <TabsContent value="tags">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Tags</CardTitle>
                      <CardDescription>Organize tasks with custom tags</CardDescription>
                    </div>
                    <Button onClick={() => setShowAddTag(true)} className="gap-2">
                      <Plus className="size-4" />
                      Add Tag
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="size-4 rounded"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="font-medium">{tag.name}</span>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingTag(tag)}>
                                <Pencil className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteTag(tag.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Types Tab */}
              <TabsContent value="types">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Task Types</CardTitle>
                      <CardDescription>Define different types of work items</CardDescription>
                    </div>
                    <Button onClick={() => setShowAddType(true)} className="gap-2">
                      <Plus className="size-4" />
                      Add Type
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead>Preview</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {types.map((type) => (
                          <TableRow key={type.id}>
                            <TableCell className="font-medium">{type.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="size-3 rounded"
                                  style={{ backgroundColor: type.color }}
                                />
                                <span className="text-muted-foreground">{type.color}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge style={{ backgroundColor: type.color, color: '#fff' }}>
                                {type.name}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingType(type)}>
                                    <Pencil className="size-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteType(type.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Groups Tab */}
              <TabsContent value="groups">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Task Groups</CardTitle>
                      <CardDescription>Organize tasks into logical groups</CardDescription>
                    </div>
                    <Button onClick={() => setShowAddGroup(true)} className="gap-2">
                      <Plus className="size-4" />
                      Add Group
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groups.map((group) => (
                          <TableRow key={group.id}>
                            <TableCell className="font-medium">{group.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {group.description || '-'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setEditingGroup(group)}>
                                    <Pencil className="size-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteGroup(group.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="size-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        <AICopilot />
      </div>

      {/* Add Status Modal */}
      <Dialog open={showAddStatus} onOpenChange={setShowAddStatus}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Status</DialogTitle>
            <DialogDescription>Create a new workflow status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="e.g., In Review"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={newStatusDescription}
                onChange={(e) => setNewStatusDescription(e.target.value)}
                placeholder="Brief description of this status"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStatus(false)}>Cancel</Button>
            <Button onClick={handleAddStatus} disabled={!newStatusName.trim()}>Add Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Status Modal */}
      <Dialog open={!!editingStatus} onOpenChange={() => setEditingStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Status</DialogTitle>
            <DialogDescription>Update status details</DialogDescription>
          </DialogHeader>
          {editingStatus && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingStatus.name}
                  onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={editingStatus.color}
                    onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={editingStatus.color}
                    onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingStatus.description || ''}
                  onChange={(e) => setEditingStatus({ ...editingStatus, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingStatus(null)}>Cancel</Button>
            <Button onClick={handleUpdateStatus}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Tag Modal */}
      <Dialog open={showAddTag} onOpenChange={setShowAddTag}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
            <DialogDescription>Create a new tag for organizing tasks</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., Urgent"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTag(false)}>Cancel</Button>
            <Button onClick={handleAddTag} disabled={!newTagName.trim()}>Add Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Modal */}
      <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
            <DialogDescription>Update tag details</DialogDescription>
          </DialogHeader>
          {editingTag && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingTag.name}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={editingTag.color}
                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTag(null)}>Cancel</Button>
            <Button onClick={handleUpdateTag}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Type Modal */}
      <Dialog open={showAddType} onOpenChange={setShowAddType}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task Type</DialogTitle>
            <DialogDescription>Create a new type of work item</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g., Improvement"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  value={newTypeColor}
                  onChange={(e) => setNewTypeColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={newTypeColor}
                  onChange={(e) => setNewTypeColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddType(false)}>Cancel</Button>
            <Button onClick={handleAddType} disabled={!newTypeName.trim()}>Add Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Type Modal */}
      <Dialog open={!!editingType} onOpenChange={() => setEditingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task Type</DialogTitle>
            <DialogDescription>Update type details</DialogDescription>
          </DialogHeader>
          {editingType && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingType.name}
                  onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={editingType.color}
                    onChange={(e) => setEditingType({ ...editingType, color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={editingType.color}
                    onChange={(e) => setEditingType({ ...editingType, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingType(null)}>Cancel</Button>
            <Button onClick={handleUpdateType}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Modal */}
      <Dialog open={showAddGroup} onOpenChange={setShowAddGroup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group</DialogTitle>
            <DialogDescription>Create a new task group</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Marketing"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Brief description of this group"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddGroup(false)}>Cancel</Button>
            <Button onClick={handleAddGroup} disabled={!newGroupName.trim()}>Add Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Modal */}
      <Dialog open={!!editingGroup} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update group details</DialogDescription>
          </DialogHeader>
          {editingGroup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={editingGroup.description || ''}
                  onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGroup(null)}>Cancel</Button>
            <Button onClick={handleUpdateGroup}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
