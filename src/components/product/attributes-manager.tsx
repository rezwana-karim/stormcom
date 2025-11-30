"use client";

// src/components/product/attributes-manager.tsx
// Product attributes manager component for custom product attributes

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Tag } from 'lucide-react';
import { toast } from 'sonner';

export interface ProductAttribute {
  id?: string;
  attributeId: string;
  name: string;
  value: string;
}

interface AttributesManagerProps {
  storeId?: string; // Optional - reserved for future API fetch
  attributes: ProductAttribute[];
  onChange: (attributes: ProductAttribute[]) => void;
  disabled?: boolean;
}

interface StoreAttribute {
  id: string;
  name: string;
  values: string[];
}

export function AttributesManager({
  storeId: _storeId, // Reserved for future use to fetch attributes from API
  attributes,
  onChange,
  disabled = false,
}: AttributesManagerProps) {
  const [availableAttributes] = useState<StoreAttribute[]>([
    // Mock data - in real implementation, fetch from API
    { id: '1', name: 'Color', values: ['Red', 'Blue', 'Green', 'Black', 'White'] },
    { id: '2', name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { id: '3', name: 'Material', values: ['Cotton', 'Polyester', 'Leather', 'Wool'] },
    { id: '4', name: 'Pattern', values: ['Solid', 'Striped', 'Checkered', 'Floral'] },
  ]);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>('');
  const [customValue, setCustomValue] = useState('');

  // Add attribute
  const handleAddAttribute = useCallback(() => {
    if (!selectedAttributeId || !customValue) {
      toast.error('Please select an attribute and enter a value');
      return;
    }

    const storeAttribute = availableAttributes.find((a) => a.id === selectedAttributeId);
    if (!storeAttribute) return;

    // Check if attribute already exists
    const exists = attributes.some(
      (a) => a.attributeId === selectedAttributeId && a.value === customValue
    );

    if (exists) {
      toast.error('This attribute with the same value already exists');
      return;
    }

    const newAttribute: ProductAttribute = {
      attributeId: selectedAttributeId,
      name: storeAttribute.name,
      value: customValue,
    };

    onChange([...attributes, newAttribute]);
    setCustomValue('');
    toast.success('Attribute added');
  }, [selectedAttributeId, customValue, attributes, availableAttributes, onChange]);

  // Remove attribute
  const handleRemoveAttribute = useCallback(
    (index: number) => {
      const newAttributes = attributes.filter((_, i) => i !== index);
      onChange(newAttributes);
      toast.success('Attribute removed');
    },
    [attributes, onChange]
  );

  // Get selected store attribute for value suggestions
  const selectedStoreAttribute = availableAttributes.find(
    (a) => a.id === selectedAttributeId
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          <div className="flex-1">
            <CardTitle>Product Attributes</CardTitle>
            <CardDescription>
              Add custom attributes like color, size, material, etc.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add attribute form */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Attribute</Label>
            <Select
              value={selectedAttributeId}
              onValueChange={setSelectedAttributeId}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select attribute" />
              </SelectTrigger>
              <SelectContent>
                {availableAttributes.map((attr) => (
                  <SelectItem key={attr.id} value={attr.id}>
                    {attr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            {selectedStoreAttribute ? (
              <Select
                value={customValue}
                onValueChange={setCustomValue}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or type value" />
                </SelectTrigger>
                <SelectContent>
                  {selectedStoreAttribute.values.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Enter value"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                disabled={disabled}
              />
            )}
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleAddAttribute}
              disabled={disabled || !selectedAttributeId || !customValue}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Custom value input (alternative to select) */}
        {selectedStoreAttribute && customValue && (
          <div className="text-xs text-muted-foreground">
            Or type a custom value above to add a new option
          </div>
        )}

        {/* Attributes list */}
        {attributes.length > 0 ? (
          <div className="space-y-2">
            <Label>Added Attributes ({attributes.length})</Label>
            <div className="flex flex-wrap gap-2">
              {attributes.map((attr, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="gap-2 px-3 py-1.5 text-sm"
                >
                  <span className="font-medium">{attr.name}:</span>
                  <span>{attr.value}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(index)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${attr.name}: ${attr.value}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Tag className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No attributes added yet. Add custom attributes to better describe your
              product.
            </p>
          </div>
        )}

        {/* Helper text */}
        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium">Tips:</p>
          <ul className="ml-4 mt-1 list-disc space-y-1">
            <li>Use attributes for characteristics that don&apos;t affect pricing or inventory</li>
            <li>For options that affect price/stock, use Variants instead</li>
            <li>Attributes help customers filter and find products</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
