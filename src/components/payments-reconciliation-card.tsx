"use client";

// src/components/payments-reconciliation-card.tsx
// Reconciliation status card for payments dashboard

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface StuckAttempt {
  id: string;
  storeId: string;
  orderId: string;
  status: string;
  createdAt: string;
  stuckMinutes: number;
}

interface ReconciliationResult {
  checkedAt: string;
  timeoutMinutes: number;
  totalStuck: number;
  stuckAttempts: StuckAttempt[];
}

interface ReconciliationCardProps {
  storeId: string;
}

export function ReconciliationCard({ storeId }: ReconciliationCardProps) {
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // Check reconciliation status
  const checkReconciliation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/reconciliation');
      if (!response.ok) {
        throw new Error('Failed to check reconciliation status');
      }
      const data: ReconciliationResult = await response.json();
      
      // Filter to only show stuck attempts for this store
      const filteredData = {
        ...data,
        stuckAttempts: data.stuckAttempts.filter(a => a.storeId === storeId),
        totalStuck: data.stuckAttempts.filter(a => a.storeId === storeId).length,
      };
      
      setResult(filteredData);
    } catch (error) {
      console.error('Error checking reconciliation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Run reconciliation job
  const runReconciliation = async () => {
    try {
      setRunning(true);
      const response = await fetch('/api/payments/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeoutMinutes: 15 }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to run reconciliation');
      }
      
      const data = await response.json();
      toast.success(data.message || 'Reconciliation completed');
      
      // Refresh status
      checkReconciliation();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to run reconciliation');
    } finally {
      setRunning(false);
    }
  };

  // Check on mount
  useEffect(() => {
    if (storeId) {
      checkReconciliation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const hasIssues = result && result.totalStuck > 0;

  return (
    <Card className={hasIssues ? 'border-orange-500/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasIssues ? (
              <AlertTriangle className="h-5 w-5 text-orange-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            <CardTitle className="text-lg">Reconciliation Status</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkReconciliation}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Check
            </Button>
            <Button
              size="sm"
              onClick={runReconciliation}
              disabled={running}
              variant={hasIssues ? 'default' : 'outline'}
            >
              {running ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                'Run Reconciliation'
              )}
            </Button>
          </div>
        </div>
        <CardDescription>
          Monitors for payment attempts stuck in AUTHORIZING state for &gt;15 minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && !result ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : result ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Last checked:</span>
                <span>{format(new Date(result.checkedAt), 'MMM dd, HH:mm:ss')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Timeout:</span>
                <span>{result.timeoutMinutes} minutes</span>
              </div>
            </div>

            {/* Status */}
            {hasIssues ? (
              <div className="rounded-lg border border-orange-500/50 bg-orange-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-orange-500">
                    {result.totalStuck} stuck payment{result.totalStuck !== 1 ? 's' : ''} detected
                  </span>
                </div>
                <div className="space-y-2">
                  {result.stuckAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between p-2 rounded bg-background"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{attempt.id.slice(0, 12)}...</span>
                      </div>
                      <Badge variant="outline" className="text-orange-500">
                        Stuck for {attempt.stuckMinutes} min
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-green-500/50 bg-green-500/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-green-500">
                    All payment attempts are processing normally
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click &quot;Check&quot; to verify reconciliation status
          </p>
        )}
      </CardContent>
    </Card>
  );
}
