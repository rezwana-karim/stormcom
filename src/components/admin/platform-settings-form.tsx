"use client";

/**
 * Platform Settings Form
 * 
 * Form for editing global custom role settings
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface PlatformSettingsFormProps {
  settings: {
    id: string;
    defaultCustomRoleLimit: number;
    maxCustomRoleLimit: number;
    customRoleLimitsByPlan: Record<string, number>;
  };
}

const SUBSCRIPTION_PLANS = ["FREE", "BASIC", "PROFESSIONAL", "ENTERPRISE"];

export function PlatformSettingsForm({ settings }: PlatformSettingsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    defaultCustomRoleLimit: settings.defaultCustomRoleLimit,
    maxCustomRoleLimit: settings.maxCustomRoleLimit,
    customRoleLimitsByPlan: { ...settings.customRoleLimitsByPlan },
  });
  
  const handlePlanLimitChange = (plan: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      customRoleLimitsByPlan: {
        ...prev.customRoleLimitsByPlan,
        [plan]: value,
      },
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.defaultCustomRoleLimit < 1) {
      toast.error("Default limit must be at least 1");
      return;
    }
    
    if (formData.maxCustomRoleLimit < formData.defaultCustomRoleLimit) {
      toast.error("Maximum limit cannot be less than default limit");
      return;
    }
    
    for (const plan of SUBSCRIPTION_PLANS) {
      const limit = formData.customRoleLimitsByPlan[plan] || 0;
      if (limit > formData.maxCustomRoleLimit) {
        toast.error(`${plan} limit cannot exceed maximum limit`);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }
      
      toast.success("Platform settings saved successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global Limits */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="defaultLimit">Default Role Limit</Label>
          <Input
            id="defaultLimit"
            type="number"
            min={1}
            max={100}
            value={formData.defaultCustomRoleLimit}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                defaultCustomRoleLimit: parseInt(e.target.value) || 0,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Applied to new stores without a plan-specific limit
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="maxLimit">Maximum Role Limit</Label>
          <Input
            id="maxLimit"
            type="number"
            min={1}
            max={100}
            value={formData.maxCustomRoleLimit}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                maxCustomRoleLimit: parseInt(e.target.value) || 0,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Absolute maximum for any store
          </p>
        </div>
      </div>
      
      <Separator />
      
      {/* Plan-Based Limits */}
      <div>
        <h3 className="font-medium mb-4">Plan-Based Limits</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div key={plan} className="space-y-2">
              <Label htmlFor={`plan-${plan}`}>{plan}</Label>
              <Input
                id={`plan-${plan}`}
                type="number"
                min={0}
                max={formData.maxCustomRoleLimit}
                value={formData.customRoleLimitsByPlan[plan] || 0}
                onChange={(e) =>
                  handlePlanLimitChange(plan, parseInt(e.target.value) || 0)
                }
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Set to 0 to use the default limit for that plan
        </p>
      </div>
      
      <Separator />
      
      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <IconCheck className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
