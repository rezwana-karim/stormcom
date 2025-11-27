"use client";

// src/components/products-table.tsx
// Client component for displaying and managing products with selection support

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Trash2,
  Package,
  MoreHorizontal,
  Eye,
  Archive,
  CheckCircle,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  inventoryQty: number;
  inventoryStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  thumbnailUrl?: string | null;
  images?: string[];
  category?: { name: string; slug: string };
  brand?: { name: string; slug: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface SelectedProducts {
  [productId: string]: boolean;
}

interface ProductsTableProps {
  storeId: string;
  search?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  inventoryStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  selectedProducts?: SelectedProducts;
  onSelectionChange?: (selection: SelectedProducts) => void;
  isPending?: boolean;
}

// Items per page options
const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function ProductsTable({
  storeId,
  search,
  status,
  inventoryStatus,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  selectedProducts = {},
  onSelectionChange,
  isPending = false,
}: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Calculate if all visible products are selected
  const allSelected = useMemo(() => {
    if (products.length === 0) return false;
    return products.every((product) => selectedProducts[product.id]);
  }, [products, selectedProducts]);

  // Calculate if some (but not all) products are selected
  const someSelected = useMemo(() => {
    if (products.length === 0) return false;
    const selectedCount = products.filter((p) => selectedProducts[p.id]).length;
    return selectedCount > 0 && selectedCount < products.length;
  }, [products, selectedProducts]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        storeId,
        page: page.toString(),
        perPage: perPage.toString(),
        sortBy,
        sortOrder,
      });

      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (inventoryStatus) params.append('inventoryStatus', inventoryStatus);

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      setProducts(data.products || []);
      setTotalProducts(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [storeId, page, perPage, search, status, inventoryStatus, sortBy, sortOrder]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, status, inventoryStatus, sortBy, sortOrder]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
  }, [storeId, fetchProducts]);

  // Handle select all toggle
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;

    const newSelection = { ...selectedProducts };
    const shouldSelect = !allSelected;

    products.forEach((product) => {
      newSelection[product.id] = shouldSelect;
    });

    onSelectionChange(newSelection);
  }, [products, selectedProducts, allSelected, onSelectionChange]);

  // Handle individual selection
  const handleSelectProduct = useCallback(
    (productId: string, checked: boolean) => {
      if (!onSelectionChange) return;
      onSelectionChange({
        ...selectedProducts,
        [productId]: checked,
      });
    },
    [selectedProducts, onSelectionChange]
  );

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/products/${productToDelete.id}?storeId=${storeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete product');
      }

      toast.success('Product deleted', {
        description: `${productToDelete.name} has been deleted successfully.`,
      });

      await fetchProducts();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err) {
      toast.error('Delete failed', {
        description: err instanceof Error ? err.message : 'Failed to delete product',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Quick status change
  const handleStatusChange = async (product: Product, newStatus: 'ACTIVE' | 'ARCHIVED') => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Product ${newStatus === 'ACTIVE' ? 'published' : 'archived'}`);
      await fetchProducts();
    } catch {
      toast.error('Failed to update product status');
    }
  };

  // Get product image URL
  const getProductImage = (product: Product): string | null => {
    if (product.thumbnailUrl) return product.thumbnailUrl;
    if (product.images && product.images.length > 0) return product.images[0];
    return null;
  };

  // Get status badge variant
  const getStatusBadgeVariant = (productStatus: Product['status']) => {
    switch (productStatus) {
      case 'ACTIVE':
        return 'default';
      case 'DRAFT':
        return 'secondary';
      case 'ARCHIVED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Get inventory badge variant
  const getInventoryBadgeVariant = (invStatus: Product['inventoryStatus']) => {
    switch (invStatus) {
      case 'IN_STOCK':
        return 'default';
      case 'LOW_STOCK':
        return 'secondary';
      case 'OUT_OF_STOCK':
      case 'DISCONTINUED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Loading skeleton
  if (loading && !isPending) {
    return (
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-10 w-10 rounded-md" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="ml-auto h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchProducts}>
          Retry
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center p-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
          {search || status || inventoryStatus
            ? 'No products found'
            : 'No products yet'}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {search || status || inventoryStatus
            ? 'Try adjusting your filters to find what you\'re looking for.'
            : 'Get started by creating your first product.'}
        </p>
        {!search && !status && !inventoryStatus && (
          <Link href="/dashboard/products/new">
            <Button className="mt-6">Create Product</Button>
          </Link>
        )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border bg-card shadow-sm ${isPending ? 'opacity-60' : ''}`}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {onSelectionChange && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all products"
                      className={someSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                    />
                  </TableHead>
                )}
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden sm:table-cell">SKU</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const imageUrl = getProductImage(product);
                const isSelected = selectedProducts[product.id] || false;

                return (
                  <TableRow
                    key={product.id}
                    className={isSelected ? 'bg-muted/50' : ''}
                  >
                    {onSelectionChange && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectProduct(product.id, checked as boolean)
                          }
                          aria-label={`Select ${product.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted ring-1 ring-border">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="font-semibold hover:underline line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          {product.category && (
                            <span className="text-xs font-medium text-muted-foreground">
                              {product.category.name}
                            </span>
                          )}
                          {product.brand && (
                            <>
                              {product.category && <span className="text-xs text-muted-foreground">•</span>}
                              <span className="text-xs font-medium text-muted-foreground">
                                {product.brand.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-sm sm:table-cell">
                      {product.sku}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${product.price.toFixed(2)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium">{product.inventoryQty}</span>
                        <Badge variant={getInventoryBadgeVariant(product.inventoryStatus)}>
                          {product.inventoryStatus.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(product.status)}>
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/products/${product.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View / Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {product.status !== 'ACTIVE' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(product, 'ACTIVE')}
                            >
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Publish
                            </DropdownMenuItem>
                          )}
                          {product.status !== 'ARCHIVED' && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(product, 'ARCHIVED')}
                            >
                              <Archive className="mr-2 h-4 w-4 text-yellow-600" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(product)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * perPage + 1}–
            {Math.min(page * perPage, totalProducts)} of {totalProducts} products
          </span>
          <span className="hidden sm:inline">•</span>
          <div className="hidden items-center gap-2 sm:flex">
            <span>Per page:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-md border bg-background px-2 text-sm"
              aria-label="Items per page"
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Previous</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || loading}
          >
            <span className="sr-only sm:not-sr-only sm:mr-1">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{productToDelete?.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
