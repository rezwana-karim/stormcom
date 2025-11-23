'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Mail, Edit, Eye, Send } from 'lucide-react';
import { EditEmailTemplateDialog } from './edit-email-template-dialog';
import { PreviewEmailDialog } from './preview-email-dialog';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  type: 'transactional' | 'marketing';
  active: boolean;
  lastModified: string;
}

const mockTemplates: EmailTemplate[] = [
  {
    id: 'tpl1',
    name: 'Order Confirmation',
    subject: 'Your Order #{{orderNumber}} is Confirmed',
    description: 'Sent when a customer places an order',
    type: 'transactional',
    active: true,
    lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl2',
    name: 'Shipping Notification',
    subject: 'Your Order Has Shipped!',
    description: 'Sent when an order is shipped',
    type: 'transactional',
    active: true,
    lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl3',
    name: 'Welcome Email',
    subject: 'Welcome to Our Store!',
    description: 'Sent to new customers after signup',
    type: 'marketing',
    active: true,
    lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl4',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    description: 'Sent when customer requests password reset',
    type: 'transactional',
    active: true,
    lastModified: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tpl5',
    name: 'Newsletter',
    subject: 'Monthly Newsletter - {{month}}',
    description: 'Monthly promotional newsletter',
    type: 'marketing',
    active: false,
    lastModified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function EmailTemplatesList() {
  const [templates] = useState<EmailTemplate[]>(mockTemplates);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  const handleSendTest = (template: EmailTemplate) => {
    toast({
      title: 'Test email sent',
      description: `Test email for "${template.name}" sent to your email address.`,
    });
  };

  const handleToggleActive = (template: EmailTemplate) => {
    const newStatus = !template.active;
    toast({
      title: newStatus ? 'Template activated' : 'Template deactivated',
      description: `"${template.name}" is now ${newStatus ? 'active' : 'inactive'}.`,
    });
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingTemplate(template)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendTest(template)}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(template)}>
                      {template.active ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Subject</div>
                  <div className="text-sm">{template.subject}</div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={template.type === 'transactional' ? 'default' : 'secondary'}>
                    {template.type}
                  </Badge>
                  <Badge variant={template.active ? 'default' : 'outline'}>
                    {template.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Modified {new Date(template.lastModified).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingTemplate && (
        <EditEmailTemplateDialog
          template={editingTemplate}
          open={!!editingTemplate}
          onOpenChange={(open) => !open && setEditingTemplate(null)}
        />
      )}

      {previewTemplate && (
        <PreviewEmailDialog
          template={previewTemplate}
          open={!!previewTemplate}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
        />
      )}
    </>
  );
}
