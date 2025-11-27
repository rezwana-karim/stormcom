'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
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
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StoreSelector } from '@/components/store-selector';
import { InventoryHistoryDialog } from './inventory-history-dialog';
import { BulkImportDialog } from './bulk-import-dialog';
import { LowStockWidget } from './low-stock-widget';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Plus,
  Minus,
  Settings,
  History,
  Upload,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MoreHorizontal,
  Store
} from 'lucide-react';
import { toast } from 'sonner';

// Inventory adjustment reason codes matching the service enum
const ADJUSTMENT_REASONS = [
  { value: 'restock', label: 'Restock' },
  { value: 'manual_adjustment', label: 'Manual Adjustment' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
  { value: 'return_processed', label: 'Return Processed' },
  { value: 'inventory_count', label: 'Inventory Count' },
  { value: 'stock_transfer', label: 'Stock Transfer' },
  { value: 'expired', label: 'Expired' },
  { value: 'theft', label: 'Theft' },
] as const;

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

export function InventoryPageClient() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  
  // State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [meta, setMeta] = useState<InventoryMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('lowStockOnly') === 'true');
  const [page, setPage] = useState(1);
  const [selectedStore, setSelectedStore] = useState('');
  
  // Dialogs
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  
  // Adjustment form
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE' | 'SET'>('ADD');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');

  // Fetch inventory when dependencies change
  const fetchInventory = useCallback(async () => {
    if (!selectedStore) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        storeId: selectedStore,
        page: page.toString(),
        perPage: '20',
      });

      if (search) params.append('search', search);
      if (lowStockOnly) params.append('lowStockOnly', 'true');

      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.data || []);
        setMeta(data.meta);
      } else {
        toast.error(data.error || 'Failed to fetch inventory');
      }
    } catch {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, [selectedStore, page, search, lowStockOnly]);

  useEffect(() => {
    if (session?.user && selectedStore) {
      fetchInventory();
    }
  }, [session, fetchInventory, selectedStore]);

  // Debounce search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (selectedStore) {
        setPage(1);
        fetchInventory();
      }
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleStoreChange = (storeId: string) => {
    setSelectedStore(storeId);
    setPage(1);
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
          storeId: selectedStore,
          productId: selectedItem.id,
          quantity: parseInt(quantity),
          type: adjustmentType,
          reason,
          note: note || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Stock adjusted successfully');
        setAdjustDialogOpen(false);
        resetAdjustmentForm();
        fetchInventory();
      } else {
        toast.error(data.error || data.details || 'Failed to adjust stock');
      }
    } catch {
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

  const openHistoryDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setHistoryDialogOpen(true);
  };

  const openAdjustDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustDialogOpen(true);
  };

  const getStatusBadge = (status: InventoryItem['inventoryStatus']) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
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
      case 'DISCONTINUED':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            Discontinued
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const lowStockCount = items.filter(i => i.inventoryStatus === 'LOW_STOCK').length;
  const outOfStockCount = items.filter(i => i.inventoryStatus === 'OUT_OF_STOCK').length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track and manage your product stock levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StoreSelector onStoreChange={handleStoreChange} />
          <Button variant="outline" size="icon" onClick={fetchInventory} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
        </div>
      </div>

      {/* Two-column layout for main content and sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row">
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
              onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Low Stock Only
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{meta?.total || 0}</span>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card className={lowStockCount > 0 ? 'border-yellow-300 bg-yellow-50/50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Low Stock Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-yellow-600">{lowStockCount}</span>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card className={outOfStockCount > 0 ? 'border-red-300 bg-red-50/50' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Out of Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-red-600">{outOfStockCount}</span>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Threshold</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                      Loading inventory...
                    </TableCell>
                  </TableRow>
                ) : !selectedStore ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Store className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Select a store to view inventory</p>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No inventory items found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[200px] truncate" title={item.name}>
                        {item.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {item.categoryName || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {item.inventoryQty}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground hidden sm:table-cell">
                        {item.lowStockThreshold}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.inventoryStatus)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openAdjustDialog(item)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openHistoryDialog(item)}>
                              <History className="mr-2 h-4 w-4" />
                              View History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages} ({meta.total} items)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Low Stock Widget */}
        <div className="space-y-6">
          {selectedStore && (
            <LowStockWidget storeId={selectedStore} maxItems={5} />
          )}
        </div>
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Adjust Stock
            </DialogTitle>
            <DialogDescription>
              {selectedItem && `${selectedItem.name} (${selectedItem.sku})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedItem && (
              <div className="rounded-lg border bg-muted p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Stock:</span>
                  <span className="font-semibold text-lg">{selectedItem.inventoryQty}</span>
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
                      <Plus className="mr-2 h-4 w-4 text-green-600" />
                      Add Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="REMOVE">
                    <div className="flex items-center">
                      <Minus className="mr-2 h-4 w-4 text-red-600" />
                      Remove Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="SET">
                    <div className="flex items-center">
                      <Settings className="mr-2 h-4 w-4 text-blue-600" />
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
              {selectedItem && quantity && adjustmentType !== 'SET' && (
                <p className="text-sm text-muted-foreground">
                  New stock: {adjustmentType === 'ADD' 
                    ? selectedItem.inventoryQty + parseInt(quantity || '0')
                    : Math.max(0, selectedItem.inventoryQty - parseInt(quantity || '0'))}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
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
            <Button onClick={handleAdjustStock} disabled={!quantity || !reason}>
              Confirm Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      {selectedItem && (
        <InventoryHistoryDialog
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          storeId={selectedStore}
          productId={selectedItem.id}
          productName={selectedItem.name}
          productSku={selectedItem.sku}
        />
      )}

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        storeId={selectedStore}
        onComplete={fetchInventory}
      />
    </div>
  );
}
