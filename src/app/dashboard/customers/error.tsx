'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Customers page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconAlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Failed to load customers</CardTitle>
          </div>
          <CardDescription>
            There was an error loading the customers list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error.message && (
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={reset} className="flex-1">
                <IconRefresh className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
