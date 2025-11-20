// src/components/attributes-table.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconTrash,
  IconEdit,
  IconPlus,
  IconSearch,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface Attribute {
  id: string;
  name: string;
  values: string[];
  _count?: {
    productValues: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AttributesTableProps {
  storeId: string;
}

export function AttributesTable({ storeId }: AttributesTableProps) {
  const router = useRouter();
  const [attributes, setAttributes] = React.useState<Attribute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const fetchAttributes = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        storeId,
        ...(search && { search }),
        perPage: '50',
      });

      const response = await fetch(`/api/attributes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attributes');
      }

      const data = await response.json();
      setAttributes(data.data || []);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      toast.error('Failed to load attributes');
    } finally {
      setLoading(false);
    }
  }, [storeId, search]);

  React.useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/attributes/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete attribute');
      }

      toast.success('Attribute deleted successfully');
      setDeleteId(null);
      fetchAttributes();
    } catch (error) {
      console.error('Error deleting attribute:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete attribute'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search attributes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[300px] pl-9"
            />
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/attributes/new">
            <IconPlus className="mr-2 h-4 w-4" />
            New Attribute
          </Link>
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-muted-foreground">Loading attributes...</div>
        </div>
      ) : attributes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">No attributes found.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create your first attribute to get started.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/attributes/new">
              <IconPlus className="mr-2 h-4 w-4" />
              Create Attribute
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Values</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.map((attribute) => (
                <TableRow key={attribute.id}>
                  <TableCell className="font-medium">{attribute.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {attribute.values.slice(0, 5).map((value, index) => (
                        <Badge key={index} variant="secondary">
                          {value}
                        </Badge>
                      ))}
                      {attribute.values.length > 5 && (
                        <Badge variant="outline">
                          +{attribute.values.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {attribute._count?.productValues || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/attributes/${attribute.id}`)
                        }
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(attribute.id)}
                        disabled={
                          (attribute._count?.productValues || 0) > 0
                        }
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attribute?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              attribute.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
