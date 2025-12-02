"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { signup } from "@/app/actions/auth";
import { Building2, Mail, Lock, User, Phone, Briefcase } from "lucide-react";

const BUSINESS_CATEGORIES = [
  { value: "retail", label: "Retail & E-commerce" },
  { value: "food", label: "Food & Beverage" },
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "electronics", label: "Electronics & Technology" },
  { value: "health", label: "Health & Beauty" },
  { value: "home", label: "Home & Garden" },
  { value: "sports", label: "Sports & Outdoors" },
  { value: "automotive", label: "Automotive" },
  { value: "services", label: "Professional Services" },
  { value: "other", label: "Other" },
];

export default function SignupPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'password' | 'email'>('password');
  const [step, setStep] = useState<1 | 2>(1);
  const [emailForMagicLink, setEmailForMagicLink] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [businessCategory, setBusinessCategory] = useState("");
  
  // Step 1 data storage (persisted across steps)
  const [step1Data, setStep1Data] = useState({
    name: '',
    email: '',
    password: '',
  });
  
  // Password signup with server action
  const [state, action, isPending] = useActionState(signup, undefined);

  // Handle successful signup - show pending message
  useEffect(() => {
    if (state?.success) {
      toast.success("Application submitted! We'll review your request shortly.");
      router.push("/pending-approval");
    }
  }, [state?.success, router]);

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
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create your store account</CardTitle>
          <CardDescription>
            {step === 1 
              ? "Start by creating your account credentials" 
              : "Tell us about your business"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={method} onValueChange={(v) => setMethod(v as 'password' | 'email')} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="password">
                <Lock className="size-4 mr-2" />
                Password
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="size-4 mr-2" />
                Email Link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-4 mt-4">
              <form action={action} className="space-y-4">
                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div className={`size-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    1
                  </div>
                  <div className="w-12 h-0.5 bg-muted" />
                  <div className={`size-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    2
                  </div>
                </div>

                {step === 1 ? (
                  <>
                    {/* Account Information */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="size-4" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        required
                        autoComplete="name"
                        value={step1Data.name}
                        onChange={(e) => setStep1Data(prev => ({ ...prev, name: e.target.value }))}
                      />
                      {state?.errors?.name && (
                        <p className="text-sm text-destructive">{state.errors.name[0]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="size-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        value={step1Data.email}
                        onChange={(e) => setStep1Data(prev => ({ ...prev, email: e.target.value }))}
                      />
                      {state?.errors?.email && (
                        <p className="text-sm text-destructive">{state.errors.email[0]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="flex items-center gap-2">
                        <Lock className="size-4" />
                        Password
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        autoComplete="new-password"
                        value={step1Data.password}
                        onChange={(e) => setStep1Data(prev => ({ ...prev, password: e.target.value }))}
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

                    <Button 
                      type="button" 
                      onClick={() => setStep(2)} 
                      className="w-full"
                    >
                      Continue to Business Details
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Hidden fields for step 1 data */}
                    <input type="hidden" name="name" value={step1Data.name} />
                    <input type="hidden" name="email" value={step1Data.email} />
                    <input type="hidden" name="password" value={step1Data.password} />
                    
                    {/* Business Information */}
                    <div className="space-y-2">
                      <Label htmlFor="businessName" className="flex items-center gap-2">
                        <Building2 className="size-4" />
                        Business Name
                      </Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        placeholder="My Awesome Store"
                        required
                      />
                      {state?.errors?.businessName && (
                        <p className="text-sm text-destructive">{state.errors.businessName[0]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessCategory" className="flex items-center gap-2">
                        <Briefcase className="size-4" />
                        Business Category
                      </Label>
                      <Select 
                        name="businessCategory" 
                        value={businessCategory}
                        onValueChange={setBusinessCategory}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <input type="hidden" name="businessCategory" value={businessCategory} />
                      {state?.errors?.businessCategory && (
                        <p className="text-sm text-destructive">{state.errors.businessCategory[0]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessDescription">
                        Business Description
                      </Label>
                      <Textarea
                        id="businessDescription"
                        name="businessDescription"
                        placeholder="Tell us about your business, what you sell, and your goals..."
                        rows={3}
                      />
                      {state?.errors?.businessDescription && (
                        <p className="text-sm text-destructive">{state.errors.businessDescription[0]}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                        <Phone className="size-4" />
                        Phone Number (Optional)
                      </Label>
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                      />
                      {state?.errors?.phoneNumber && (
                        <p className="text-sm text-destructive">{state.errors.phoneNumber[0]}</p>
                      )}
                    </div>

                    {state?.errors?._form && (
                      <p className="text-sm text-destructive">{state.errors._form[0]}</p>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setStep(1)} 
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button type="submit" disabled={isPending} className="flex-1">
                        {isPending ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                      Your application will be reviewed by our team. 
                      You&apos;ll receive an email once approved.
                    </p>
                  </>
                )}
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
