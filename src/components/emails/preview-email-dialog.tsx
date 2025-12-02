'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import DOMPurify from 'isomorphic-dompurify';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

interface PreviewEmailDialogProps {
  template: EmailTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PreviewEmailDialog({
  template,
  open,
  onOpenChange,
}: PreviewEmailDialogProps) {
  // Sanitize template values to prevent XSS
  const sanitizedName = DOMPurify.sanitize(template.name, { ALLOWED_TAGS: [] });
  const sanitizedSubject = DOMPurify.sanitize(template.subject, { ALLOWED_TAGS: [] });
  
  const previewHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; }
    .header { background: #f4f4f4; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background: #333; color: white; padding: 10px; text-align: center; font-size: 12px; }
    .button { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your Store Name</h1>
  </div>
  <div class="content">
    <h2>${sanitizedName}</h2>
    <p>Dear Customer,</p>
    <p>This is a preview of the <strong>${sanitizedName}</strong> email template.</p>
    <p>Subject: <em>${sanitizedSubject}</em></p>
    <a href="#" class="button">View Order</a>
    <p>Thank you for your business!</p>
  </div>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} Your Store Name. All rights reserved.</p>
    <p>123 Store Street, City, State 12345</p>
  </div>
</body>
</html>
  `;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Preview: {template.name}</DialogTitle>
          <DialogDescription>
            This is how the email will appear to recipients.
          </DialogDescription>
        </DialogHeader>
        <div className="border rounded-lg overflow-hidden">
          <div 
            className="bg-white p-4 overflow-y-auto max-h-[70vh]"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
