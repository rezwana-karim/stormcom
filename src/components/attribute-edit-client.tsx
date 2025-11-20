// src/components/attribute-edit-client.tsx
'use client';

import * as React from 'react';
import { AttributeForm } from '@/components/attribute-form';
import { StoreSelector } from '@/components/store-selector';
import { toast } from 'sonner';

interface AttributeEditClientProps {
  id: string;
}

export function AttributeEditClient({ id }: AttributeEditClientProps) {
  const [storeId, setStoreId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{ name: string; values: string[] } | null>(null);

  React.useEffect(() => {
    if (!storeId) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/attributes/${id}`, { cache: 'no-store' });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.error || `Failed to load attribute (${res.status})`);
        }
        const j = await res.json();
        if (!active) return;
        setData({ name: j.data.name, values: j.data.values });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load attribute';
        setError(msg);
        toast.error(msg);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, storeId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Store:</label>
        <StoreSelector onStoreChange={setStoreId} />
      </div>

      {!storeId ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a store to edit the attribute
          </p>
        </div>
      ) : loading ? (
        <p className="text-muted-foreground">Loading attribute...</p>
      ) : error || !data ? (
        <p className="text-red-600">{error ?? 'Attribute not found'}</p>
      ) : (
        <AttributeForm
          attributeId={id}
          initialData={data}
          storeId={storeId}
        />
      )}
    </div>
  );
}
