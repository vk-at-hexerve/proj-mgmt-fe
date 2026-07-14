'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Shield, MoreHorizontal, Pencil, Trash2, Lock, Eye, Clock, User as UserIcon } from 'lucide-react';
import { getRoles, getPermissions, createRole, updateRole, deleteRole, getRoleDetail, getAuditLog, getUsers } from '@/lib/api';
import { PermissionGate } from '@/lib/permission-guard';

export function RolesPanel() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  
  // Create state
  const [showAddRole, setShowAddRole] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLevel, setNewLevel] = useState(100);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [copyFromRole, setCopyFromRole] = useState('');

  // Edit/View state
  const [showEditRole, setShowEditRole] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLevel, setEditLevel] = useState(100);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteRole, setShowDeleteRole] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, uRes] = await Promise.all([getRoles(), getPermissions(), getUsers()]);
      setRoles(rRes);
      setPermissions(pRes);
      setUsers(uRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await getAuditLog(50, 0);
      setAuditLogs(logs);
    } catch (e) {
      console.error("Failed to load audit logs", e);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleNameChange = (val: string) => {
    setNewName(val);
    if (!copyFromRole) {
      setNewSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''));
    }
  };

  const handleCopyFromChange = async (roleId: string) => {
    setCopyFromRole(roleId);
    if (roleId) {
      try {
        const detail = await getRoleDetail(roleId);
        setSelectedPerms(detail.permissions.map((p: any) => p.id));
      } catch (e) {
        console.error("Failed to load role details to copy", e);
      }
    } else {
      setSelectedPerms([]);
    }
  };

  const handleCreateRole = async () => {
    if (!newName || !newSlug) return;
    setCreating(true);
    try {
      await createRole({
        name: newName,
        slug: newSlug,
        description: newDesc,
        hierarchy_level: newLevel,
        permission_ids: selectedPerms
      });
      setShowAddRole(false);
      setNewName('');
      setNewSlug('');
      setNewDesc('');
      setNewLevel(100);
      setSelectedPerms([]);
      setCopyFromRole('');
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert('Failed to create role. ' + (e.message || ''));
    } finally {
      setCreating(false);
    }
  };

  const openRoleDetail = async (role: any, mode: 'view' | 'edit') => {
    try {
      const detail = await getRoleDetail(role.id);
      setEditingRole(detail);
      setEditName(detail.name);
      setEditDesc(detail.description || '');
      setEditLevel(detail.hierarchy_level || 100);
      setSelectedPerms(detail.permissions.map((p: any) => p.id));
      setShowEditRole(true);
    } catch (e) {
      console.error("Failed to fetch role details", e);
    }
  };

  const handleEditRole = async () => {
    if (!editingRole || editingRole.is_system) return;
    setSaving(true);
    try {
      await updateRole(editingRole.id, {
        name: editName,
        description: editDesc,
        hierarchy_level: editLevel,
        permission_ids: selectedPerms
      });
      setShowEditRole(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to update role.');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (role: any) => {
    setRoleToDelete(role);
    setShowDeleteRole(true);
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    setDeleting(true);
    try {
      await deleteRole(roleToDelete.id);
      setShowDeleteRole(false);
      setRoleToDelete(null);
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert('Failed to delete role. ' + (e.message || ''));
    } finally {
      setDeleting(false);
    }
  };

  const togglePermission = (id: string, isSystem: boolean) => {
    if (isSystem) return; // System roles cannot have permissions toggled
    setSelectedPerms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.module]) acc[perm.module] = [];
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const getUserCountForRole = (roleId: string) => {
    return users.filter(u => u.system_role_id === roleId).length;
  };

  return (
    <Tabs defaultValue="rolesList" className="space-y-4" onValueChange={(val) => {
      if (val === 'audit') loadLogs();
    }}>
      <TabsList>
        <TabsTrigger value="rolesList">Roles List</TabsTrigger>
        <PermissionGate permission="roles:manage">
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </PermissionGate>
      </TabsList>

      <TabsContent value="rolesList">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Manage RBAC roles and their associated capabilities</CardDescription>
            </div>
            <PermissionGate permission="roles:create_custom">
              <Button onClick={() => setShowAddRole(true)} className="gap-2">
                <Plus className="size-4" />
                Create Custom Role
              </Button>
            </PermissionGate>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">Loading roles...</TableCell>
                  </TableRow>
                ) : roles.map((role) => {
                  const userCount = getUserCountForRole(role.id);
                  return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Shield className="size-4 text-muted-foreground" />
                      {role.name}
                      {role.is_system && <span title="System Role"><Lock className="size-3 text-muted-foreground" /></span>}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{role.slug}</TableCell>
                    <TableCell>{role.hierarchy_level}</TableCell>
                    <TableCell>
                      <Badge variant={role.is_system ? 'default' : 'outline'}>
                        {role.is_system ? 'System' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                        <UserIcon className="size-3.5" />
                        {userCount}
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
                          <DropdownMenuItem onClick={() => openRoleDetail(role, role.is_system ? 'view' : 'edit')}>
                            {role.is_system ? <Eye className="size-4 mr-2" /> : <Pencil className="size-4 mr-2" />}
                            {role.is_system ? 'View Details' : 'Edit'}
                          </DropdownMenuItem>
                          
                          {!role.is_system && (
                            <PermissionGate permission="roles:manage">
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(role)}
                                disabled={userCount > 0}
                                className="text-destructive"
                                title={userCount > 0 ? "Cannot delete role with assigned users" : ""}
                              >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </PermissionGate>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="audit">
        <Card>
          <CardHeader>
            <CardTitle>Role Audit Log</CardTitle>
            <CardDescription>History of role assignments and modifications</CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
               <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">No audit logs found.</div>
            ) : (
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card">
                    <div className="bg-muted p-2 rounded-full">
                      <Clock className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          Action: <Badge variant="outline" className="ml-1">{log.action}</Badge>
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        <p><strong>Actor ID:</strong> {log.actor_id}</p>
                        <p><strong>Target User ID:</strong> {log.user_id}</p>
                        {log.role_id && <p><strong>Role ID:</strong> {log.role_id}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Create Custom Role Dialog */}
      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>Define a new role and select its permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input value={newName} onChange={e => handleNameChange(e.target.value)} placeholder="E.g., Guest Auditor" />
              </div>
              <div className="space-y-2">
                <Label>Slug Identifier (lowercase, underscores)</Label>
                <Input 
                  value={newSlug} 
                  onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]+/g, ''))} 
                  placeholder="guest_auditor" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Role description..." />
              </div>
              <div className="space-y-2">
                <Label>Copy Permissions From</Label>
                <Select value={copyFromRole} onValueChange={handleCopyFromChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Start from scratch..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Start from scratch...</SelectItem>
                    {roles.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name} {r.is_system && '(System)'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-4">Permissions Checklist</h4>
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([module, perms]: [string, any]) => (
                  <div key={module}>
                    <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{module}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {perms.map((perm: any) => (
                        <div key={perm.id} className="flex items-start space-x-2 border p-2 rounded-md">
                          <Checkbox 
                            id={`new-${perm.id}`} 
                            checked={selectedPerms.includes(perm.id)} 
                            onCheckedChange={() => togglePermission(perm.id, false)} 
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label htmlFor={`new-${perm.id}`} className="text-sm font-medium leading-none cursor-pointer">
                              {perm.action}
                            </label>
                            <p className="text-xs text-muted-foreground font-mono">{perm.code}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddRole(false)}>Cancel</Button>
            <Button onClick={handleCreateRole} disabled={creating || !newName || !newSlug}>
              {creating ? 'Creating...' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/View Custom Role Dialog */}
      <Dialog open={showEditRole} onOpenChange={setShowEditRole}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingRole?.is_system ? 'View System Role' : 'Edit Custom Role'}
              {editingRole?.is_system && <Badge variant="secondary" className="ml-2">Read Only</Badge>}
            </DialogTitle>
            <DialogDescription>
              {editingRole?.is_system ? 'System roles cannot be modified.' : 'Update role details and permissions.'}
            </DialogDescription>
          </DialogHeader>
          {editingRole && (
            <div className="space-y-4 py-4 overflow-y-auto pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    disabled={editingRole.is_system} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hierarchy Level</Label>
                  <Input 
                    type="number" 
                    value={editLevel} 
                    onChange={e => setEditLevel(Number(e.target.value))} 
                    disabled={editingRole.is_system} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={editDesc} 
                  onChange={e => setEditDesc(e.target.value)} 
                  disabled={editingRole.is_system} 
                />
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-4">Permissions Checklist</h4>
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([module, perms]: [string, any]) => (
                    <div key={module}>
                      <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{module}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {perms.map((perm: any) => (
                          <div key={perm.id} className={`flex items-start space-x-2 border p-2 rounded-md ${editingRole.is_system ? 'opacity-70 bg-muted/50' : ''}`}>
                            <Checkbox 
                              id={`edit-${perm.id}`} 
                              checked={selectedPerms.includes(perm.id) || selectedPerms.includes('*')} 
                              onCheckedChange={() => togglePermission(perm.id, editingRole.is_system)}
                              disabled={editingRole.is_system || selectedPerms.includes('*')}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label htmlFor={`edit-${perm.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                {perm.action}
                              </label>
                              <p className="text-xs text-muted-foreground font-mono">{perm.code}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEditRole(false)}>
              {editingRole?.is_system ? 'Close' : 'Cancel'}
            </Button>
            {!editingRole?.is_system && (
              <Button onClick={handleEditRole} disabled={saving || !editName}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Dialog */}
      <Dialog open={showDeleteRole} onOpenChange={setShowDeleteRole}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role <strong>{roleToDelete?.name}</strong>? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteRole(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRole} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
