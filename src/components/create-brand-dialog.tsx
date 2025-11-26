"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateBrandDialog({ open, onOpenChange, onSuccess }: CreateBrandDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);

  const generateSlug = (v: string) =>
    v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleName = (v: string) => {
    setName(v);
    if (!slug) setSlug(generateSlug(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return toast.error('Name and slug are required');
    setLoading(true);
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, websiteUrl: website || null }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to create brand');
      }

      toast.success('Brand created');
      setName('');
      setSlug('');
      setWebsite('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message || 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Brand</DialogTitle>
            <DialogDescription>Add a new brand quickly</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="brand-name">Name</Label>
              <Input id="brand-name" value={name} onChange={(e) => handleName(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="brand-slug">Slug</Label>
              <Input id="brand-slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
            </div>

            <div>
              <Label htmlFor="brand-website">Website</Label>
              <Input id="brand-website" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
