"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PermissionPicker } from "./permission-picker";
import { RoleTemplateSelector } from "./role-template-selector";
import { RoleUsageIndicator } from "./role-usage-indicator";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface CreateRoleFormProps {
  storeId: string;
  usage: {
    current: number;
    limit: number;
    remaining: number;
  };
}

export function CreateRoleForm({ storeId, usage }: CreateRoleFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  const canCreate = usage.remaining > 0;
  
  const handleTemplateSelect = (templateName: string, permissions: string[]) => {
    setName(templateName);
    setSelectedPermissions(permissions);
  };
  
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
      const response = await fetch(`/api/stores/${storeId}/custom-roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          permissions: selectedPermissions,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to create role");
        return;
      }
      
      toast.success(`Role "${data.role.name}" created successfully`);
      router.push(`/dashboard/stores/${storeId}/roles`);
      router.refresh();
      
    } catch (error) {
      console.error("Create role error:", error);
      toast.error("Failed to create role");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Usage Indicator */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role Limit</CardTitle>
          <CardDescription>
            Your current custom role usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleUsageIndicator 
            current={usage.current} 
            limit={usage.limit} 
          />
        </CardContent>
      </Card>
      
      {!canCreate ? (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">
              You have reached the maximum number of custom roles ({usage.limit}). 
              Please delete an existing role or contact support to increase your limit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick Templates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Start</CardTitle>
              <CardDescription>
                Use a template or create from scratch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleTemplateSelector onSelect={handleTemplateSelect} />
            </CardContent>
          </Card>
          
          <Separator />
          
          {/* Role Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role Details</CardTitle>
              <CardDescription>
                Define the name and description for this role
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
                Select the permissions for this role
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
          
          {/* Submit */}
          <div className="flex justify-end gap-3">
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
              disabled={isLoading || !name.trim() || selectedPermissions.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Role
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
