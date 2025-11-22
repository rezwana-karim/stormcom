'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Plus,
  Minus,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  inventoryQty: number;
  lowStockThreshold: number;
  inventoryStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  categoryName?: string;
  brandName?: string;
  updatedAt: string;
}

interface InventoryMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [meta, setMeta] = useState<InventoryMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (session?.user) {
      fetchInventory();
    }
  }, [session, search, lowStockOnly, selectedStore]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        storeId: selectedStore || 'demo-store-id', // TODO: Get from session
        page: '1',
        perPage: '20',
      });

      if (search) params.append('search', search);
      if (lowStockOnly) params.append('lowStockOnly', 'true');

      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.data);
        setMeta(data.meta);
      } else {
        toast.error(data.error || 'Failed to fetch inventory');
      }
    } catch (error) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem || !quantity || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStore || 'demo-store-id',
          productId: selectedItem.id,
          quantity: parseInt(quantity),
          type: adjustmentType,
          reason,
          note,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Stock adjusted successfully');
        setAdjustDialogOpen(false);
        resetAdjustmentForm();
        fetchInventory();
      } else {
        toast.error(data.error || 'Failed to adjust stock');
      }
    } catch (error) {
      toast.error('Failed to adjust stock');
    }
  };

  const resetAdjustmentForm = () => {
    setSelectedItem(null);
    setAdjustmentType('ADD');
    setQuantity('');
    setReason('');
    setNote('');
  };

  const getStatusBadge = (status: InventoryItem['inventoryStatus']) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            In Stock
          </Badge>
        );
      case 'LOW_STOCK':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-yellow-500 text-white border-yellow-600">
            <AlertTriangle className="h-3 w-3" />
            Low Stock
          </Badge>
        );
      case 'OUT_OF_STOCK':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Out of Stock
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track and manage your product stock levels
          </p>
        </div>
        <Button variant="outline" onClick={fetchInventory}>
          <Package className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant={lowStockOnly ? 'default' : 'outline'}
          onClick={() => setLowStockOnly(!lowStockOnly)}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Low Stock Only
        </Button>
      </div>

      {/* Stats Cards */}
      {meta && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Products
                </p>
                <p className="text-2xl font-bold">{meta.total}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Low Stock Items
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {items.filter(i => i.inventoryStatus === 'LOW_STOCK').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold text-destructive">
                  {items.filter(i => i.inventoryStatus === 'OUT_OF_STOCK').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading inventory...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell>{item.categoryName || '-'}</TableCell>
                  <TableCell>{item.brandName || '-'}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.inventoryQty}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.lowStockThreshold}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.inventoryStatus)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedItem(item);
                        setAdjustDialogOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              {selectedItem && `Adjust stock for ${selectedItem.name} (${selectedItem.sku})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedItem && (
              <div className="rounded-lg border bg-muted p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-semibold">{selectedItem.inventoryQty}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as 'ADD' | 'REMOVE' | 'SET')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADD">
                    <div className="flex items-center">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="REMOVE">
                    <div className="flex items-center">
                      <Minus className="mr-2 h-4 w-4" />
                      Remove Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="SET">
                    <div className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Set Exact Quantity
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Restock">Restock</SelectItem>
                  <SelectItem value="Damaged">Damaged</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                  <SelectItem value="Correction">Inventory Correction</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAdjustDialogOpen(false);
                resetAdjustmentForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdjustStock}>
              Confirm Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
