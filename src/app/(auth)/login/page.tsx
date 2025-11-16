"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'password' | 'email'>('password');
  const [emailForMagicLink, setEmailForMagicLink] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Handle password login success
  async function handlePasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoggingIn(true);
    const formData = new FormData(e.currentTarget);
    
    // Since we're not using useActionState here, call signIn directly
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/dashboard',
    });
    
    setIsLoggingIn(false);

    if (res?.ok) {
      toast.success("Welcome back!");
      router.push('/dashboard');
    } else if (res?.error) {
      toast.error(res.error || "Invalid email or password");
    }
  }

  // Magic link login
  async function handleMagicLinkLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSendingEmail(true);
    const res = await signIn("email", {
      email: emailForMagicLink,
      redirect: false,
      callbackUrl: "/dashboard",
    });
    setIsSendingEmail(false);
    if (res?.ok) {
      toast.success("Check your email for a sign-in link");
      router.push("/verify-email");
    } else if (res?.error) {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Choose your preferred sign in method</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={method} onValueChange={(v) => setMethod(v as 'password' | 'email')} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="email">Email Link</TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4 mt-4">
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="/forgot-password"
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit" disabled={isLoggingIn} className="w-full">
                  {isLoggingIn ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 mt-4">
              <form className="space-y-4" onSubmit={handleMagicLinkLogin}>
                <div className="space-y-2">
                  <Label htmlFor="email-magic">Email</Label>
                  <Input
                    id="email-magic"
                    type="email"
                    placeholder="you@example.com"
                    value={emailForMagicLink}
                    onChange={(e) => setEmailForMagicLink(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send you a magic link to sign in
                  </p>
                </div>
                <Button type="submit" disabled={isSendingEmail} className="w-full">
                  {isSendingEmail ? "Sending link..." : "Continue with Email"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="underline hover:text-foreground">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
