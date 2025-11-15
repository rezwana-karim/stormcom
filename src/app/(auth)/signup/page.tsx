"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

const FormSchema = z.object({ email: z.string().email() });

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parse = FormSchema.safeParse({ email });
    if (!parse.success) {
      toast.error("Please enter a valid email address");
      return;
    }
    startTransition(async () => {
      const res = await signIn("email", {
        email,
        redirect: false,
        callbackUrl: "/onboarding",
      });
      if (res?.ok) {
        toast.success("Check your email to complete sign up");
        router.push("/verify-email");
      } else if (res?.error) {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>We&apos;ll email you a magic link to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Sending link..." : "Continue with Email"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already have an account? <a href="/login" className="underline">Log in</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
