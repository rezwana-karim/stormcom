// src/components/attribute-edit-client.tsx
'use client';

import * as React from 'react';
import { AttributeForm } from '@/components/attribute-form';
import { toast } from 'sonner';

interface AttributeEditClientProps {
  id: string;
  storeId: string;
}

export function AttributeEditClient({ id, storeId }: AttributeEditClientProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{ name: string; values: string[] } | null>(null);

  React.useEffect(() => {
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
  }, [id]);

  if (loading) {
    return <p className="text-muted-foreground">Loading attribute...</p>;
  }
  if (error || !data) {
    return <p className="text-red-600">{error ?? 'Attribute not found'}</p>;
  }

  return (
    <AttributeForm
      attributeId={id}
      initialData={data}
      storeId={storeId}
    />
  );
}
