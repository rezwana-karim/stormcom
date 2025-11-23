/**
 * Review Detail Dialog Component
 * 
 * Displays full review details with moderation actions.
 * 
 * @module components/reviews/review-detail-dialog
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, CheckCircle, XCircle } from 'lucide-react';

interface Review {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface ReviewDetailDialogProps {
  review: Review;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export function ReviewDetailDialog({
  review,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ReviewDetailDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-muted text-muted-foreground'
            }`}
          />
        ))}
        <span className="ml-2 text-lg font-semibold">{rating}.0</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">Review Details</DialogTitle>
              <DialogDescription>Review information and moderation</DialogDescription>
            </div>
            {getStatusBadge(review.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Product</h3>
            <p className="text-lg font-medium">{review.productName}</p>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Customer</h3>
            <p className="text-lg">{review.customerName}</p>
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Rating</h3>
            {renderStars(review.rating)}
          </div>

          {/* Comment */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Comment</h3>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm leading-relaxed">{review.comment}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Submitted on {formatDate(review.createdAt)}
            </p>
          </div>
        </div>

        {/* Moderation Actions */}
        {review.status === 'pending' && (
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={onReject}
              className="flex items-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>
            <Button
              onClick={onApprove}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
