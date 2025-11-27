"use client";

// src/components/product/product-export-dialog.tsx
// Export products to CSV

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProductExportDialogProps {
  storeId: string;
  trigger?: React.ReactNode;
}

export function ProductExportDialog({ storeId, trigger }: ProductExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [includeVariants, setIncludeVariants] = useState(true);
  const [includeImages, setIncludeImages] = useState(false);

  const handleExport = async () => {
    if (!storeId) return;

    setExporting(true);

    try {
      // Fetch all products
      const response = await fetch(
        `/api/products?storeId=${storeId}&perPage=1000`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      const products = data.products || [];

      if (products.length === 0) {
        toast.error('No products to export');
        return;
      }

      // Convert to CSV
      const headers = [
        'ID',
        'Name',
        'SKU',
        'Price',
        'Compare At Price',
        'Cost Price',
        'Stock',
        'Status',
        'Description',
        'Category',
        'Brand',
        'Slug',
      ];

      if (includeImages) {
        headers.push('Images');
      }

      const rows = products.map((product: any) => {
        const row = [
          product.id,
          `"${(product.name || '').replace(/"/g, '""')}"`,
          product.sku || '',
          product.price || 0,
          product.compareAtPrice || '',
          product.costPrice || '',
          product.inventoryQty || 0,
          product.status || 'DRAFT',
          `"${(product.description || '').replace(/"/g, '""')}"`,
          product.category?.name || '',
          product.brand?.name || '',
          product.slug || '',
        ];

        if (includeImages) {
          const images = Array.isArray(product.images)
            ? product.images.join(';')
            : product.images || '';
          row.push(`"${images}"`);
        }

        return row.join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${products.length} product${products.length > 1 ? 's' : ''}`);
      setOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Products
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Products</DialogTitle>
          <DialogDescription>
            Download your products as a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="variants"
              checked={includeVariants}
              onCheckedChange={(checked) => setIncludeVariants(checked as boolean)}
            />
            <Label htmlFor="variants" className="cursor-pointer">
              Include variant information
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="images"
              checked={includeImages}
              onCheckedChange={(checked) => setIncludeImages(checked as boolean)}
            />
            <Label htmlFor="images" className="cursor-pointer">
              Include image URLs
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
