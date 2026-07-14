'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import type { Client, ClientType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Mail,
  Phone,
  Building2,
  MapPin,
  UserCircle,
  Users,
  ExternalLink,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { AICopilot } from '@/components/ai/ai-copilot';
import { PermissionGate } from '@/lib/permission-guard';

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient, openModal, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ClientType | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    type: 'external' as ClientType,
    address: '',
    notes: '',
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const externalClients = clients.filter(c => c.type === 'external');
  const internalClients = clients.filter(c => c.type === 'internal');

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        company: client.company || '',
        type: client.type,
        address: client.address || '',
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        type: 'external',
        address: '',
        notes: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSaveClient = () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    const now = new Date().toISOString().split('T')[0];

    if (editingClient) {
      updateClient(editingClient.id, formData);
    } else {
      addClient(formData);
    }
    setDialogOpen(false);
  };

  const handleDeleteClient = (id: string) => {
    deleteClient(id);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader
          title="Clients"
          subtitle="Manage external and internal clients for your projects"
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex justify-end mb-4">
              <PermissionGate permission="clients:create">
                <Button onClick={() => handleOpenDialog()} size="sm" className="gap-1">
                  <Plus className="size-4" />
                  Create Client
                </Button>
              </PermissionGate>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{clients.length}</p>
                      <p className="text-sm text-muted-foreground">Total Clients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <ExternalLink className="size-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{externalClients.length}</p>
                      <p className="text-sm text-muted-foreground">External Clients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <Building className="size-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{internalClients.length}</p>
                      <p className="text-sm text-muted-foreground">Internal Clients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 py-3 border-b border-border">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ClientType | 'all')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')} className="ml-auto">
                <TabsList>
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="table">Table</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content */}
            <div className="mt-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredClients.map(client => (
                    <Card
                      key={client.id}
                      className="group hover:shadow-md transition-shadow cursor-pointer border-border/50 hover:border-primary/30"
                      onClick={() => openModal('client-detail', { clientId: client.id })}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-10">
                              <AvatarFallback className={cn(
                                'text-sm font-medium',
                                client.type === 'external' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              )}>
                                {getInitials(client.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <CardTitle className="text-base truncate">{client.name}</CardTitle>
                              <Badge variant="outline" className={cn(
                                'text-[10px] mt-1',
                                client.type === 'external' ? 'border-blue-300 text-blue-600' : 'border-green-300 text-green-600'
                              )}>
                                {client.type}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDialog(client)}>
                                <Pencil className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-destructive">
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {client.company && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="size-3.5 shrink-0" />
                            <span className="truncate">{client.company}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="size-3.5 shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="size-3.5 shrink-0" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{client.address}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map(client => (
                        <TableRow
                          key={client.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openModal('client-detail', { clientId: client.id })}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-8">
                                <AvatarFallback className={cn(
                                  'text-xs',
                                  client.type === 'external' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                )}>
                                  {getInitials(client.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{client.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              'text-xs capitalize',
                              client.type === 'external' ? 'border-blue-300 text-blue-600' : 'border-green-300 text-green-600'
                            )}>
                              {client.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{client.company || '-'}</TableCell>
                          <TableCell>{client.email}</TableCell>
                          <TableCell>{client.phone || '-'}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenDialog(client)}>
                                  <Pencil className="size-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteClient(client.id)} className="text-destructive">
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
                </Card>
              )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                  <DialogDescription>
                    {editingClient ? 'Update client information' : 'Add a new external or internal client'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="client-company">Company Name</Label>
                      <Input
                        id="client-company"
                        placeholder="Acme Inc."
                        value={formData.company}
                        onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
                        autoFocus
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="contact-name">Contact Name *</Label>
                      <Input
                        id="contact-name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="client-email">Email *</Label>
                      <Input
                        id="client-email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="client-phone">Phone</Label>
                      <Input
                        id="client-phone"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="client-type">Client Type *</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v as ClientType }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="external">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="size-4 text-blue-500" />
                            External Client
                          </div>
                        </SelectItem>
                        <SelectItem value="internal">
                          <div className="flex items-center gap-2">
                            <Building className="size-4 text-green-500" />
                            Internal Department
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client-address">Address</Label>
                    <Textarea
                      id="client-address"
                      placeholder="Full address"
                      value={formData.address}
                      onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="client-notes">Notes</Label>
                    <Textarea
                      id="client-notes"
                      placeholder="Additional notes..."
                      value={formData.notes}
                      onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleSaveClient}
                    disabled={!formData.name.trim() || !formData.email.trim()}
                  >
                    {editingClient ? 'Update' : 'Create'} Client
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
