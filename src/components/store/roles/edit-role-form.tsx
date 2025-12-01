"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PermissionPicker } from "./permission-picker";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Users } from "lucide-react";

interface EditRoleFormProps {
  storeId: string;
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    isActive: boolean;
    staffCount: number;
  };
}

export function EditRoleForm({ storeId, role }: EditRoleFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description || "");
  const [isActive, setIsActive] = useState(role.isActive);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(role.permissions);
  
  const hasChanges = 
    name !== role.name ||
    description !== (role.description || "") ||
    isActive !== role.isActive ||
    JSON.stringify(selectedPermissions.sort()) !== JSON.stringify(role.permissions.sort());
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }
    
    if (selectedPermissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/stores/${storeId}/custom-roles/${role.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          permissions: selectedPermissions,
          isActive,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to update role");
        return;
      }
      
      toast.success("Role updated successfully");
      router.push(`/dashboard/stores/${storeId}/roles`);
      router.refresh();
      
    } catch (error) {
      console.error("Update role error:", error);
      toast.error("Failed to update role");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const force = role.staffCount > 0;
      const url = `/api/stores/${storeId}/custom-roles/${role.id}${force ? '?force=true' : ''}`;
      
      const response = await fetch(url, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to delete role");
        return;
      }
      
      toast.success("Role deleted successfully");
      router.push(`/dashboard/stores/${storeId}/roles`);
      router.refresh();
      
    } catch (error) {
      console.error("Delete role error:", error);
      toast.error("Failed to delete role");
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role Status & Staff Count */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {role.staffCount} staff member{role.staffCount !== 1 ? 's' : ''} assigned
              </span>
            </div>
            {role.staffCount > 0 && (
              <Badge variant="secondary">In Use</Badge>
            )}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="active" className="text-base">Active</Label>
              <p className="text-sm text-muted-foreground">
                Deactivating prevents new assignments but keeps existing ones
              </p>
            </div>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
      
      <Separator />
      
      {/* Role Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role Details</CardTitle>
          <CardDescription>
            Update the name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Senior Sales Rep"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this role is for..."
              rows={3}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions *</CardTitle>
          <CardDescription>
            Update the permissions for this role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PermissionPicker
            selectedPermissions={selectedPermissions}
            onChange={setSelectedPermissions}
            disabled={isLoading}
          />
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              disabled={isLoading || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Role
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Custom Role</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{role.name}&quot;?
                {role.staffCount > 0 && (
                  <span className="block mt-2 text-amber-600 dark:text-amber-400">
                    Warning: This role is assigned to {role.staffCount} staff member{role.staffCount !== 1 ? 's' : ''}. 
                    They will be unassigned from this role.
                  </span>
                )}
                <span className="block mt-2">
                  This action cannot be undone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Role
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !hasChanges || !name.trim() || selectedPermissions.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
