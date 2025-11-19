// src/components/attribute-form.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AttributeFormProps {
  attributeId?: string;
  initialData?: {
    name: string;
    values: string[];
  };
  storeId: string;
}

export function AttributeForm({ attributeId, initialData, storeId }: AttributeFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(initialData?.name || '');
  const [values, setValues] = React.useState<string[]>(
    initialData?.values || ['']
  );
  const [saving, setSaving] = React.useState(false);

  const handleAddValue = () => {
    setValues([...values, '']);
  };

  const handleRemoveValue = (index: number) => {
    if (values.length <= 1) {
      toast.error('Attribute must have at least one value');
      return;
    }
    setValues(values.filter((_, i) => i !== index));
  };

  const handleValueChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error('Attribute name is required');
      return;
    }

    const trimmedValues = values.map((v) => v.trim()).filter((v) => v);
    if (trimmedValues.length === 0) {
      toast.error('At least one value is required');
      return;
    }

    // Check for duplicate values
    const uniqueValues = new Set(trimmedValues);
    if (uniqueValues.size !== trimmedValues.length) {
      toast.error('Duplicate values are not allowed');
      return;
    }

    try {
      setSaving(true);

      const url = attributeId
        ? `/api/attributes/${attributeId}`
        : '/api/attributes';
      
      const method = attributeId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          values: trimmedValues,
          ...(attributeId ? {} : { storeId }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save attribute');
      }

      toast.success(
        attributeId
          ? 'Attribute updated successfully'
          : 'Attribute created successfully'
      );
      router.push('/dashboard/attributes');
      router.refresh();
    } catch (error) {
      console.error('Error saving attribute:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save attribute'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Define the attribute name and its possible values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Attribute Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Color, Size, Material"
              required
            />
            <p className="text-sm text-muted-foreground">
              A descriptive name for this attribute
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attribute Values</CardTitle>
          <CardDescription>
            Add the possible values for this attribute
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {values.map((value, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  placeholder={`Value ${index + 1}`}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveValue(index)}
                  disabled={values.length <= 1}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddValue}
            className="w-full"
          >
            <IconPlus className="mr-2 h-4 w-4" />
            Add Value
          </Button>

          <p className="text-sm text-muted-foreground">
            Example: For &quot;Color&quot; you might add Red, Blue, Green, Yellow
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : attributeId ? 'Update Attribute' : 'Create Attribute'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/attributes')}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
