/**
 * Multi-Tenancy Utilities
 * Helper functions for organization and membership management
 */

import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export interface OrganizationWithMemberships {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  memberships: {
    role: Role;
    userId: string;
  }[];
}

/**
 * Get current user's session or redirect to login
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

/**
 * Get organization by slug with user membership validation
 */
export async function getOrganizationBySlug(slug: string, userId: string) {
  const organization = await prisma.organization.findUnique({
    where: { slug },
    include: {
      memberships: {
        where: { userId },
        select: { role: true, userId: true },
      },
    },
  });

  if (!organization) {
    return null;
  }

  // Check if user is a member
  if (organization.memberships.length === 0) {
    return null;
  }

  return organization;
}

/**
 * Check if user has required role in organization
 */
export function hasRole(
  organization: OrganizationWithMemberships,
  userId: string,
  requiredRole: Role | Role[]
): boolean {
  const membership = organization.memberships.find((m) => m.userId === userId);
  if (!membership) return false;

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(membership.role);
}

/**
 * Get user's role in organization
 */
export function getUserRole(
  organization: OrganizationWithMemberships,
  userId: string
): Role | null {
  const membership = organization.memberships.find((m) => m.userId === userId);
  return membership?.role ?? null;
}

/**
 * Check if user is organization owner
 */
export function isOwner(
  organization: OrganizationWithMemberships,
  userId: string
): boolean {
  return hasRole(organization, userId, Role.OWNER);
}

/**
 * Check if user is admin or owner
 */
export function isAdminOrOwner(
  organization: OrganizationWithMemberships,
  userId: string
): boolean {
  return hasRole(organization, userId, [Role.OWNER, Role.ADMIN]);
}

/**
 * Get all organizations for a user
 */
export async function getUserOrganizations(userId: string) {
  return prisma.organization.findMany({
    where: {
      memberships: {
        some: { userId },
      },
    },
    include: {
      memberships: {
        where: { userId },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Create organization slug from name
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Ensure slug is unique
 */
export async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
