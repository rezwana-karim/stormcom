'use client';

// src/components/inventory/bulk-import-dialog.tsx
// Dialog for bulk importing inventory adjustments via CSV

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const ADJUSTMENT_REASONS = [
  { value: 'restock', label: 'Restock' },
  { value: 'manual_adjustment', label: 'Manual Adjustment' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'lost', label: 'Lost' },
  { value: 'found', label: 'Found' },
  { value: 'inventory_count', label: 'Inventory Count' },
  { value: 'stock_transfer', label: 'Stock Transfer' },
  { value: 'expired', label: 'Expired' },
] as const;

interface ParsedItem {
  sku: string;
  quantity: number;
  type: 'ADD' | 'REMOVE' | 'SET';
  note?: string;
  isValid: boolean;
  error?: string;
}

interface BulkImportResult {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ index: number; sku?: string; error: string }>;
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onComplete: () => void;
}

export function BulkImportDialog({
  open,
  onOpenChange,
  storeId,
  onComplete,
}: BulkImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [csvText, setCsvText] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [reason, setReason] = useState('restock');
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetDialog = () => {
    setStep('upload');
    setCsvText('');
    setParsedItems([]);
    setReason('restock');
    setResult(null);
    setProgress(0);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const items: ParsedItem[] = [];

    // Skip header if present
    const startIndex = lines[0]?.toLowerCase().includes('sku') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      const [sku, quantityStr, typeStr, note] = parts;

      const quantity = parseInt(quantityStr, 10);
      const type = (typeStr?.toUpperCase() || 'SET') as 'ADD' | 'REMOVE' | 'SET';

      const item: ParsedItem = {
        sku: sku || '',
        quantity,
        type: ['ADD', 'REMOVE', 'SET'].includes(type) ? type : 'SET',
        note: note || undefined,
        isValid: true,
      };

      // Validation
      if (!item.sku) {
        item.isValid = false;
        item.error = 'SKU is required';
      } else if (isNaN(quantity) || quantity < 0) {
        item.isValid = false;
        item.error = 'Invalid quantity';
      }

      items.push(item);
    }

    setParsedItems(items);
    if (items.length > 0) {
      setStep('preview');
    } else {
      toast.error('No valid items found in CSV');
    }
  };

  const handlePasteChange = (text: string) => {
    setCsvText(text);
    if (text.trim()) {
      parseCSV(text);
    }
  };

  const handleImport = async () => {
    const validItems = parsedItems.filter((item) => item.isValid);
    if (validItems.length === 0) {
      toast.error('No valid items to import');
      return;
    }

    if (validItems.length > 1000) {
      toast.error('Maximum 1000 items per import');
      return;
    }

    setStep('processing');
    setProgress(10);

    try {
      const response = await fetch('/api/inventory/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          items: validItems.map((item) => ({
            sku: item.sku,
            quantity: item.quantity,
            type: item.type,
            reason,
            note: item.note,
          })),
        }),
      });

      setProgress(90);

      const data = await response.json();

      if (response.ok) {
        setResult(data.data);
        setProgress(100);
        setStep('complete');
        
        if (data.data.failed === 0) {
          toast.success(`Successfully updated ${data.data.succeeded} items`);
        } else {
          toast.warning(`Updated ${data.data.succeeded} items, ${data.data.failed} failed`);
        }
      } else {
        toast.error(data.error || 'Import failed');
        setStep('preview');
      }
    } catch {
      toast.error('Failed to process import');
      setStep('preview');
    }
  };

  const downloadTemplate = () => {
    const template = 'sku,quantity,type,note\nSKU-001,100,SET,Initial stock\nSKU-002,50,ADD,Restock\nSKU-003,10,REMOVE,Damaged items';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedItems.filter((item) => item.isValid).length;
  const invalidCount = parsedItems.length - validCount;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Bulk Inventory Import
          </DialogTitle>
          <DialogDescription>
            Import inventory adjustments from a CSV file (max 1000 items)
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-6 py-4">
            {/* File Upload */}
            <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Upload CSV file</p>
                <p className="text-sm text-muted-foreground">
                  or paste CSV content below
                </p>
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <FileText className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* CSV Text Area */}
            <div className="space-y-2">
              <Label>Or paste CSV content</Label>
              <Textarea
                placeholder="sku,quantity,type,note&#10;SKU-001,100,SET,Initial stock&#10;SKU-002,50,ADD,Restock"
                value={csvText}
                onChange={(e) => handlePasteChange(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            {/* Template Download */}
            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
              <div className="text-sm">
                <p className="font-medium">Need a template?</p>
                <p className="text-muted-foreground">Download our CSV template to get started</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Template
              </Button>
            </div>

            {/* Format Info */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">CSV Format:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>sku</strong> - Product SKU (required)</li>
                <li><strong>quantity</strong> - Number of units (required, non-negative)</li>
                <li><strong>type</strong> - ADD, REMOVE, or SET (optional, defaults to SET)</li>
                <li><strong>note</strong> - Optional note for the adjustment</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            {/* Summary */}
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                {validCount} valid
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 border-red-200 text-red-700">
                  <XCircle className="h-3 w-3" />
                  {invalidCount} invalid
                </Badge>
              )}
            </div>

            {/* Reason Select */}
            <div className="flex items-center gap-4">
              <Label>Adjustment Reason:</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedItems.slice(0, 50).map((item, index) => (
                    <TableRow key={index} className={!item.isValid ? 'bg-red-50' : ''}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{item.sku || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {isNaN(item.quantity) ? '-' : item.quantity}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {item.note || '-'}
                      </TableCell>
                      <TableCell>
                        {item.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs">{item.error}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {parsedItems.length > 50 && (
              <p className="text-sm text-muted-foreground text-center">
                Showing first 50 of {parsedItems.length} items
              </p>
            )}
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="py-12 space-y-6 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">Processing Import...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we update inventory
              </p>
            </div>
            <Progress value={progress} className="w-full max-w-md mx-auto" />
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && result && (
          <div className="py-8 space-y-6">
            {/* Summary */}
            <div className="text-center space-y-4">
              {result.failed === 0 ? (
                <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
              ) : (
                <AlertTriangle className="h-16 w-16 text-yellow-600 mx-auto" />
              )}
              <div>
                <p className="text-2xl font-bold">
                  {result.succeeded} of {result.total} Updated
                </p>
                <p className="text-muted-foreground">
                  {result.failed === 0
                    ? 'All items were successfully updated'
                    : `${result.failed} item${result.failed !== 1 ? 's' : ''} failed`}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{result.succeeded}</p>
                <p className="text-sm text-green-600">Success</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-red-600">Failed</p>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="border rounded-lg p-4 max-h-[200px] overflow-auto">
                <p className="font-medium mb-2 text-red-600">Failed Items:</p>
                <ul className="space-y-1 text-sm">
                  {result.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <span>
                        {err.sku && <span className="font-mono">{err.sku}: </span>}
                        {err.error}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cancel
            </Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); setParsedItems([]); }}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} Item{validCount !== 1 ? 's' : ''}
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={() => { handleClose(false); onComplete(); }}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
