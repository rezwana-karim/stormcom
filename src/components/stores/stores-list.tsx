/**
 * Stores List Component
 * 
 * Data table for stores with search, filters, and CRUD operations.
 * Includes subscription plan management.
 * 
 * @module components/stores/stores-list
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreVertical, Edit, Trash2, Store as StoreIcon, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { StoreFormDialog } from './store-form-dialog';
import { DeleteStoreDialog } from './delete-store-dialog';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';

type SubscriptionPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';

interface Store {
  id: string;
  name: string;
  slug: string;
  email: string;
  domain: string | null;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ListResponse {
  data: Store[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export function StoresList() {
  const { can, isSuperAdmin } = usePermissions();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filters
  const [search, setSearch] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('');

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [deletingStore, setDeletingStore] = useState<Store | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });

        if (search) params.append('search', search);
        if (subscriptionPlan) params.append('subscriptionPlan', subscriptionPlan);
        if (subscriptionStatus) params.append('subscriptionStatus', subscriptionStatus);

        const response = await fetch(`/api/stores?${params}`);
        if (!response.ok) throw new Error('Failed to fetch stores');

        const result: ListResponse = await response.json();
        setStores(result.data);
        // Only update pagination metadata, not page/limit to avoid infinite loop
        setPagination(prev => ({
          ...prev,
          total: result.meta.total,
          totalPages: result.meta.totalPages,
        }));
      } catch {
        toast.error('Failed to load stores');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, [pagination.page, pagination.limit, search, subscriptionPlan, subscriptionStatus]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const refreshStores = () => {
    setPagination(prev => ({ ...prev })); // Trigger re-fetch
  };

  const getPlanBadgeVariant = (plan: SubscriptionPlan) => {
    const variants: Record<SubscriptionPlan, 'default' | 'secondary' | 'outline'> = {
      FREE: 'outline',
      STARTER: 'secondary',
      PRO: 'default',
      ENTERPRISE: 'default',
    };
    return variants[plan] || 'default';
  };

  const getStatusBadgeVariant = (status: SubscriptionStatus) => {
    const variants: Record<SubscriptionStatus, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      TRIALING: 'secondary',
      ACTIVE: 'default',
      PAST_DUE: 'destructive',
      CANCELED: 'outline',
      UNPAID: 'destructive',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Input
            placeholder="Search stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Select
          value={subscriptionPlan || "all"}
          onValueChange={(value) => {
            setSubscriptionPlan(value === "all" ? "" : value);
            handleFilterChange();
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="FREE">Free</SelectItem>
            <SelectItem value="STARTER">Starter</SelectItem>
            <SelectItem value="PRO">Pro</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={subscriptionStatus || "all"}
          onValueChange={(value) => {
            setSubscriptionStatus(value === "all" ? "" : value);
            handleFilterChange();
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="TRIALING">Trialing</SelectItem>
            <SelectItem value="PAST_DUE">Past Due</SelectItem>
            <SelectItem value="CANCELED">Canceled</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
          </SelectContent>
        </Select>

        {/* Only show Create Store button to users with create permission */}
        {(isSuperAdmin || can('stores:create')) && (
          <Button onClick={() => setCreateOpen(true)} className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Store
          </Button>
        )}
      </div>

      {/* Data Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ends At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No stores found. Create your first store to get started.
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <StoreIcon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{store.name}</div>
                        <div className="text-xs text-muted-foreground">/{store.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{store.email}</TableCell>
                  <TableCell className="text-sm">
                    {store.domain ? (
                      <a
                        href={`https://${store.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {store.domain}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(store.subscriptionPlan)}>
                      {store.subscriptionPlan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(store.subscriptionStatus)}>
                      {store.subscriptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {store.subscriptionEndsAt
                      ? new Date(store.subscriptionEndsAt).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/stores/${store.id}/staff`}>
                            <Users className="h-4 w-4 mr-2" />
                            Manage Staff
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/stores/${store.id}/roles`}>
                            <Shield className="h-4 w-4 mr-2" />
                            Manage Roles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Only show edit/delete for users with update/delete permissions */}
                        {(isSuperAdmin || can('stores:update')) && (
                          <DropdownMenuItem onClick={() => setEditingStore(store)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Store
                          </DropdownMenuItem>
                        )}
                        {(isSuperAdmin || can('stores:delete')) && (
                          <DropdownMenuItem
                            onClick={() => setDeletingStore(store)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Store
                          </DropdownMenuItem>
                        )}
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
      {!loading && stores.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            stores
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <StoreFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false);
          refreshStores();
        }}
      />

      {editingStore && (
        <StoreFormDialog
          open={!!editingStore}
          onOpenChange={(open: boolean) => !open && setEditingStore(null)}
          store={editingStore}
          onSuccess={() => {
            setEditingStore(null);
            refreshStores();
          }}
        />
      )}

      {deletingStore && (
        <DeleteStoreDialog
          open={!!deletingStore}
          onOpenChange={(open: boolean) => !open && setDeletingStore(null)}
          store={deletingStore}
          onSuccess={() => {
            setDeletingStore(null);
            refreshStores();
          }}
        />
      )}
    </div>
  );
}
