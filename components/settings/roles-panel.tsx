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
import { Plus, Shield } from 'lucide-react';
import { getRoles, getPermissions, createRole } from '@/lib/api';

export function RolesPanel() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddRole, setShowAddRole] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLevel, setNewLevel] = useState(100);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(rRes);
      setPermissions(pRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Failed to create role.');
    } finally {
      setCreating(false);
    }
  };

  const togglePermission = (id: string) => {
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Roles & Permissions</CardTitle>
            <CardDescription>Manage RBAC roles and their associated capabilities</CardDescription>
          </div>
          <Button onClick={() => setShowAddRole(true)} className="gap-2">
            <Plus className="size-4" />
            Create Custom Role
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">Loading roles...</TableCell>
                </TableRow>
              ) : roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Shield className="size-4 text-muted-foreground" />
                    {role.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{role.slug}</TableCell>
                  <TableCell>{role.hierarchy_level}</TableCell>
                  <TableCell>
                    <Badge variant={role.is_system ? 'default' : 'outline'}>
                      {role.is_system ? 'System' : 'Custom'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAddRole} onOpenChange={setShowAddRole}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Custom Role</DialogTitle>
            <DialogDescription>Define a new role and select its permissions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="E.g., Guest Auditor" />
              </div>
              <div className="space-y-2">
                <Label>Slug Identifier</Label>
                <Input value={newSlug} onChange={e => setNewSlug(e.target.value)} placeholder="guest_auditor" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Can read projects but not modify them." />
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
                            id={perm.id} 
                            checked={selectedPerms.includes(perm.id)} 
                            onCheckedChange={() => togglePermission(perm.id)} 
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label htmlFor={perm.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                              {perm.action}
                            </label>
                            <p className="text-xs text-muted-foreground">{perm.code}</p>
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
    </>
  );
}
