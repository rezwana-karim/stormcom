"use client";

// src/components/payments-table.tsx
// Payments table with filtering and pagination

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  CreditCard,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  Loader2,
} from 'lucide-react';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// PaymentAttempt type based on API response
interface PaymentTransaction {
  id: string;
  type: 'AUTH' | 'CAPTURE' | 'REFUND' | 'VOID';
  amount: number;
  currency: string;
  providerReference: string | null;
  createdAt: string;
}

interface PaymentAttempt {
  id: string;
  storeId: string;
  orderId: string;
  provider: string;
  providerReference: string | null;
  status: 'INITIATED' | 'AUTHORIZING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'CANCELED';
  amount: number;
  currency: string;
  idempotencyKey: string | null;
  attemptCount: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  nextRetryAt: string | null;
  createdAt: string;
  updatedAt: string;
  transactions: PaymentTransaction[];
}

interface PaymentsResponse {
  attempts: PaymentAttempt[];
  total: number;
}

interface PaymentsTableProps {
  storeId: string;
}

// Status badge configurations
const statusConfig: Record<string, { icon: React.ReactNode; className: string; label: string }> = {
  INITIATED: {
    icon: <Clock className="h-3 w-3" />,
    className: 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20',
    label: 'Initiated',
  },
  AUTHORIZING: {
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
    className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
    label: 'Authorizing',
  },
  AUTHORIZED: {
    icon: <CheckCircle className="h-3 w-3" />,
    className: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
    label: 'Authorized',
  },
  CAPTURED: {
    icon: <CheckCircle className="h-3 w-3" />,
    className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
    label: 'Captured',
  },
  FAILED: {
    icon: <XCircle className="h-3 w-3" />,
    className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
    label: 'Failed',
  },
  CANCELED: {
    icon: <Ban className="h-3 w-3" />,
    className: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
    label: 'Canceled',
  },
};

// Transaction type badge colors
const transactionTypeColors: Record<string, string> = {
  AUTH: 'bg-blue-500/10 text-blue-500',
  CAPTURE: 'bg-green-500/10 text-green-500',
  REFUND: 'bg-orange-500/10 text-orange-500',
  VOID: 'bg-gray-500/10 text-gray-500',
};

export function PaymentsTable({ storeId }: PaymentsTableProps) {
  const [attempts, setAttempts] = useState<PaymentAttempt[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAttempt, setSelectedAttempt] = useState<PaymentAttempt | null>(null);

  // Format currency
  const formatCurrency = (amount: number, currency: string) => {
    // Convert from minor units (cents/paisa)
    const value = amount / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value);
  };

  // Fetch all payment attempts for the store in a single request
  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      // Fetch all payment attempts for the store
      const response = await fetch(`/api/payments?storeId=${storeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payment attempts');
      }
      const data: PaymentsResponse = await response.json();
      let allAttempts = data.attempts;

      // Filter based on status
      let filteredAttempts = allAttempts;
      if (statusFilter !== 'all') {
        filteredAttempts = allAttempts.filter(a => a.status === statusFilter);
      }

      // Filter based on search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredAttempts = filteredAttempts.filter(a =>
          a.id.toLowerCase().includes(query) ||
          a.orderId.toLowerCase().includes(query) ||
          a.provider.toLowerCase().includes(query) ||
          a.providerReference?.toLowerCase().includes(query) ||
          a.idempotencyKey?.toLowerCase().includes(query)
        );
      }

      // Sort by createdAt descending
      filteredAttempts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setAttempts(filteredAttempts);
      setTotal(filteredAttempts.length);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment attempts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    if (storeId) {
      fetchPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, statusFilter]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  // Handle capture
  const handleCapture = async (attempt: PaymentAttempt) => {
    try {
      const response = await fetch('/api/payments/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          storeId: attempt.storeId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to capture payment');
      }

      toast.success('Payment captured successfully');
      fetchPayments();
      setSelectedAttempt(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to capture payment');
    }
  };

  // Handle refund
  const handleRefund = async (attempt: PaymentAttempt, amount: number) => {
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          storeId: attempt.storeId,
          amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to refund payment');
      }

      toast.success('Refund processed successfully');
      fetchPayments();
      setSelectedAttempt(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process refund');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={fetchPayments}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, order, provider..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </form>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="INITIATED">Initiated</SelectItem>
                <SelectItem value="AUTHORIZING">Authorizing</SelectItem>
                <SelectItem value="AUTHORIZED">Authorized</SelectItem>
                <SelectItem value="CAPTURED">Captured</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELED">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Attempts</CardTitle>
              <CardDescription>
                {total} total payment attempts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payment attempts found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Payment attempts will appear here when customers make purchases'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt) => {
                    const config = statusConfig[attempt.status];
                    return (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-mono text-xs">
                          {attempt.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {attempt.provider}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`flex items-center gap-1 w-fit ${config?.className || ''}`}
                          >
                            {config?.icon}
                            {config?.label || attempt.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(attempt.amount, attempt.currency)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {attempt.transactions.map((tx) => (
                              <Badge
                                key={tx.id}
                                variant="outline"
                                className={`text-xs ${transactionTypeColors[tx.type] || ''}`}
                              >
                                {tx.type}
                              </Badge>
                            ))}
                            {attempt.transactions.length === 0 && (
                              <span className="text-xs text-muted-foreground">None</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(attempt.createdAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedAttempt(attempt)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={!!selectedAttempt} onOpenChange={() => setSelectedAttempt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Attempt Details</DialogTitle>
            <DialogDescription>
              View and manage payment attempt information
            </DialogDescription>
          </DialogHeader>
          
          {selectedAttempt && (
            <div className="space-y-6">
              {/* Status & Amount */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant="secondary"
                    className={`flex items-center gap-1 w-fit mt-1 ${statusConfig[selectedAttempt.status]?.className || ''}`}
                  >
                    {statusConfig[selectedAttempt.status]?.icon}
                    {statusConfig[selectedAttempt.status]?.label || selectedAttempt.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(selectedAttempt.amount, selectedAttempt.currency)}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Attempt ID</p>
                  <p className="font-mono">{selectedAttempt.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedAttempt.orderId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Provider</p>
                  <p className="capitalize">{selectedAttempt.provider}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Provider Reference</p>
                  <p className="font-mono">{selectedAttempt.providerReference || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Attempt Count</p>
                  <p>{selectedAttempt.attemptCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Idempotency Key</p>
                  <p className="font-mono text-xs">{selectedAttempt.idempotencyKey || 'N/A'}</p>
                </div>
                {selectedAttempt.lastErrorCode && (
                  <>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Last Error</p>
                      <div className="flex items-center gap-2 text-red-500">
                        <AlertCircle className="h-4 w-4" />
                        <span>{selectedAttempt.lastErrorCode}: {selectedAttempt.lastErrorMessage}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Transactions */}
              {selectedAttempt.transactions.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Transactions</p>
                  <div className="space-y-2">
                    {selectedAttempt.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="outline"
                            className={transactionTypeColors[tx.type] || ''}
                          >
                            {tx.type}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">
                            {tx.providerReference || tx.id}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(tx.amount, tx.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.createdAt), 'MMM dd, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                {selectedAttempt.status === 'AUTHORIZED' && (
                  <Button onClick={() => handleCapture(selectedAttempt)}>
                    Capture Payment
                  </Button>
                )}
                {selectedAttempt.status === 'CAPTURED' && (
                  <Button
                    variant="outline"
                    onClick={() => handleRefund(selectedAttempt, selectedAttempt.amount)}
                  >
                    Full Refund
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
