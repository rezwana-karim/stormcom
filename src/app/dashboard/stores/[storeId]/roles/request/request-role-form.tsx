/**
 * Request Role Form Component
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { getPermissionsByCategory } from '@/lib/custom-role-permissions';

interface RequestRoleFormProps {
  storeId: string;
}

export function RequestRoleForm({ storeId }: RequestRoleFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [justification, setJustification] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  const permissionsByCategory = getPermissionsByCategory();
  
  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };
  
  const selectAllInCategory = (category: string) => {
    const categoryPerms = permissionsByCategory[category]?.map(p => p.key) || [];
    const allSelected = categoryPerms.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !categoryPerms.includes(p)));
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...categoryPerms])]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roleName.trim()) {
      toast.error('Please enter a role name');
      return;
    }
    
    if (selectedPermissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/stores/${storeId}/role-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: roleName.trim(),
          roleDescription: roleDescription.trim() || undefined,
          permissions: selectedPermissions,
          justification: justification.trim() || undefined,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit request');
      }
      
      toast.success('Role request submitted successfully');
      router.push(`/dashboard/stores/${storeId}/roles?tab=requests`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
          <CardDescription>
            Provide basic information about the custom role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role Name *</Label>
            <Input
              id="roleName"
              placeholder="e.g., Marketing Manager, Inventory Supervisor"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Choose a descriptive name for this role
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roleDescription">Description</Label>
            <Textarea
              id="roleDescription"
              placeholder="Describe the purpose of this role..."
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="justification">Justification</Label>
            <Textarea
              id="justification"
              placeholder="Explain why you need this custom role (helps with approval)..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              Providing context helps Super Admins understand your needs
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Permissions Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>
            Select the permissions this role should have ({selectedPermissions.length} selected)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <Accordion type="multiple" className="w-full" defaultValue={Object.keys(permissionsByCategory)}>
              {Object.entries(permissionsByCategory).map(([category, perms]) => {
                const selectedInCategory = perms.filter(p => 
                  selectedPermissions.includes(p.key)
                ).length;
                const allSelected = selectedInCategory === perms.length;
                
                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-medium">{category}</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedInCategory}/{perms.length}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1 pt-2">
                        <button
                          type="button"
                          onClick={() => selectAllInCategory(category)}
                          className="text-xs text-primary hover:underline mb-2"
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                        
                        {perms.map((perm) => (
                          <div
                            key={perm.key}
                            className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50"
                          >
                            <Checkbox
                              id={perm.key}
                              checked={selectedPermissions.includes(perm.key)}
                              onCheckedChange={() => togglePermission(perm.key)}
                            />
                            <div className="flex-1">
                              <label
                                htmlFor={perm.key}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {perm.label}
                              </label>
                              {perm.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {perm.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Submit */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedPermissions.length} permission{selectedPermissions.length !== 1 ? 's' : ''} selected
        </p>
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || selectedPermissions.length === 0}>
            {isLoading ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <IconCheck className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
