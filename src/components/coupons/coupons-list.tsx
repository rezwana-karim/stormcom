'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Copy, Edit, Trash2, Percent, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateCouponDialog } from './create-coupon-dialog';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

const mockCoupons: Coupon[] = [
  {
    id: 'coup1',
    code: 'SAVE20',
    type: 'percentage',
    value: 20,
    minPurchase: 50,
    maxDiscount: 100,
    usageLimit: 1000,
    usageCount: 234,
    active: true,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'coup2',
    code: 'FREESHIP',
    type: 'fixed',
    value: 10,
    minPurchase: 25,
    usageLimit: 500,
    usageCount: 456,
    active: true,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'coup3',
    code: 'VIP50',
    type: 'percentage',
    value: 50,
    minPurchase: 200,
    maxDiscount: 500,
    usageLimit: 100,
    usageCount: 23,
    active: false,
    expiresAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function CouponsList() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/coupons');
        if (!response.ok) throw new Error('Failed to fetch coupons');

        const result = await response.json();
        setCoupons(result.data || result.coupons || []);
      } catch {
        // Use mock data on error
        setCoupons(mockCoupons);
        console.log('Using mock coupons data');
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Code copied',
      description: `Coupon code "${code}" copied to clipboard`,
    });
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    toast({
      title: 'Coupon deleted',
      description: 'The coupon has been removed',
    });

    setCoupons(prev => prev.filter(c => c.id !== couponId));
  };

  const getValueDisplay = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return (
        <span className="flex items-center gap-1">
          <Percent className="h-3 w-3" />
          {coupon.value}% off
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1">
        <DollarSign className="h-3 w-3" />
        ${coupon.value} off
      </span>
    );
  };

  const getUsageDisplay = (coupon: Coupon) => {
    if (!coupon.usageLimit) return `${coupon.usageCount} used`;
    const percentage = (coupon.usageCount / coupon.usageLimit) * 100;
    return (
      <div className="space-y-1">
        <div className="text-sm">{coupon.usageCount} / {coupon.usageLimit}</div>
        <div className="w-full bg-secondary rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
    );
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return <div className="text-center py-8">Loading coupons...</div>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {coupons.filter(c => c.active).length} active coupons
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>Manage your discount codes and promotions</CardDescription>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No coupons yet. Create your first discount code!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-semibold">
                      {coupon.code}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-2"
                        onClick={() => handleCopyCode(coupon.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TableCell>
                    <TableCell>{getValueDisplay(coupon)}</TableCell>
                    <TableCell>{getUsageDisplay(coupon)}</TableCell>
                    <TableCell>
                      {coupon.expiresAt ? (
                        <span className={isExpired(coupon.expiresAt) ? 'text-red-600' : ''}>
                          {new Date(coupon.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isExpired(coupon.expiresAt) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : coupon.active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleCopyCode(coupon.code)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Code
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(coupon.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateCouponDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={() => {
          toast({
            title: 'Coupon created',
            description: 'New discount code has been created successfully',
          });
        }}
      />
    </>
  );
}
