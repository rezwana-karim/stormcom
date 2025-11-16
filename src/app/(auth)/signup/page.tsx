"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { signup } from "@/app/actions/auth";

export default function SignupPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'password' | 'email'>('password');
  const [emailForMagicLink, setEmailForMagicLink] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Password signup with server action
  const [state, action, isPending] = useActionState(signup, undefined);

  // Redirect on successful password signup
  if (state?.success) {
    toast.success("Account created! Please sign in.");
    router.push("/login");
  }

  // Magic link signup
  async function handleMagicLinkSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSendingEmail(true);
    const res = await signIn("email", {
      email: emailForMagicLink,
      redirect: false,
      callbackUrl: "/onboarding",
    });
    setIsSendingEmail(false);
    if (res?.ok) {
      toast.success("Check your email to complete sign up");
      router.push("/verify-email");
    } else if (res?.error) {
      toast.error(res.error);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Choose your preferred sign up method</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={method} onValueChange={(v) => setMethod(v as 'password' | 'email')} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="email">Email Link</TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4 mt-4">
              <form action={action} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    required
                    autoComplete="name"
                  />
                  {state?.errors?.name && (
                    <p className="text-sm text-destructive">{state.errors.name[0]}</p>
                  )}
                </div>

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
                  {state?.errors?.email && (
                    <p className="text-sm text-destructive">{state.errors.email[0]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                  {state?.errors?.password && (
                    <div className="space-y-1">
                      <p className="text-sm text-destructive">Password must:</p>
                      <ul className="text-sm text-destructive list-disc list-inside">
                        {state.errors.password.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Min 8 characters with letter, number, and special character
                  </p>
                </div>

                {state?.errors?._form && (
                  <p className="text-sm text-destructive">{state.errors._form[0]}</p>
                )}

                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="email" className="space-y-4 mt-4">
              <form className="space-y-4" onSubmit={handleMagicLinkSignup}>
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
                    We&apos;ll send you a magic link to get started
                  </p>
                </div>
                <Button type="submit" disabled={isSendingEmail} className="w-full">
                  {isSendingEmail ? "Sending link..." : "Continue with Email"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="underline hover:text-foreground">
              Log in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
