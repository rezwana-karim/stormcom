"use client";

// src/components/product/variant-manager.tsx
// Variant management component for products
// Supports add/remove up to 100 variants with inline editing and validation

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';

// Maximum number of variants per product
const MAX_VARIANTS = 100;

export interface ProductVariant {
  id?: string;
  name: string;
  sku: string;
  price: number | null;
  stock: number;
}

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  disabled?: boolean;
}

interface VariantErrors {
  name?: string;
  sku?: string;
  price?: string;
  stock?: string;
}

export function VariantManager({
  variants,
  onChange,
  disabled = false,
}: VariantManagerProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedVariant, setEditedVariant] = useState<ProductVariant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<number | null>(null);
  const [errors, setErrors] = useState<VariantErrors>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newVariant, setNewVariant] = useState<ProductVariant>({
    name: '',
    sku: '',
    price: null,
    stock: 0,
  });
  const [newVariantErrors, setNewVariantErrors] = useState<VariantErrors>({});

  // Validate a variant
  const validateVariant = useCallback(
    (variant: ProductVariant, currentIndex?: number): VariantErrors => {
      const errs: VariantErrors = {};

      if (!variant.name.trim()) {
        errs.name = 'Variant name is required';
      } else if (variant.name.length > 255) {
        errs.name = 'Name must be less than 255 characters';
      }

      if (!variant.sku.trim()) {
        errs.sku = 'SKU is required';
      } else if (variant.sku.length > 100) {
        errs.sku = 'SKU must be less than 100 characters';
      } else {
        // Check for duplicate SKU
        const duplicateIndex = variants.findIndex(
          (v, i) => v.sku.toLowerCase() === variant.sku.toLowerCase() && i !== currentIndex
        );
        if (duplicateIndex !== -1) {
          errs.sku = 'SKU must be unique';
        }
      }

      if (variant.price !== null && variant.price < 0) {
        errs.price = 'Price must be non-negative';
      }

      if (variant.stock < 0) {
        errs.stock = 'Stock must be non-negative';
      } else if (!Number.isInteger(variant.stock)) {
        errs.stock = 'Stock must be a whole number';
      }

      return errs;
    },
    [variants]
  );

  // Handle adding a new variant
  const handleAddVariant = useCallback(() => {
    const validationErrors = validateVariant(newVariant);
    
    if (Object.keys(validationErrors).length > 0) {
      setNewVariantErrors(validationErrors);
      return;
    }

    if (variants.length >= MAX_VARIANTS) {
      setNewVariantErrors({ name: `Maximum ${MAX_VARIANTS} variants allowed` });
      return;
    }

    onChange([...variants, { ...newVariant }]);
    setNewVariant({ name: '', sku: '', price: null, stock: 0 });
    setNewVariantErrors({});
    setIsAdding(false);
  }, [newVariant, variants, onChange, validateVariant]);

  // Handle editing a variant
  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setEditedVariant({ ...variants[index] });
    setErrors({});
  };

  // Handle saving edited variant
  const handleEditSave = () => {
    if (editingIndex === null || !editedVariant) return;

    const validationErrors = validateVariant(editedVariant, editingIndex);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const updatedVariants = [...variants];
    updatedVariants[editingIndex] = editedVariant;
    onChange(updatedVariants);
    setEditingIndex(null);
    setEditedVariant(null);
    setErrors({});
  };

  // Handle canceling edit
  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditedVariant(null);
    setErrors({});
  };

  // Handle delete confirmation
  const handleDeleteClick = (index: number) => {
    setVariantToDelete(index);
    setDeleteDialogOpen(true);
  };

  // Handle confirmed deletion
  const handleDeleteConfirm = () => {
    if (variantToDelete !== null) {
      const updatedVariants = variants.filter((_, i) => i !== variantToDelete);
      onChange(updatedVariants);
    }
    setDeleteDialogOpen(false);
    setVariantToDelete(null);
  };

  // Render error message
  const renderError = (error?: string) => {
    if (!error) return null;
    return (
      <span className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold">
            Variants ({variants.length}/{MAX_VARIANTS})
          </CardTitle>
          <CardDescription className="mt-1.5">
            Manage product variants with different options like size, color, or material
          </CardDescription>
        </div>
        {!disabled && !isAdding && variants.length < MAX_VARIANTS && (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Variant
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new variant form */}
        {isAdding && (
          <div className="rounded-lg border-2 border-dashed border-primary/20 bg-muted/30 p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="new-variant-name">Name *</Label>
                <Input
                  id="new-variant-name"
                  value={newVariant.name}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, name: e.target.value })
                  }
                  placeholder="e.g., Large / Blue"
                  className={newVariantErrors.name ? 'border-destructive' : ''}
                />
                {renderError(newVariantErrors.name)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-variant-sku">SKU *</Label>
                <Input
                  id="new-variant-sku"
                  value={newVariant.sku}
                  onChange={(e) =>
                    setNewVariant({ ...newVariant, sku: e.target.value })
                  }
                  placeholder="e.g., PROD-LG-BLU"
                  className={newVariantErrors.sku ? 'border-destructive' : ''}
                />
                {renderError(newVariantErrors.sku)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-variant-price">Price</Label>
                <Input
                  id="new-variant-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newVariant.price ?? ''}
                  onChange={(e) =>
                    setNewVariant({
                      ...newVariant,
                      price: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  placeholder="Override product price"
                  className={newVariantErrors.price ? 'border-destructive' : ''}
                />
                {renderError(newVariantErrors.price)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-variant-stock">Stock *</Label>
                <Input
                  id="new-variant-stock"
                  type="number"
                  min="0"
                  value={newVariant.stock}
                  onChange={(e) => {
                    const value = e.target.value;
                    const parsed = value === '' ? 0 : parseInt(value, 10);
                    setNewVariant({
                      ...newVariant,
                      stock: isNaN(parsed) ? 0 : parsed,
                    });
                  }}
                  className={newVariantErrors.stock ? 'border-destructive' : ''}
                />
                {renderError(newVariantErrors.stock)}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsAdding(false);
                  setNewVariant({ name: '', sku: '', price: null, stock: 0 });
                  setNewVariantErrors({});
                }}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleAddVariant}>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Variants table */}
        {variants.length > 0 ? (
          <ScrollArea className="h-[500px] rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  {!disabled && (
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow key={variant.id || index}>
                    {editingIndex === index ? (
                      // Editing mode
                      <>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              value={editedVariant?.name || ''}
                              onChange={(e) =>
                                setEditedVariant({
                                  ...editedVariant!,
                                  name: e.target.value,
                                })
                              }
                              className={`h-8 ${errors.name ? 'border-destructive' : ''}`}
                            />
                            {renderError(errors.name)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              value={editedVariant?.sku || ''}
                              onChange={(e) =>
                                setEditedVariant({
                                  ...editedVariant!,
                                  sku: e.target.value,
                                })
                              }
                              className={`h-8 ${errors.sku ? 'border-destructive' : ''}`}
                            />
                            {renderError(errors.sku)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editedVariant?.price ?? ''}
                              onChange={(e) =>
                                setEditedVariant({
                                  ...editedVariant!,
                                  price: e.target.value
                                    ? parseFloat(e.target.value)
                                    : null,
                                })
                              }
                              className={`h-8 w-24 ml-auto ${errors.price ? 'border-destructive' : ''}`}
                            />
                            {renderError(errors.price)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              value={editedVariant?.stock || 0}
                              onChange={(e) => {
                                const value = e.target.value;
                                const parsed = value === '' ? 0 : parseInt(value, 10);
                                setEditedVariant({
                                  ...editedVariant!,
                                  stock: isNaN(parsed) ? 0 : parsed,
                                });
                              }}
                              className={`h-8 w-20 ml-auto ${errors.stock ? 'border-destructive' : ''}`}
                            />
                            {renderError(errors.stock)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleEditSave}
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleEditCancel}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      // View mode
                      <>
                        <TableCell className="font-medium">
                          {variant.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {variant.sku}
                        </TableCell>
                        <TableCell className="text-right">
                          {variant.price !== null
                            ? `$${variant.price.toFixed(2)}`
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {variant.stock}
                        </TableCell>
                        {!disabled && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStart(index)}
                                className="h-8 w-8 p-0"
                                disabled={editingIndex !== null}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(index)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                disabled={editingIndex !== null}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="rounded-lg border-2 border-dashed bg-muted/20 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-2">
              No variants added yet
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Variants allow you to offer different options like size, color, or material for the same product.
            </p>
            {!disabled && !isAdding && (
              <Button
                type="button"
                variant="outline"
                size="default"
                className="mt-6"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add First Variant
              </Button>
            )}
          </div>
        )}

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Variant</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this variant? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
