"use client";

// src/components/orders-table.tsx
// Comprehensive production-ready orders table with TanStack Table, filtering, sorting, and pagination

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Package,
  Eye,
  RefreshCw,
  Download,
  FileText,
  XCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { OrderFilters } from '@/components/orders/order-filters';
import { OrdersTableSkeleton } from '@/components/orders/orders-table-skeleton';
import { CancelOrderDialog } from '@/components/orders/cancel-order-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

// Order type based on API response
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  customerId: string | null;
  customerEmail: string;
  customerName: string;
  createdAt: string;
  updatedAt: string;
  items?: Array<{ id: string }>;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

interface OrdersTableProps {
  storeId: string;
}

// Status badge colors
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  PAYMENT_FAILED: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  PAID: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  PROCESSING: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
  SHIPPED: 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20',
  DELIVERED: 'bg-green-600/10 text-green-600 hover:bg-green-600/20',
  CANCELED: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
  REFUNDED: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20',
  AUTHORIZED: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  PAID: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  FAILED: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  REFUNDED: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
  DISPUTED: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export function OrdersTable({ storeId }: OrdersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(searchParams.get('paymentStatus') || 'all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
  );
  
  // Cancel dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [canceling, setCanceling] = useState(false);

  // Fetch orders
  const fetchOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const params = new URLSearchParams({
        storeId,
        page: searchParams.get('page') || '1',
        perPage: '20',
      });

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      if (statusFilter && statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      if (paymentStatusFilter && paymentStatusFilter !== 'all') {
        params.set('paymentStatus', paymentStatusFilter);
      }

      if (dateFrom) {
        params.set('dateFrom', dateFrom.toISOString());
      }

      if (dateTo) {
        params.set('dateTo', dateTo.toISOString());
      }

      const response = await fetch(`/api/orders?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data: OrdersResponse = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!silent) {
        toast.error('Failed to load orders');
      }
    } finally {
      if (!silent) setLoading(false);
      setIsInitialLoad(false);
    }
  }, [storeId, searchQuery, statusFilter, paymentStatusFilter, dateFrom, dateTo]);
  
  // Get current page from URL
  const currentPage = searchParams.get('page') || '1';

  // Polling for real-time updates
  useEffect(() => {
    if (!storeId) return;

    const intervalId = setInterval(() => {
      fetchOrders(true); // Silent refresh
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [storeId, fetchOrders]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (storeId) {
      fetchOrders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, currentPage, searchQuery, statusFilter, paymentStatusFilter, dateFrom, dateTo]);

  // Update URL with filters
  const updateFilters = useCallback((filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    router.replace(`/dashboard/orders?${params.toString()}`);
  }, [router, searchParams]);

  // Handle filter changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    updateFilters({ search: value, page: '1' });
  }, [updateFilters]);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    updateFilters({ status: value, page: '1' });
  }, [updateFilters]);

  const handlePaymentStatusChange = useCallback((value: string) => {
    setPaymentStatusFilter(value);
    updateFilters({ paymentStatus: value, page: '1' });
  }, [updateFilters]);

  const handleDateRangeChange = useCallback((from?: Date, to?: Date) => {
    setDateFrom(from);
    setDateTo(to);
    updateFilters({
      dateFrom: from ? from.toISOString() : '',
      dateTo: to ? to.toISOString() : '',
      page: '1',
    });
  }, [updateFilters]);

  // Handle cancel order
  const handleCancelOrder = async (reason?: string) => {
    if (!orderToCancel) return;

    try {
      setCanceling(true);
      const response = await fetch(`/api/orders/${orderToCancel.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          reason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel order');
      }

      toast.success('Order canceled successfully');
      await fetchOrders();
    } catch (error) {
      console.error('Error canceling order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
      throw error;
    } finally {
      setCanceling(false);
    }
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    try {
      const headers = ['Order Number', 'Customer', 'Email', 'Status', 'Payment Status', 'Total', 'Items', 'Date'];
      const rows = orders.map(order => [
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.status,
        order.paymentStatus,
        order.totalAmount.toString(),
        order.items?.length.toString() || '0',
        format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Orders exported successfully');
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error('Failed to export orders');
    }
  };

  // TanStack Table columns definition
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: 'orderNumber',
        accessorKey: 'orderNumber',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              Order Number
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.original.orderNumber}</div>
        ),
      },
      {
        id: 'customer',
        accessorKey: 'customerName',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              Customer
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.customerName}</div>
            <div className="text-sm text-muted-foreground">{row.original.customerEmail}</div>
          </div>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Order Status',
        cell: ({ row }) => (
          <Badge variant="secondary" className={statusColors[row.original.status] || ''}>
            {row.original.status.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        id: 'paymentStatus',
        accessorKey: 'paymentStatus',
        header: 'Payment',
        cell: ({ row }) => (
          <Badge variant="outline" className={paymentStatusColors[row.original.paymentStatus] || ''}>
            {row.original.paymentStatus}
          </Badge>
        ),
      },
      {
        id: 'items',
        header: 'Items',
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.items?.length || 0}
          </div>
        ),
      },
      {
        id: 'totalAmount',
        accessorKey: 'totalAmount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              Total
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium">{formatCurrency(row.original.totalAmount)}</div>
        ),
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="-ml-4"
            >
              Date
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="text-sm">{format(new Date(row.original.createdAt), 'MMM dd, yyyy')}</div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const order = row.original;
          const canCancel = ['PENDING', 'PROCESSING'].includes(order.status);

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/orders/${order.id}`} className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/api/orders/${order.id}/invoice?storeId=${storeId}`} target="_blank" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    View Invoice
                  </Link>
                </DropdownMenuItem>
                {canCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        setOrderToCancel(order);
                        setCancelDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [storeId]
  );

  // TanStack Table instance
  const table = useReactTable({
    data: orders,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  if (isInitialLoad && loading) {
    return <OrdersTableSkeleton />;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header Actions */}
        <div className="flex items-center justify-end gap-2">
          {loading && !isInitialLoad && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => fetchOrders()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={orders.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <OrderFilters
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onPaymentStatusChange={handlePaymentStatusChange}
          onDateRangeChange={handleDateRangeChange}
          searchValue={searchQuery}
          statusValue={statusFilter}
          paymentStatusValue={paymentStatusFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>{pagination.total} total orders</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || statusFilter !== 'all' || paymentStatusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Orders will appear here once customers place them'}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {(pagination.page - 1) * pagination.perPage + 1} to{' '}
                      {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} orders
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => updateFilters({ page: String(pagination.page - 1) })}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => updateFilters({ page: String(pagination.page + 1) })}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel Order Dialog */}
      {orderToCancel && (
        <CancelOrderDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          onCancel={handleCancelOrder}
          orderNumber={orderToCancel.orderNumber}
          loading={canceling}
        />
      )}
    </>
  );
}
