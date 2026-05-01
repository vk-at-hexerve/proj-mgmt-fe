'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { invoices as initialInvoices, products, projects } from '@/lib/mock-data';
import type { Invoice, InvoiceStatus, InvoiceLineItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  DollarSign,
  Receipt,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Download,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';

const statusConfig: Record<InvoiceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300', icon: <FileText className="size-3.5" /> },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300', icon: <Send className="size-3.5" /> },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300', icon: <CheckCircle2 className="size-3.5" /> },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300', icon: <AlertCircle className="size-3.5" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400', icon: <XCircle className="size-3.5" /> },
};

export default function InvoicesPage() {
  const { clients, showToast } = useApp();
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    lineItems: [] as InvoiceLineItem[],
  });

  const filteredInvoices = invoices.filter(inv => {
    const client = clients.find(c => c.id === inv.clientId);
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const pendingAmount = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total, 0);
  const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.total, 0);

  const handleOpenDialog = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        clientId: invoice.clientId,
        projectId: invoice.projectId || '',
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        notes: invoice.notes || '',
        lineItems: invoice.lineItems,
      });
    } else {
      setEditingInvoice(null);
      setFormData({
        clientId: '',
        projectId: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
        lineItems: [],
      });
    }
    setDialogOpen(true);
  };

  const handleAddLineItem = () => {
    const newItem: InvoiceLineItem = {
      id: `li-${Date.now()}`,
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      total: 0,
    };
    setFormData(p => ({ ...p, lineItems: [...p.lineItems, newItem] }));
  };

  const handleUpdateLineItem = (index: number, updates: Partial<InvoiceLineItem>) => {
    const newItems = [...formData.lineItems];
    newItems[index] = { ...newItems[index], ...updates };
    // Recalculate total
    newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    setFormData(p => ({ ...p, lineItems: newItems }));
  };

  const handleRemoveLineItem = (index: number) => {
    setFormData(p => ({ ...p, lineItems: p.lineItems.filter((_, i) => i !== index) }));
  };

  const handleSelectProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      handleUpdateLineItem(index, {
        productId,
        description: product.name,
        unitPrice: product.unitPrice,
        taxRate: product.taxRate,
        total: product.unitPrice * formData.lineItems[index].quantity,
      });
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxTotal = formData.lineItems.reduce((sum, item) => sum + (item.total * item.taxRate / 100), 0);
    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  const handleSaveInvoice = () => {
    if (!formData.clientId || !formData.dueDate || formData.lineItems.length === 0) return;

    const now = new Date().toISOString().split('T')[0];
    const totals = calculateTotals();

    if (editingInvoice) {
      setInvoices(prev => prev.map(inv =>
        inv.id === editingInvoice.id
          ? { 
              ...inv, 
              ...formData, 
              ...totals,
              updatedAt: now 
            }
          : inv
      ));
      showToast({ title: 'Invoice updated', type: 'success' });
    } else {
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`;
      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber,
        clientId: formData.clientId,
        projectId: formData.projectId || undefined,
        status: 'draft',
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        lineItems: formData.lineItems,
        ...totals,
        notes: formData.notes || undefined,
        createdAt: now,
        updatedAt: now,
      };
      setInvoices(prev => [newInvoice, ...prev]);
      showToast({ title: 'Invoice created', type: 'success' });
    }
    setDialogOpen(false);
  };

  const handleUpdateStatus = (id: string, status: InvoiceStatus) => {
    const now = new Date().toISOString().split('T')[0];
    setInvoices(prev => prev.map(inv =>
      inv.id === id
        ? { ...inv, status, updatedAt: now, paidAt: status === 'paid' ? now : inv.paidAt }
        : inv
    ));
    showToast({ title: `Invoice marked as ${status}`, type: 'success' });
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    showToast({ title: 'Invoice deleted', type: 'success' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader 
          title="Invoices" 
          subtitle="Create and manage client invoices" 
          actions={
            <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
              <Plus className="size-4" />
              Create Invoice
            </Button>
          }
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Receipt className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{invoices.length}</p>
                      <p className="text-sm text-muted-foreground">Total Invoices</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <DollarSign className="size-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{formatCurrency(totalRevenue)}</p>
                      <p className="text-sm text-muted-foreground">Paid</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Clock className="size-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{formatCurrency(pendingAmount)}</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <AlertCircle className="size-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{formatCurrency(overdueAmount)}</p>
                      <p className="text-sm text-muted-foreground">Overdue</p>
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
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus | 'all')}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        {config.icon}
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="mt-6">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map(invoice => {
                      const status = statusConfig[invoice.status];
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
                          </TableCell>
                          <TableCell>{getClientName(invoice.clientId)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('gap-1', status.color)}>
                              {status.icon}
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setViewingInvoice(invoice); setViewDialogOpen(true); }}>
                                  <Eye className="size-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenDialog(invoice)}>
                                  <Pencil className="size-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => showToast({ title: 'Download started', type: 'info' })}>
                                  <Download className="size-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {invoice.status === 'draft' && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'sent')}>
                                    <Send className="size-4 mr-2" />
                                    Mark as Sent
                                  </DropdownMenuItem>
                                )}
                                {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'paid')}>
                                    <CheckCircle2 className="size-4 mr-2" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice.id)} className="text-destructive">
                                  <Trash2 className="size-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Create/Edit Invoice Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}</DialogTitle>
                  <DialogDescription>
                    {editingInvoice ? 'Update invoice details' : 'Create a new invoice for a client'}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Client *</Label>
                        <Select value={formData.clientId} onValueChange={(v) => setFormData(p => ({ ...p, clientId: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Project (Optional)</Label>
                        <Select value={formData.projectId} onValueChange={(v) => setFormData(p => ({ ...p, projectId: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No project</SelectItem>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Issue Date *</Label>
                        <Input
                          type="date"
                          value={formData.issueDate}
                          onChange={(e) => setFormData(p => ({ ...p, issueDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Due Date *</Label>
                        <Input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Line Items */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Line Items</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddLineItem} className="gap-1">
                          <Plus className="size-3.5" />
                          Add Item
                        </Button>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Product</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="w-20">Qty</TableHead>
                              <TableHead className="w-24">Price</TableHead>
                              <TableHead className="w-24 text-right">Total</TableHead>
                              <TableHead className="w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {formData.lineItems.map((item, index) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <Select 
                                    value={item.productId} 
                                    onValueChange={(v) => handleSelectProduct(index, v)}
                                  >
                                    <SelectTrigger className="h-8">
                                      <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {products.map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          {product.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    className="h-8"
                                    value={item.description}
                                    onChange={(e) => handleUpdateLineItem(index, { description: e.target.value })}
                                    placeholder="Description"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    className="h-8"
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateLineItem(index, { 
                                      quantity: parseInt(e.target.value) || 1,
                                      total: (parseInt(e.target.value) || 1) * item.unitPrice
                                    })}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    className="h-8"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => handleUpdateLineItem(index, { 
                                      unitPrice: parseFloat(e.target.value) || 0,
                                      total: item.quantity * (parseFloat(e.target.value) || 0)
                                    })}
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(item.total)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-6"
                                    onClick={() => handleRemoveLineItem(index)}
                                  >
                                    <Trash2 className="size-3.5 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                            {formData.lineItems.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                  No items added. Click "Add Item" to add line items.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Totals */}
                      {formData.lineItems.length > 0 && (
                        <div className="flex justify-end">
                          <div className="w-64 space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>{formatCurrency(calculateTotals().subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tax</span>
                              <span>{formatCurrency(calculateTotals().taxTotal)}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-base pt-1 border-t">
                              <span>Total</span>
                              <span>{formatCurrency(calculateTotals().total)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Additional notes..."
                        rows={2}
                      />
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter className="pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleSaveInvoice}
                    disabled={!formData.clientId || !formData.dueDate || formData.lineItems.length === 0}
                  >
                    {editingInvoice ? 'Update' : 'Create'} Invoice
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* View Invoice Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Invoice {viewingInvoice?.invoiceNumber}</DialogTitle>
                </DialogHeader>
                {viewingInvoice && (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-lg">{getClientName(viewingInvoice.clientId)}</p>
                        <p className="text-sm text-muted-foreground">
                          Issued: {new Date(viewingInvoice.issueDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(viewingInvoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className={cn('gap-1', statusConfig[viewingInvoice.status].color)}>
                        {statusConfig[viewingInvoice.status].icon}
                        {statusConfig[viewingInvoice.status].label}
                      </Badge>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-20 text-right">Qty</TableHead>
                          <TableHead className="w-24 text-right">Price</TableHead>
                          <TableHead className="w-24 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingInvoice.lineItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-end">
                      <div className="w-64 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(viewingInvoice.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span>{formatCurrency(viewingInvoice.taxTotal)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg pt-1 border-t">
                          <span>Total</span>
                          <span>{formatCurrency(viewingInvoice.total)}</span>
                        </div>
                      </div>
                    </div>

                    {viewingInvoice.notes && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">{viewingInvoice.notes}</p>
                      </div>
                    )}
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                  <Button onClick={() => showToast({ title: 'Download started', type: 'info' })} className="gap-2">
                    <Download className="size-4" />
                    Download PDF
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
