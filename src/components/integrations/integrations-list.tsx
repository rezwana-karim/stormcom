/**
 * Integrations List Component
 * 
 * Main component for third-party integrations management.
 * 
 * @module components/integrations/integrations-list
 */

'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, CheckCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ConnectIntegrationDialog } from './connect-integration-dialog';

interface Integration {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  credentials?: Record<string, string>;
  settings?: Record<string, unknown>;
  lastSync?: string;
}

const mockIntegrations: Integration[] = [
  {
    id: 'int1',
    type: 'stripe',
    name: 'Stripe',
    description: 'Accept payments with Stripe',
    icon: '💳',
    connected: true,
    lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'int2',
    type: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing and automation',
    icon: '📧',
    connected: true,
    lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'int3',
    type: 'paypal',
    name: 'PayPal',
    description: 'Accept PayPal payments',
    icon: '🅿️',
    connected: false,
  },
  {
    id: 'int4',
    type: 'google_analytics',
    name: 'Google Analytics',
    description: 'Track website analytics',
    icon: '📊',
    connected: false,
  },
  {
    id: 'int5',
    type: 'facebook_pixel',
    name: 'Facebook Pixel',
    description: 'Track conversions and remarketing',
    icon: '📘',
    connected: false,
  },
  {
    id: 'int6',
    type: 'shippo',
    name: 'Shippo',
    description: 'Shipping label generation',
    icon: '📦',
    connected: false,
  },
];

export function IntegrationsList() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingIntegration, setConnectingIntegration] = useState<Integration | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations');
      if (!response.ok) throw new Error('Failed to fetch integrations');

      const result = await response.json();
      setIntegrations(result.data || result.integrations || []);
    } catch {
      // Use mock data on error
      setIntegrations(mockIntegrations);
      console.log('Using mock integrations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to disconnect integration');

      toast.success('Integration disconnected');
      fetchIntegrations();
    } catch (error) {
      toast.error('Failed to disconnect integration');
      console.error('Disconnect integration error:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading integrations...</div>;
  }

  const connectedIntegrations = integrations.filter((i) => i.connected);
  const availableIntegrations = integrations.filter((i) => !i.connected);

  return (
    <div className="space-y-8">
      {connectedIntegrations.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Connected Integrations</h2>
            <p className="text-sm text-muted-foreground">
              Currently active integrations for your store
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectedIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">{integration.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <Badge variant="default" className="mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDisconnect(integration.id)}
                          className="text-destructive"
                        >
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>
                  {integration.lastSync && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last synced: {new Date(integration.lastSync).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Available Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Connect to these services to enhance your store
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableIntegrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{integration.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      Not Connected
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {integration.description}
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => setConnectingIntegration(integration)}
                >
                  Connect
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {connectingIntegration && (
        <ConnectIntegrationDialog
          integration={connectingIntegration}
          onClose={() => setConnectingIntegration(null)}
          onSuccess={fetchIntegrations}
        />
      )}
    </div>
  );
}
