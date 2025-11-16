import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StormCom - Multi-Tenant SaaS Platform",
    template: "%s | StormCom",
  },
  description: "Production-ready Next.js 16 SaaS boilerplate with authentication, multi-tenancy, and beautiful UI components.",
  keywords: ["Next.js", "React", "TypeScript", "SaaS", "Multi-tenant", "Authentication"],
  authors: [{ name: "StormCom Team" }],
  creator: "StormCom",
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "./",
    title: "StormCom - Multi-Tenant SaaS Platform",
    description: "Production-ready Next.js 16 SaaS boilerplate",
    siteName: "StormCom",
  },
  twitter: {
    card: "summary_large_image",
    title: "StormCom - Multi-Tenant SaaS Platform",
    description: "Production-ready Next.js 16 SaaS boilerplate",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors closeButton position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
