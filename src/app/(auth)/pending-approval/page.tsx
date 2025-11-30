/**
 * Pending Approval Page
 * 
 * Shown to users after they sign up and are awaiting approval.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Mail, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PendingApprovalPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 size-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="size-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Application Submitted!</CardTitle>
          <CardDescription className="text-base">
            Your store application is being reviewed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-left bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium">What happens next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Review Process</p>
                  <p className="text-sm text-muted-foreground">
                    Our team will review your application within 24-48 hours
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Email Notification</p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll receive an email once your application is approved
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Store Setup</p>
                  <p className="text-sm text-muted-foreground">
                    Once approved, we&apos;ll set up your store and you can start selling
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4" />
            <span>Check your email for updates</span>
          </div>

          <div className="pt-4 border-t space-y-3">
            <p className="text-sm text-muted-foreground">
              Questions about your application?
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <a href="mailto:support@stormcom.app">
                  Contact Support
                </a>
              </Button>
              <Button variant="ghost" className="flex-1" asChild>
                <Link href="/">
                  Back to Home
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
