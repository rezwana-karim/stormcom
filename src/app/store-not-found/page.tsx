import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "Store Not Found",
  description: "The store you are looking for does not exist or has been removed.",
};

/**
 * 404 page for non-existent stores
 * Shown when a subdomain doesn't match any active store
 */
export default function StoreNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="pb-4">
          {/* Icon */}
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          
          <CardTitle className="text-3xl">Store Not Found</CardTitle>
          <CardDescription className="text-base">
            The store you are looking for does not exist, has been removed, or the
            subdomain is incorrect.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Suggestions */}
          <div className="text-left bg-muted/50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Things you can try:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Check the URL for typos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Make sure you have the correct subdomain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Contact the store owner if you believe this is an error</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/signup">
                <Store className="mr-2 h-4 w-4" />
                Create Your Store
              </Link>
            </Button>
          </div>

          {/* Help Link */}
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a 
              href="mailto:support@stormcom.app" 
              className="text-primary hover:underline font-medium"
            >
              Contact Support
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
