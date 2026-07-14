'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, User as UserIcon, MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser, getRoles, assignUserRole } from '@/lib/api';
import { useApp } from '@/lib/app-context';
import { PermissionGate } from '@/lib/permission-guard';

export function UsersPanel() {
  const { currentUser } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit state
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteUser, setShowDeleteUser] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes] = await Promise.all([getUsers(), getRoles()]);
      setUsers(uRes);
      setRoles(rRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newName || !newEmail || !newPassword || !newRoleId) return;
    setCreating(true);
    try {
      const newUser = await createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        system_role_id: newRoleId,
      });
      // Optionally assign the role explicitly if the backend doesn't handle it in createUser
      // await assignUserRole(newUser.id, { role_id: newRoleId, scope_type: 'global' });
      setShowAddUser(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRoleId('');
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to create user. Email may already exist or invalid input.');
    } finally {
      setCreating(false);
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRoleId(user.system_role_id || '');
    setShowEditUser(true);
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUser(editingUser.id, {
        name: editName,
        email: editEmail,
        system_role_id: editRoleId || undefined,
      });
      
      // If role changed, manually re-assign it so UserRole table updates
      if (editRoleId && editRoleId !== editingUser.system_role_id) {
        try {
          await assignUserRole(editingUser.id, { role_id: editRoleId, scope_type: 'global' });
        } catch (roleErr) {
          console.error("Failed to assign new role. It might have already been assigned.", roleErr);
        }
      }

      setShowEditUser(false);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (user: any) => {
    setUserToDelete(user);
    setShowDeleteUser(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setShowDeleteUser(false);
      setUserToDelete(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  const getRoleName = (roleId: string) => {
    if (!roleId) return 'No Role';
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown';
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getRoleName(user.system_role_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Create and manage workspace users</CardDescription>
          </div>
          <PermissionGate permission="users:create">
            <Button onClick={() => setShowAddUser(true)} className="gap-2">
              <Plus className="size-4" />
              Add User
            </Button>
          </PermissionGate>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 max-w-sm"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>System Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">Loading users...</TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No users found.</TableCell>
                </TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <UserIcon className="size-4 text-muted-foreground" />
                    {user.name}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.system_role_id ? 'default' : 'secondary'}>
                      {getRoleName(user.system_role_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at || Date.now()).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.email === 'superadmin@hexerve.com' ? (
                      <span className="text-xs text-muted-foreground italic">Protected</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <PermissionGate permission="users:update">
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Pencil className="size-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </PermissionGate>
                          <PermissionGate permission="users:delete">
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(user)}
                              disabled={currentUser?.id === user.id}
                              className="text-destructive"
                              title={currentUser?.id === user.id ? "You cannot delete yourself" : ""}
                            >
                              <Trash2 className="size-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </PermissionGate>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>Add a new user to the workspace and assign their initial role.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <div className="flex items-center gap-2">
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" />
                <Button 
                  variant="outline" 
                  onClick={() => setNewPassword(Math.random().toString(36).slice(-8) + 'X1!')}
                >
                  Generate
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign System Role <span className="text-destructive">*</span></Label>
              <Select value={newRoleId} onValueChange={setNewRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter(r => r.slug !== 'super_admin').map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name} {r.is_system && '(System)'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creating || !newName || !newEmail || !newPassword || !newRoleId}>
              {creating ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details and access level.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>System Role</Label>
              <Select value={editRoleId} onValueChange={setEditRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.filter(r => r.slug !== 'super_admin').map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name} {r.is_system && '(System)'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditUser(false)}>Cancel</Button>
            <Button onClick={handleEditUser} disabled={saving || !editName || !editEmail}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteUser} onOpenChange={setShowDeleteUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>? This will soft-delete their account and revoke their access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteUser(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
