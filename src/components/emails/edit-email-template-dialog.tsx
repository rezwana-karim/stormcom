'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  type: 'transactional' | 'marketing';
  active: boolean;
}

interface EditEmailTemplateDialogProps {
  template: EmailTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEmailTemplateDialog({
  template,
  open,
  onOpenChange,
}: EditEmailTemplateDialogProps) {
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [description, setDescription] = useState(template.description);
  const [type, setType] = useState<'transactional' | 'marketing'>(template.type);
  const [htmlContent] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .header { background: #f4f4f4; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background: #333; color: white; padding: 10px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{storeName}}</h1>
  </div>
  <div class="content">
    <h2>${template.name}</h2>
    <p>Email content goes here...</p>
  </div>
  <div class="footer">
    <p>&copy; {{year}} {{storeName}}. All rights reserved.</p>
  </div>
</body>
</html>`);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    toast({
      title: 'Template updated',
      description: `"${name}" has been updated successfully.`,
    });

    setIsSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Email Template</DialogTitle>
          <DialogDescription>
            Modify the email template settings and content.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Order Confirmation"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Your Order #{{orderNumber}} is Confirmed"
            />
            <p className="text-xs text-muted-foreground">
              Use {`{{variableName}}`} for dynamic content
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of when this email is sent"
              rows={2}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transactional">Transactional</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="html">HTML Content</Label>
            <Textarea
              id="html"
              value={htmlContent}
              readOnly
              className="font-mono text-xs"
              rows={12}
            />
            <p className="text-xs text-muted-foreground">
              Available variables: {`{{storeName}}, {{year}}, {{orderNumber}}, {{customerName}}`}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
