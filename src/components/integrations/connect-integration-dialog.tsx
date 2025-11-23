/**
 * Connect Integration Dialog Component
 * 
 * Dialog for connecting to a third-party integration.
 * 
 * @module components/integrations/connect-integration-dialog
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Integration {
  id: string;
  type: string;
  name: string;
  description: string;
}

interface ConnectIntegrationDialogProps {
  integration: Integration;
  onClose: () => void;
  onSuccess: () => void;
}

const CREDENTIAL_FIELDS: Record<string, { label: string; type: string; placeholder: string }[]> = {
  stripe: [
    { label: 'Secret Key', type: 'password', placeholder: 'sk_live_...' },
    { label: 'Publishable Key', type: 'text', placeholder: 'pk_live_...' },
  ],
  paypal: [
    { label: 'Client ID', type: 'text', placeholder: 'Your PayPal Client ID' },
    { label: 'Client Secret', type: 'password', placeholder: 'Your PayPal Client Secret' },
  ],
  mailchimp: [
    { label: 'API Key', type: 'password', placeholder: 'Your Mailchimp API Key' },
  ],
  google_analytics: [
    { label: 'Tracking ID', type: 'text', placeholder: 'UA-XXXXXXXXX-X or G-XXXXXXXXXX' },
  ],
  facebook_pixel: [
    { label: 'Pixel ID', type: 'text', placeholder: 'Your Facebook Pixel ID' },
  ],
  shippo: [
    { label: 'API Token', type: 'password', placeholder: 'shippo_live_...' },
  ],
};

export function ConnectIntegrationDialog({
  integration,
  onClose,
  onSuccess,
}: ConnectIntegrationDialogProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fields = CREDENTIAL_FIELDS[integration.type] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: integration.type,
          credentials,
        }),
      });

      if (!response.ok) throw new Error('Failed to connect integration');

      toast.success(`${integration.name} connected successfully`);
      onClose();
      onSuccess();
    } catch (error) {
      toast.error('Failed to connect integration');
      console.error('Connect integration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect {integration.name}</DialogTitle>
            <DialogDescription>{integration.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {fields.map((field) => (
              <div key={field.label} className="space-y-2">
                <Label htmlFor={field.label}>{field.label}</Label>
                <Input
                  id={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={credentials[field.label] || ''}
                  onChange={(e) =>
                    setCredentials({ ...credentials, [field.label]: e.target.value })
                  }
                  required
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
