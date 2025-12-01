/**
 * Super Admin - Platform Settings for Custom Roles
 * 
 * Configure global defaults for custom role limits
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { IconChevronLeft, IconSettings } from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";

export const metadata: Metadata = {
  title: "Platform Settings | Admin",
  description: "Configure global custom role settings",
};

async function getPlatformSettings() {
  let settings = await prisma.platformSettings.findFirst();
  
  if (!settings) {
    // Create default settings if none exist
    settings = await prisma.platformSettings.create({
      data: {
        defaultCustomRoleLimit: 5,
        maxCustomRoleLimit: 50,
        customRoleLimitsByPlan: JSON.stringify({
          FREE: 3,
          BASIC: 5,
          PROFESSIONAL: 10,
          ENTERPRISE: 25,
        }),
      },
    });
  }
  
  return settings;
}

export default async function AdminPlatformSettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    notFound();
  }
  
  // Check if user is Super Admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  });
  
  if (!user?.isSuperAdmin) {
    notFound();
  }
  
  const settings = await getPlatformSettings();
  
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link 
          href="/admin/custom-roles" 
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <IconChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <IconSettings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Configure global defaults for custom role management
        </p>
      </div>
      
      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Role Limits</CardTitle>
          <CardDescription>
            Set default limits for custom roles across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformSettingsForm 
            settings={{
              id: settings.id,
              defaultCustomRoleLimit: settings.defaultCustomRoleLimit,
              maxCustomRoleLimit: settings.maxCustomRoleLimit,
              customRoleLimitsByPlan: typeof settings.customRoleLimitsByPlan === 'string' 
                ? JSON.parse(settings.customRoleLimitsByPlan) 
                : (settings.customRoleLimitsByPlan as Record<string, number>),
            }}
          />
        </CardContent>
      </Card>
      
      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>How Limits Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Default Limit</h4>
            <p className="text-sm text-muted-foreground">
              Applied to new stores when they are created, if no plan-specific limit exists.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Maximum Limit</h4>
            <p className="text-sm text-muted-foreground">
              The absolute maximum that can be set for any store, even by Super Admins.
            </p>
          </div>
          <div>
            <h4 className="font-medium">Plan-Based Limits</h4>
            <p className="text-sm text-muted-foreground">
              When a store is created or upgraded, the limit is automatically set based on their subscription plan.
              You can override individual store limits on the store detail page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
