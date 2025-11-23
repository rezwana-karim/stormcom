'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, Clock, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  amount: number;
  interval: 'month' | 'year';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  features: string[];
}

const mockSubscriptions: Subscription[] = [
  {
    id: 'sub1',
    planId: 'plan_pro',
    planName: 'Pro Plan',
    status: 'active',
    amount: 49.99,
    interval: 'month',
    currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    features: [
      'Unlimited products',
      'Advanced analytics',
      'Priority support',
      'Custom domain',
      'API access',
    ],
  },
  {
    id: 'sub2',
    planId: 'plan_starter',
    planName: 'Starter Plan',
    status: 'trialing',
    amount: 19.99,
    interval: 'month',
    currentPeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
    trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    features: [
      'Up to 100 products',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    id: 'sub3',
    planId: 'plan_business',
    planName: 'Business Plan',
    status: 'canceled',
    amount: 99.99,
    interval: 'month',
    currentPeriodStart: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    currentPeriodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: true,
    features: [
      'Unlimited everything',
      'White-label solution',
      'Dedicated support',
      'Custom integrations',
    ],
  },
];

export function SubscriptionsList() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [canceling, setCanceling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/subscriptions');
        if (!response.ok) throw new Error('Failed to fetch subscriptions');

        const result = await response.json();
        setSubscriptions(result.data || result.subscriptions || []);
      } catch {
        // Use mock data on error
        setSubscriptions(mockSubscriptions);
        console.log('Using mock subscriptions data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription? You will retain access until the end of the current billing period.')) {
      return;
    }

    setCanceling(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) throw new Error('Failed to cancel');

      toast({
        title: 'Subscription canceled',
        description: 'Your subscription will end at the current period.',
      });

      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId
            ? { ...sub, status: 'canceled', cancelAtPeriodEnd: true }
            : sub
        )
      );
    } catch {
      toast({
        title: 'Cancellation failed',
        description: 'Unable to cancel subscription. Please try again.',
      });
    } finally {
      setCanceling(false);
    }
  };

  const getStatusBadge = (status: Subscription['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'trialing':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Trial</Badge>;
      case 'canceled':
        return <Badge variant="outline">Canceled</Badge>;
      case 'past_due':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Past Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilRenewal = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return <div className="text-center py-8">Loading subscriptions...</div>;
  }

  return (
    <>
      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active subscriptions</h3>
            <p className="text-muted-foreground text-center mb-6">
              Subscribe to a plan to unlock premium features
            </p>
            <Button>Browse Plans</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{sub.planName}</CardTitle>
                  {getStatusBadge(sub.status)}
                </div>
                <CardDescription>
                  ${sub.amount} / {sub.interval}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {sub.status === 'trialing' && sub.trialEnd ? (
                      <span>Trial ends {formatDate(sub.trialEnd)}</span>
                    ) : (
                      <span>
                        {sub.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {formatDate(sub.currentPeriodEnd)}
                      </span>
                    )}
                  </div>
                  {!sub.cancelAtPeriodEnd && sub.status !== 'canceled' && (
                    <div className="text-xs text-muted-foreground">
                      {getDaysUntilRenewal(sub.currentPeriodEnd)} days remaining
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Features included:</div>
                  <ul className="space-y-1">
                    {sub.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedSub(sub)}
                >
                  View Details
                </Button>
                {sub.status === 'active' && !sub.cancelAtPeriodEnd && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleCancel(sub.id)}
                    disabled={canceling}
                  >
                    {canceling ? 'Canceling...' : 'Cancel'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedSub} onOpenChange={() => setSelectedSub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSub?.planName} Details</DialogTitle>
            <DialogDescription>Subscription information and billing details</DialogDescription>
          </DialogHeader>
          {selectedSub && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1">{getStatusBadge(selectedSub.status)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div className="mt-1 font-semibold">
                    ${selectedSub.amount} / {selectedSub.interval}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current Period Start</div>
                  <div className="mt-1">{formatDate(selectedSub.currentPeriodStart)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Current Period End</div>
                  <div className="mt-1">{formatDate(selectedSub.currentPeriodEnd)}</div>
                </div>
              </div>

              {selectedSub.cancelAtPeriodEnd && (
                <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  This subscription is canceled and will end on {formatDate(selectedSub.currentPeriodEnd)}
                </div>
              )}

              <div>
                <div className="text-sm font-medium mb-2">Included Features</div>
                <ul className="space-y-2">
                  {selectedSub.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
