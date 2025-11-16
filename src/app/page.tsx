import Link from "next/link";
import { IconInnerShadowTop, IconRocket, IconShield, IconUsers } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <IconInnerShadowTop className="size-6" />
            <span className="text-xl font-bold">StormCom</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-8 py-24 md:py-32">
        <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:text-7xl">
            Build Your Multi-Tenant SaaS
            <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {" "}Faster Than Ever
            </span>
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
            A production-ready Next.js 16 SaaS boilerplate with authentication, 
            multi-tenancy, and beautiful UI components. Start building your product today.
          </p>
          <div className="flex gap-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                <IconRocket className="size-4" />
                Start Building
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-24">
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <IconShield className="size-10 text-primary" />
              <CardTitle>Secure by Default</CardTitle>
              <CardDescription>
                Built-in authentication with NextAuth.js, magic links, and session management
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <IconUsers className="size-10 text-primary" />
              <CardTitle>Multi-Tenancy Ready</CardTitle>
              <CardDescription>
                Complete organization and team management with role-based access control
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <IconInnerShadowTop className="size-10 text-primary" />
              <CardTitle>Modern Stack</CardTitle>
              <CardDescription>
                Next.js 16, React 19, TypeScript, Prisma, and shadcn/ui components
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            Built with Next.js 16 and shadcn/ui. Open source.
          </p>
        </div>
      </footer>
    </div>
  );
}
