/**
 * Customers List Component
 * 
 * Main component for customer management with DataTable, 
 * search, filters, and CRUD operations.
 * 
 * @module components/customers/customers-list
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Download, MoreHorizontal, Mail, Phone } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { CustomerDialog } from './customer-dialog';
import { CustomerDetailDialog } from './customer-detail-dialog';
import { DeleteCustomerDialog } from './delete-customer-dialog';
import { StoreSelector } from '@/components/store-selector';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
  lastOrderAt?: string;
  status: 'active' | 'inactive';
}

interface ListResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeId, setStoreId] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        storeId,
        page: pagination.page.toString(),
        perPage: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/customers?${params}`);
      if (!response.ok) throw new Error('Failed to fetch customers');

      const result: ListResponse = await response.json();
      setCustomers(result.data || []);
      setPagination((prev) => ({
        ...prev,
        total: result.meta?.total || 0,
        totalPages: result.meta?.totalPages || 0,
      }));
    } catch (error) {
      toast.error('Failed to load customers');
      console.error('Customers fetch error:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, searchQuery, storeId]);

  const refreshCustomers = () => {
    fetchCustomers();
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/customers/export');
      if (!response.ok) throw new Error('Failed to export customers');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Customers exported successfully');
    } catch (error) {
      toast.error('Failed to export customers');
      console.error('Export error:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Store Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Store:</span>
          <StoreSelector onStoreChange={setStoreId} />
        </div>
      </Card>

      {!storeId ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            Select a store to view customers
          </div>
        </Card>
      ) : (
        <>
          {/* Header Actions */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </div>
            </div>
          </Card>

      {/* Customers Table */}
      <Card>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No customers found</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      {customer.lastOrderAt && (
                        <p className="text-xs text-muted-foreground">
                          Last order: {formatDate(customer.lastOrderAt)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {customer.email}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{customer.totalOrders}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(customer.joinedAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setViewingCustomer(customer)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingCustomer(customer)}>
                          Edit Customer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeletingCustomer(customer)}
                          className="text-destructive"
                        >
                          Delete Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Pagination */}
      {storeId && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} customers
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Dialogs */}
      <CustomerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={refreshCustomers}
        storeId={storeId}
      />

      {editingCustomer && (
        <CustomerDialog
          open={!!editingCustomer}
          onOpenChange={(open: boolean) => !open && setEditingCustomer(null)}
          customer={editingCustomer}
          onSuccess={refreshCustomers}
          storeId={storeId}
        />
      )}

      {viewingCustomer && (
        <CustomerDetailDialog
          customer={viewingCustomer}
          open={!!viewingCustomer}
          onOpenChange={(open: boolean) => !open && setViewingCustomer(null)}
        />
      )}

      {deletingCustomer && (
        <DeleteCustomerDialog
          customer={deletingCustomer}
          open={!!deletingCustomer}
          onOpenChange={(open: boolean) => !open && setDeletingCustomer(null)}
          onSuccess={refreshCustomers}
        />
      )}
    </div>
  );
}
