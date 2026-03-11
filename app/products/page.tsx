'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import { products as initialProducts } from '@/lib/mock-data';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  DollarSign,
  CheckCircle2,
  XCircle,
  Archive,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = ['Development', 'Design', 'Management', 'Consulting', 'Retainer', 'Creative', 'Marketing'];
const units = ['hour', 'day', 'week', 'month', 'project', 'piece'];

export default function ProductsPage() {
  const { showToast } = useApp();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unitPrice: '',
    unit: 'hour',
    taxRate: '0',
    category: '',
    isActive: true,
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && product.isActive) ||
      (statusFilter === 'inactive' && !product.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeProducts = products.filter(p => p.isActive);
  const totalProducts = products.length;
  const avgPrice = products.length > 0 
    ? products.reduce((sum, p) => sum + p.unitPrice, 0) / products.length 
    : 0;

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        unitPrice: product.unitPrice.toString(),
        unit: product.unit,
        taxRate: product.taxRate.toString(),
        category: product.category || '',
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        unitPrice: '',
        unit: 'hour',
        taxRate: '0',
        category: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (!formData.name.trim() || !formData.unitPrice) return;

    const now = new Date().toISOString().split('T')[0];

    if (editingProduct) {
      setProducts(prev => prev.map(p =>
        p.id === editingProduct.id
          ? { 
              ...p, 
              name: formData.name.trim(),
              description: formData.description.trim() || undefined,
              unitPrice: parseFloat(formData.unitPrice),
              unit: formData.unit,
              taxRate: parseFloat(formData.taxRate),
              category: formData.category || undefined,
              isActive: formData.isActive,
              updatedAt: now 
            }
          : p
      ));
      showToast({ title: 'Product updated', type: 'success' });
    } else {
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        unitPrice: parseFloat(formData.unitPrice),
        unit: formData.unit,
        taxRate: parseFloat(formData.taxRate),
        category: formData.category || undefined,
        isActive: formData.isActive,
        createdAt: now,
        updatedAt: now,
      };
      setProducts(prev => [...prev, newProduct]);
      showToast({ title: 'Product created', type: 'success' });
    }
    setDialogOpen(false);
  };

  const handleToggleActive = (id: string) => {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString().split('T')[0] } : p
    ));
    const product = products.find(p => p.id === id);
    showToast({ 
      title: product?.isActive ? 'Product deactivated' : 'Product activated', 
      type: 'success' 
    });
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast({ title: 'Product deleted', type: 'success' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div>
          <h1 className="text-2xl font-semibold">Products & Services</h1>
          <p className="text-sm text-muted-foreground">
            Manage products and services for invoicing
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="size-4" />
          Add Product
        </Button>
      </header>

      {/* Stats */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{totalProducts}</p>
                <p className="text-sm text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="size-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{activeProducts.length}</p>
                <p className="text-sm text-muted-foreground">Active Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <DollarSign className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{formatCurrency(avgPrice)}</p>
                <p className="text-sm text-muted-foreground">Avg. Price</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'table')} className="ml-auto">
          <TabsList>
            <TabsTrigger value="table" className="gap-1">
              <List className="size-4" />
            </TabsTrigger>
            <TabsTrigger value="grid" className="gap-1">
              <LayoutGrid className="size-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'table' ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Tax Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map(product => (
                  <TableRow key={product.id} className={cn(!product.isActive && 'opacity-60')}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{product.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category && (
                        <Badge variant="outline" className="text-xs">{product.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="capitalize">{product.unit}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(product.unitPrice)}</TableCell>
                    <TableCell className="text-right">{product.taxRate}%</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          'text-xs gap-1',
                          product.isActive 
                            ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300' 
                            : 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400'
                        )}
                      >
                        {product.isActive ? <CheckCircle2 className="size-3" /> : <XCircle className="size-3" />}
                        {product.isActive ? 'Active' : 'Inactive'}
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
                          <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                            <Pencil className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(product.id)}>
                            <Archive className="size-4 mr-2" />
                            {product.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-destructive">
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className={cn('group hover:shadow-md transition-shadow', !product.isActive && 'opacity-60')}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Package className="size-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{product.name}</CardTitle>
                        {product.category && (
                          <Badge variant="outline" className="text-[10px] mt-1">{product.category}</Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(product)}>
                          <Pencil className="size-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(product.id)}>
                          <Archive className="size-4 mr-2" />
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-destructive">
                          <Trash2 className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {product.description && (
                    <p className="text-muted-foreground text-xs line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-2xl font-semibold">{formatCurrency(product.unitPrice)}</span>
                    <span className="text-muted-foreground capitalize">/{product.unit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        'text-[10px] gap-1',
                        product.isActive 
                          ? 'bg-green-100 text-green-700 border-green-300' 
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      )}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {product.taxRate > 0 && (
                      <span className="text-xs text-muted-foreground">{product.taxRate}% tax</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product details' : 'Add a new product or service for invoicing'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                placeholder="e.g., Software Development"
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Product description..."
                value={formData.description}
                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="product-price">Unit Price *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData(p => ({ ...p, unitPrice: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData(p => ({ ...p, unit: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit} className="capitalize">{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="product-tax">Tax Rate (%)</Label>
                <Input
                  id="product-tax"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  value={formData.taxRate}
                  onChange={(e) => setFormData(p => ({ ...p, taxRate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="product-active">Active</Label>
                <p className="text-xs text-muted-foreground">Product is available for invoicing</p>
              </div>
              <Switch
                id="product-active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(p => ({ ...p, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveProduct}
              disabled={!formData.name.trim() || !formData.unitPrice}
            >
              {editingProduct ? 'Update' : 'Create'} Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
