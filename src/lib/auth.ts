import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

const fromEmail = process.env.EMAIL_FROM ?? "no-reply@example.com";
const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  providers: [
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
