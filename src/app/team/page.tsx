import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { StaffManagement } from "@/components/staff/staff-management";
import { CanAccess } from "@/components/can-access";

export const metadata = {
  title: "Team",
  description: "Manage your team members and roles",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: { storeId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  // Default to first store or require selection
  const storeId = searchParams.storeId;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                  <p className="text-muted-foreground">
                    Manage store staff members and their roles
                  </p>
                </div>

                <CanAccess 
                  permission="staff:read"
                  fallback={
                    <div className="text-center py-12 text-muted-foreground">
                      You don&apos;t have permission to view staff members
                    </div>
                  }
                >
                  {storeId ? (
                    <StaffManagement storeId={storeId} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      Please select a store to view staff members
                    </div>
                  )}
                </CanAccess>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
