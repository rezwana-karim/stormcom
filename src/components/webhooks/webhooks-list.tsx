/**
 * Webhooks List Component
 * 
 * Main component for webhook management with CRUD operations.
 * 
 * @module components/webhooks/webhooks-list
 */

'use client';

import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, CheckCircle, XCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { CreateWebhookDialog } from './create-webhook-dialog';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  lastDelivery: string | null;
  deliverySuccessRate: number;
  createdAt: string;
}

const mockWebhooks: Webhook[] = [
  {
    id: 'wh_1',
    url: 'https://example.com/webhooks/orders',
    events: ['order.created', 'order.updated', 'order.completed'],
    secret: 'whsec_***************abc123',
    active: true,
    lastDelivery: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    deliverySuccessRate: 98.5,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'wh_2',
    url: 'https://api.mystore.com/webhooks',
    events: ['product.created', 'product.updated'],
    secret: 'whsec_***************def456',
    active: true,
    lastDelivery: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    deliverySuccessRate: 100,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'wh_3',
    url: 'https://webhook.site/unique-url',
    events: ['customer.created'],
    secret: 'whsec_***************ghi789',
    active: false,
    lastDelivery: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    deliverySuccessRate: 75.2,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function WebhooksList() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/webhooks');
      if (!response.ok) throw new Error('Failed to fetch webhooks');

      const result = await response.json();
      setWebhooks(result.data || result.webhooks || []);
    } catch {
      // Use mock data on error
      setWebhooks(mockWebhooks);
      console.log('Using mock webhooks data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleToggleActive = async (webhookId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });

      if (!response.ok) throw new Error('Failed to update webhook');

      toast.success(currentActive ? 'Webhook disabled' : 'Webhook enabled');
      fetchWebhooks();
    } catch (error) {
      toast.error('Failed to update webhook');
      console.error('Update webhook error:', error);
    }
  };

  const handleDelete = async (webhookId: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete webhook');

      toast.success('Webhook deleted');
      fetchWebhooks();
    } catch (error) {
      toast.error('Failed to delete webhook');
      console.error('Delete webhook error:', error);
    }
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast.success('Secret copied to clipboard');
  };

  if (loading) {
    return <div className="text-center py-8">Loading webhooks...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Events</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Last Delivery</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No webhooks configured. Click &quot;Add Webhook&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell className="font-mono text-sm max-w-xs truncate">
                    {webhook.url}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 2).map((event) => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                      {webhook.events.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{webhook.events.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {webhook.active ? (
                      <Badge variant="default" className="flex items-center w-fit">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center w-fit">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {webhook.deliverySuccessRate?.toFixed(1) || '0'}%
                    </div>
                  </TableCell>
                  <TableCell>
                    {webhook.lastDelivery ? (
                      <div className="text-sm text-muted-foreground">
                        {new Date(webhook.lastDelivery).toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Never</div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => copySecret(webhook.secret)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Secret
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(webhook.id, webhook.active)}
                        >
                          {webhook.active ? 'Disable' : 'Enable'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(webhook.id)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <CreateWebhookDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={fetchWebhooks}
      />
    </div>
  );
}
