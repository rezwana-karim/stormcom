"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IconPlus, IconFileImport } from '@tabler/icons-react';
import { CreateCategoryDialog } from './create-category-dialog';
import { CreateBrandDialog } from './create-brand-dialog';
import { BulkImportDialog } from './product/bulk-import-dialog';

export function ProductsHeaderActions({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const [catOpen, setCatOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  const refresh = () => {
    try { router.refresh(); } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard/categories">
        <Button variant="outline" size="sm">Categories</Button>
      </Link>

      <Button variant="outline" size="sm" onClick={() => setCatOpen(true)}>New Category</Button>
      <CreateCategoryDialog open={catOpen} onOpenChange={setCatOpen} onSuccess={refresh} />

      <Link href="/dashboard/brands">
        <Button variant="outline" size="sm">Brands</Button>
      </Link>

      <Button variant="outline" size="sm" onClick={() => setBrandOpen(true)}>New Brand</Button>
      <CreateBrandDialog open={brandOpen} onOpenChange={setBrandOpen} onSuccess={refresh} />

      {storeId && (
        <BulkImportDialog 
          storeId={storeId} 
          onSuccess={refresh}
          trigger={
            <Button variant="outline" size="sm" className="gap-2">
              <IconFileImport className="size-4" />
              Import CSV
            </Button>
          }
        />
      )}

      <Link href="/dashboard/products/new">
        <Button className="gap-2">
          <IconPlus className="size-4" />
          Add Product
        </Button>
      </Link>
    </div>
  );
}
