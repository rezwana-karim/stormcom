'use client';

// src/components/inventory/inventory-history-dialog.tsx
// Dialog to view inventory adjustment history for a product

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Minus, 
  Equal, 
  ChevronLeft, 
  ChevronRight,
  History,
  User,
  Calendar,
  FileText,
  Package
} from 'lucide-react';
import { format } from 'date-fns';

const REASON_FILTERS = [
  { value: 'all', label: 'All Reasons' },
  { value: 'order_created', label: 'Order Created' },
  { value: 'order_cancelled', label: 'Order Cancelled' },
  { value: 'return_processed', label: 'Return Processed' },
  { value: 'manual_adjustment', label: 'Manual Adjustment' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
  { value: 'restock', label: 'Restock' },
  { value: 'inventory_count', label: 'Inventory Count' },
  { value: 'stock_transfer', label: 'Stock Transfer' },
  { value: 'expired', label: 'Expired' },
  { value: 'theft', label: 'Theft' },
] as const;

interface HistoryEntry {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  previousQty: number;
  newQty: number;
  changeQty: number;
  reason: string;
  reasonLabel: string;
  note?: string;
  userId?: string;
  userName?: string;
  orderId?: string;
  createdAt: string;
}

interface HistoryMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface InventoryHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  productId: string;
  productName: string;
  productSku: string;
}

export function InventoryHistoryDialog({
  open,
  onOpenChange,
  storeId,
  productId,
  productName,
  productSku,
}: InventoryHistoryDialogProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [meta, setMeta] = useState<HistoryMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [reasonFilter, setReasonFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (open && productId && storeId) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productId, storeId, page, reasonFilter]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        storeId,
        productId,
        page: page.toString(),
        perPage: '10',
      });

      if (reasonFilter !== 'all') {
        params.append('reason', reasonFilter);
      }

      const response = await fetch(`/api/inventory/history?${params}`);
      const data = await response.json();

      if (response.ok) {
        setEntries(data.data || []);
        setMeta(data.meta);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (changeQty: number) => {
    if (changeQty > 0) {
      return <Plus className="h-4 w-4 text-green-600" />;
    } else if (changeQty < 0) {
      return <Minus className="h-4 w-4 text-red-600" />;
    }
    return <Equal className="h-4 w-4 text-gray-600" />;
  };

  const getChangeBadge = (changeQty: number) => {
    if (changeQty > 0) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          +{changeQty}
        </Badge>
      );
    } else if (changeQty < 0) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          {changeQty}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        0
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Inventory History
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {productName} ({productSku})
          </DialogDescription>
        </DialogHeader>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filter by reason:</span>
            <Select value={reasonFilter} onValueChange={(v) => { setReasonFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASON_FILTERS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {meta && (
            <span className="text-sm text-muted-foreground ml-auto">
              {meta.total} record{meta.total !== 1 ? 's' : ''} found
            </span>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead>Change</TableHead>
                <TableHead className="text-right">Previous</TableHead>
                <TableHead className="text-right">New</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No history records found
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(entry.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(entry.createdAt), 'HH:mm:ss')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getChangeIcon(entry.changeQty)}
                        {getChangeBadge(entry.changeQty)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {entry.previousQty}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold">
                      {entry.newQty}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.reasonLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      {entry.userName ? (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {entry.userName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.note ? (
                        <div className="flex items-center gap-1 text-sm max-w-[150px] truncate" title={entry.note}>
                          <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          {entry.note}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
