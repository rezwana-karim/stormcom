import { Metadata } from "next";
import Link from "next/link";
import { Store, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Store Not Found | StormCom",
  description: "The store you're looking for doesn't exist or has been removed.",
};

export default function StoreNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Store className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">Store Not Found</CardTitle>
          <CardDescription>
            The store you&apos;re looking for doesn&apos;t exist or may have been removed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            This could happen if:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>The store URL was typed incorrectly</li>
            <li>The store has been closed or removed</li>
            <li>The store is temporarily unavailable</li>
          </ul>
          
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/stores">
                <Search className="mr-2 h-4 w-4" />
                Browse Stores
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
