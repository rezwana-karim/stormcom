"use client";

// src/components/products-page-client.tsx
// Client wrapper for products page with search, filters, and bulk actions

import { useState, useCallback, useTransition, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { StoreSelector } from '@/components/store-selector';
import { ProductsTable, type SelectedProducts } from '@/components/products-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Search,
  ChevronDown,
  Trash2,
  Archive,
  CheckCircle,
  X,
  Loader2,
  Filter,
  Upload,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { BulkImportDialog } from './product/bulk-import-dialog';
import { ProductExportDialog } from './product/product-export-dialog';

type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';

interface Filters {
  search: string;
  status: ProductStatus | '';
  inventoryStatus: InventoryStatus | '';
  sortBy: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

export function ProductsPageClient() {
  const [storeId, setStoreId] = useState<string>('');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    inventoryStatus: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProducts>({});
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'delete' | 'publish' | 'archive' | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Calculate selected count
  const selectedCount = useMemo(() => {
    return Object.values(selectedProducts).filter(Boolean).length;
  }, [selectedProducts]);

  // Get selected product IDs
  const selectedProductIds = useMemo(() => {
    return Object.entries(selectedProducts)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => id);
  }, [selectedProducts]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string) => {
      startTransition(() => {
        setFilters((prev) => ({ ...prev, [key]: value }));
      });
    },
    []
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    startTransition(() => {
      setFilters({
        search: '',
        status: '',
        inventoryStatus: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== '' ||
      filters.inventoryStatus !== '' ||
      filters.sortBy !== 'createdAt' ||
      filters.sortOrder !== 'desc'
    );
  }, [filters]);

  // Handle selection changes from table
  const handleSelectionChange = useCallback((newSelection: SelectedProducts) => {
    setSelectedProducts(newSelection);
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedProducts({});
  }, []);

  // Open bulk action confirmation
  const openBulkAction = (type: 'delete' | 'publish' | 'archive') => {
    setBulkActionType(type);
    setBulkActionOpen(true);
  };

  // Execute bulk action
  const executeBulkAction = async () => {
    if (!bulkActionType || selectedProductIds.length === 0) return;

    setIsProcessingBulk(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      for (const productId of selectedProductIds) {
        try {
          if (bulkActionType === 'delete') {
            const response = await fetch(
              `/api/products/${productId}?storeId=${storeId}`,
              { method: 'DELETE' }
            );
            if (!response.ok) throw new Error('Delete failed');
          } else {
            const newStatus = bulkActionType === 'publish' ? 'ACTIVE' : 'ARCHIVED';
            const response = await fetch(`/api/products/${productId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ storeId, status: newStatus }),
            });
            if (!response.ok) throw new Error('Update failed');
          }
          successCount++;
        } catch {
          errors.push(productId);
        }
      }

      if (successCount > 0) {
        const actionText =
          bulkActionType === 'delete'
            ? 'deleted'
            : bulkActionType === 'publish'
              ? 'published'
              : 'archived';
        toast.success(`${successCount} product${successCount > 1 ? 's' : ''} ${actionText}`);
        // Refresh the table
        setRefreshKey((prev) => prev + 1);
        clearSelection();
      }

      if (errors.length > 0) {
        toast.error(`Failed to process ${errors.length} product${errors.length > 1 ? 's' : ''}`);
      }
    } finally {
      setIsProcessingBulk(false);
      setBulkActionOpen(false);
      setBulkActionType(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header with store selector and actions */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <label htmlFor="store-selector" className="text-sm font-semibold shrink-0">
            Store:
          </label>
          <StoreSelector onStoreChange={setStoreId} />
        </div>
        {storeId && (
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard/products/new">
              <Button size="default" className="shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-8" />
            <BulkImportDialog 
              storeId={storeId}
              onSuccess={() => setRefreshKey((prev) => prev + 1)}
              trigger={
                <Button variant="outline" size="default">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              }
            />
            <ProductExportDialog
              storeId={storeId}
              trigger={
                <Button variant="outline" size="default">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              }
            />
          </div>
        )}
      </div>

      {storeId ? (
        <>
          {/* Search and Filters */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6">
                {/* Search and filter toggle */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search products by name, SKU, or description..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-9"
                    />
                    {filters.search && (
                      <button
                        type="button"
                        onClick={() => handleFilterChange('search', '')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant={showFilters ? 'secondary' : 'outline'}
                    onClick={() => setShowFilters(!showFilters)}
                    className="shrink-0"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2">
                        Active
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Expandable filters */}
                {showFilters && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={filters.status}
                        onValueChange={(value) => handleFilterChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All statuses</SelectItem>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Inventory</label>
                      <Select
                        value={filters.inventoryStatus}
                        onValueChange={(value) =>
                          handleFilterChange('inventoryStatus', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All inventory" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All inventory</SelectItem>
                          <SelectItem value="IN_STOCK">In Stock</SelectItem>
                          <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                          <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                          <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sort By</label>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) =>
                          handleFilterChange('sortBy', value as Filters['sortBy'])
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="createdAt">Date Created</SelectItem>
                          <SelectItem value="updatedAt">Last Updated</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="price">Price</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Order</label>
                      <Select
                        value={filters.sortOrder}
                        onValueChange={(value) =>
                          handleFilterChange('sortOrder', value as 'asc' | 'desc')
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">Descending</SelectItem>
                          <SelectItem value="asc">Ascending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  </>
                )}

                {/* Active filters summary */}
                {hasActiveFilters && (
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-muted-foreground">Active filters:</span>
                    <div className="flex flex-wrap gap-2">
                      {filters.search && (
                        <Badge variant="secondary" className="gap-1">
                          Search: {filters.search}
                          <button
                            type="button"
                            onClick={() => handleFilterChange('search', '')}
                            className="ml-1 hover:text-foreground"
                            aria-label="Remove search filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.status && (
                        <Badge variant="secondary" className="gap-1">
                          Status: {filters.status}
                          <button
                            type="button"
                            onClick={() => handleFilterChange('status', '')}
                            className="ml-1 hover:text-foreground"
                            aria-label="Remove status filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.inventoryStatus && (
                        <Badge variant="secondary" className="gap-1">
                          Inventory: {filters.inventoryStatus.replace(/_/g, ' ')}
                          <button
                            type="button"
                            onClick={() => handleFilterChange('inventoryStatus', '')}
                            className="ml-1 hover:text-foreground"
                            aria-label="Remove inventory filter"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-muted-foreground"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bulk actions bar */}
          {selectedCount > 0 && (
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border bg-muted/90 px-6 py-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {selectedCount} selected
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isProcessingBulk}>
                    {isProcessingBulk ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Bulk Actions
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openBulkAction('publish')}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Publish Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openBulkAction('archive')}>
                    <Archive className="mr-2 h-4 w-4 text-yellow-600" />
                    Archive Selected
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => openBulkAction('delete')}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Products table */}
          <ProductsTable
            key={refreshKey}
            storeId={storeId}
            search={debouncedSearch}
            status={filters.status || undefined}
            inventoryStatus={filters.inventoryStatus || undefined}
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder}
            selectedProducts={selectedProducts}
            onSelectionChange={handleSelectionChange}
            isPending={isPending}
          />

          {/* Bulk action confirmation dialog */}
          <AlertDialog open={bulkActionOpen} onOpenChange={setBulkActionOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {bulkActionType === 'delete'
                    ? 'Delete Products'
                    : bulkActionType === 'publish'
                      ? 'Publish Products'
                      : 'Archive Products'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {bulkActionType === 'delete' ? (
                    <>
                      Are you sure you want to delete {selectedCount} product
                      {selectedCount > 1 ? 's' : ''}? This action cannot be undone.
                    </>
                  ) : bulkActionType === 'publish' ? (
                    <>
                      This will publish {selectedCount} product
                      {selectedCount > 1 ? 's' : ''} and make them visible to
                      customers.
                    </>
                  ) : (
                    <>
                      This will archive {selectedCount} product
                      {selectedCount > 1 ? 's' : ''} and hide them from customers.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessingBulk}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={executeBulkAction}
                  disabled={isProcessingBulk}
                  className={
                    bulkActionType === 'delete'
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      : ''
                  }
                >
                  {isProcessingBulk ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : bulkActionType === 'delete' ? (
                    'Delete'
                  ) : bulkActionType === 'publish' ? (
                    'Publish'
                  ) : (
                    'Archive'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Select a Store</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Choose a store from the selector above to view and manage products
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
