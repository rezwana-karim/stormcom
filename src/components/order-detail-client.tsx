/**
 * Order Detail Client Component
 * 
 * Client-side interactive component for order detail page
 * Handles order data fetching, status updates, and tracking information
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  RefreshCw,
  Edit,
  Check,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Types
interface OrderItem {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Address {
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: Address | string;
  billingAddress: Address | string;
  shippingMethod: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  customerNote: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  customer?: Customer | null;
}

interface OrderDetailClientProps {
  orderId: string;
  storeId: string;
}

// Status badge colors
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500',
  PAYMENT_FAILED: 'bg-red-500/10 text-red-500',
  PAID: 'bg-green-500/10 text-green-500',
  PROCESSING: 'bg-purple-500/10 text-purple-500',
  SHIPPED: 'bg-indigo-500/10 text-indigo-500',
  DELIVERED: 'bg-green-600/10 text-green-600',
  CANCELED: 'bg-gray-500/10 text-gray-500',
  REFUNDED: 'bg-orange-500/10 text-orange-500',
};

const paymentStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500',
  PAID: 'bg-green-500/10 text-green-500',
  FAILED: 'bg-red-500/10 text-red-500',
  REFUNDED: 'bg-orange-500/10 text-orange-500',
  PARTIALLY_REFUNDED: 'bg-orange-500/10 text-orange-500',
};

export function OrderDetailClient({ orderId, storeId }: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isEditingTracking, setIsEditingTracking] = useState(false);

  // Fetch order details
  const fetchOrder = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        storeId,
      });

      const response = await fetch(`/api/orders/${orderId}?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data: Order = await response.json();
      
      // Parse addresses if they come as JSON strings
      if (typeof data.shippingAddress === 'string') {
        data.shippingAddress = JSON.parse(data.shippingAddress);
      }
      if (typeof data.billingAddress === 'string') {
        data.billingAddress = JSON.parse(data.billingAddress);
      }
      
      setOrder(data);
      setNewStatus(data.status);
      setTrackingNumber(data.trackingNumber || '');
      setTrackingUrl(data.trackingUrl || '');
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
      router.push('/dashboard/orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, storeId]);

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!order || newStatus === order.status) return;

    try {
      setUpdating(true);

      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          newStatus,
          ...(trackingNumber && { trackingNumber }),
          ...(trackingUrl && { trackingUrl }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update order');
      }

      const updatedOrder = await response.json();
      
      // Parse addresses if needed
      if (typeof updatedOrder.shippingAddress === 'string') {
        updatedOrder.shippingAddress = JSON.parse(updatedOrder.shippingAddress);
      }
      if (typeof updatedOrder.billingAddress === 'string') {
        updatedOrder.billingAddress = JSON.parse(updatedOrder.billingAddress);
      }
      
      setOrder(updatedOrder);
      toast.success('Order status updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  // Handle tracking update
  const handleTrackingUpdate = async () => {
    if (!order) return;

    try {
      setUpdating(true);

      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          newStatus: order.status,
          trackingNumber,
          trackingUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update tracking information');
      }

      const updatedOrder = await response.json();
      
      // Parse addresses if needed
      if (typeof updatedOrder.shippingAddress === 'string') {
        updatedOrder.shippingAddress = JSON.parse(updatedOrder.shippingAddress);
      }
      if (typeof updatedOrder.billingAddress === 'string') {
        updatedOrder.billingAddress = JSON.parse(updatedOrder.billingAddress);
      }
      
      setOrder(updatedOrder);
      setIsEditingTracking(false);
      toast.success('Tracking information updated successfully');
    } catch (error) {
      console.error('Error updating tracking:', error);
      toast.error('Failed to update tracking information');
    } finally {
      setUpdating(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format address
  const formatAddress = (address: Address | string, fallbackName?: string) => {
    const addr: Address = typeof address === 'string' ? JSON.parse(address) : address;
    
    // Build name from address fields, fallback to provided name, or show nothing
    const firstName = addr.firstName || '';
    const lastName = addr.lastName || '';
    const addressName = [firstName, lastName].filter(Boolean).join(' ') || fallbackName || '';
    
    return (
      <div className="text-sm">
        {addressName && <p className="font-medium">{addressName}</p>}
        <p>{addr.address}</p>
        {addr.address2 && <p>{addr.address2}</p>}
        <p>{`${addr.city}, ${addr.state} ${addr.postalCode}`}</p>
        <p>{addr.country}</p>
        {addr.email && <p className="mt-2 text-muted-foreground">{addr.email}</p>}
        {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Order not found</h3>
        <Button asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Order {order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {format(new Date(order.createdAt), 'MMMM dd, yyyy')} at{' '}
              {format(new Date(order.createdAt), 'hh:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={statusColors[order.status]}>
            {order.status}
          </Badge>
          <Badge variant="secondary" className={paymentStatusColors[order.paymentStatus]}>
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Order Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>{order.items.length} items</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          {item.variantName && (
                            <div className="text-sm text-muted-foreground">
                              {item.variantName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price)}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.subtotal)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(order.shippingAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-600">
                      -{formatCurrency(order.discountAmount)}
                    </span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formatAddress(
                  order.shippingAddress, 
                  order.customer 
                    ? `${order.customer.firstName} ${order.customer.lastName}`.trim() 
                    : undefined
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Billing Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {formatAddress(
                  order.billingAddress,
                  order.customer 
                    ? `${order.customer.firstName} ${order.customer.lastName}`.trim() 
                    : undefined
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Actions & Info */}
        <div className="space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Order Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAYMENT_FAILED">Payment Failed</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELED">Canceled</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === order.status}
                className="w-full"
              >
                {updating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Update Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Tracking Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Tracking
                </CardTitle>
                {!isEditingTracking && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingTracking(true)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Shipping Method</Label>
                <div className="text-sm">{order.shippingMethod}</div>
              </div>

              <div className="space-y-2">
                <Label>Tracking Number</Label>
                {isEditingTracking ? (
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                ) : (
                  <div className="text-sm">
                    {order.trackingNumber || 'Not provided'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tracking URL</Label>
                {isEditingTracking ? (
                  <Input
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="Enter tracking URL"
                  />
                ) : order.trackingUrl ? (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Track Shipment
                  </a>
                ) : (
                  <div className="text-sm">Not provided</div>
                )}
              </div>

              {isEditingTracking && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleTrackingUpdate}
                    disabled={updating}
                    className="flex-1"
                  >
                    {updating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingTracking(false);
                      setTrackingNumber(order.trackingNumber || '');
                      setTrackingUrl(order.trackingUrl || '');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Note */}
          {order.customerNote && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {order.customerNote}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
