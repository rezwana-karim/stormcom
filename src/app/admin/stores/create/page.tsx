/**
 * Admin Store Creation Page
 * 
 * Redirects to store requests page - stores can only be created
 * by approving store requests from users.
 */

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ClipboardList, ArrowRight } from "lucide-react";

export default async function CreateStorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Store</h1>
        <p className="text-muted-foreground">
          Store creation workflow
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Store Request Approval Required</AlertTitle>
        <AlertDescription>
          Stores can only be created by approving store requests from users. 
          This ensures proper vetting and controlled onboarding.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Store Creation Process
          </CardTitle>
          <CardDescription>
            Follow this workflow to create stores for users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">User Registers</h4>
                <p className="text-sm text-muted-foreground">
                  User creates account and their account gets approved by Super Admin
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">User Submits Store Request</h4>
                <p className="text-sm text-muted-foreground">
                  Approved user goes to Dashboard → Store Request to submit their store details
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Super Admin Reviews & Approves</h4>
                <p className="text-sm text-muted-foreground">
                  Review the store request in Store Requests page and approve to create the store
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white text-sm font-medium">
                ✓
              </div>
              <div>
                <h4 className="font-medium">Store Created</h4>
                <p className="text-sm text-muted-foreground">
                  Upon approval, store is automatically created and user is notified
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t">
            <Link href="/admin/stores/requests">
              <Button>
                <ClipboardList className="h-4 w-4 mr-2" />
                View Store Requests
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/admin/users/pending">
              <Button variant="outline">
                View Pending Users
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
