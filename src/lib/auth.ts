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

        // Verify password with timing-safe comparison
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // Check account status - only allow APPROVED users and Super Admins to sign in
        if (!user.isSuperAdmin && user.accountStatus !== 'APPROVED') {
          if (user.accountStatus === 'PENDING') {
            throw new Error("Your account is pending approval. Please wait for admin review.");
          }
          if (user.accountStatus === 'REJECTED') {
            throw new Error("Your account application was not approved. Please contact support.");
          }
          if (user.accountStatus === 'SUSPENDED') {
            throw new Error("Your account has been suspended. Please contact support.");
          }
          if (user.accountStatus === 'DELETED') {
            throw new Error("This account has been deleted.");
          }
        }

        // Return user object with isSuperAdmin field
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isSuperAdmin: user.isSuperAdmin || false,
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
        const userId = token.sub;
        (session.user as typeof session.user & { id: string }).id = userId;

        // Fetch user roles and permissions
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            memberships: {
              include: {
                organization: {
                  include: { store: true },
                },
              },
            },
            storeStaff: {
              where: { isActive: true },
              include: { store: true },
            },
          },
        });

        if (user) {
          // Prioritize memberships: OWNER > ADMIN > MEMBER > VIEWER
          const rolePriority: Record<string, number> = {
            OWNER: 4,
            ADMIN: 3,
            MEMBER: 2,
            VIEWER: 1,
          };

          const sortedMemberships = [...user.memberships].sort((a, b) => {
            const priorityDiff = (rolePriority[b.role] || 0) - (rolePriority[a.role] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          // Prioritize store staff: STORE_ADMIN > others
          const storeRolePriority: Record<string, number> = {
            STORE_ADMIN: 4,
            SALES_MANAGER: 3,
            INVENTORY_MANAGER: 2,
            CUSTOMER_SERVICE: 1,
          };

          const sortedStoreStaff = [...user.storeStaff].sort((a, b) => {
            const priorityDiff = (storeRolePriority[b.role || ''] || 0) - (storeRolePriority[a.role || ''] || 0);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          const membership = sortedMemberships[0];
          const storeStaff = sortedStoreStaff[0];

          (session.user as any).isSuperAdmin = user.isSuperAdmin;
          (session.user as any).accountStatus = user.accountStatus;
          (session.user as any).organizationRole = membership?.role;
          (session.user as any).organizationId = membership?.organizationId;
          (session.user as any).storeRole = storeStaff?.role;
          (session.user as any).storeId = storeStaff?.storeId || membership?.organization?.store?.id;

          // Compute permissions
          const { getPermissions } = await import('./permissions');
          let permissions: string[] = [];
          
          if (user.isSuperAdmin) {
            permissions = ['*'];
          } else {
            const effectiveRole = storeStaff?.role || membership?.role;
            if (effectiveRole) {
              permissions = getPermissions(effectiveRole);
            }
          }
          
          (session.user as any).permissions = permissions;
        }
      }
      return session;
    },
  },
};
