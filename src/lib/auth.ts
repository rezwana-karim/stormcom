import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { Resend } from "resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const fromEmail = process.env.EMAIL_FROM ?? "no-reply@example.com";
const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  providers: [
    // Email magic link provider (for production)
    EmailProvider({
      from: fromEmail,
      async sendVerificationRequest({ identifier, url }) {
        const { host } = new URL(url);
        if (!process.env.RESEND_API_KEY) {
          console.warn(`[auth] RESEND_API_KEY not set. Dev magic link for ${identifier}: ${url}`);
          return;
        }
        const result = await resend.emails.send({
          from: fromEmail,
          to: identifier,
          subject: `Sign in to ${host}`,
          html: `<!doctype html><html><body><p>Sign in to <strong>${host}</strong></p><p><a href="${url}">Click here to sign in</a></p><p>If you did not request this, you can safely ignore this email.</p></body></html>`,
          text: `Sign in to ${host}\n${url}\n\n`,
        });
        if (result.error) {
          throw new Error(result.error.message);
        }
      },
      normalizeIdentifier(identifier) {
        const [local, domain] = identifier.toLowerCase().trim().split("@");
        if (domain === "gmail.com") return `${local.replace(/\./g, "")}@${domain}`;
        return `${local}@${domain}`;
      },
    }),
    // Password authentication provider (for development and testing)
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required");
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // Return user object
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-email",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token?.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
      }
      return session;
    },
  },
};
