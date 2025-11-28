/**
 * API Route: Invite Team Member
 * POST /api/organizations/[slug]/invite
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getOrganizationBySlug, isAdminOrOwner } from "@/lib/multi-tenancy";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const inviteSchema = z.object({
  email: z.string().email().max(254), // RFC 5321 max email length
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]), // Explicitly prevent OWNER
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Await params in Next.js 16+
    const { slug } = await params;

    // Rate limiting
    const session = await getServerSession(authOptions);
    const identifier = getClientIdentifier(request, session?.user?.id);
    const rateLimitResponse = await checkRateLimit(identifier, 10, 60000);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication check
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organization and check permissions
    const organization = await getOrganizationBySlug(slug, session.user.id);
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    if (!isAdminOrOwner(organization, session.user.id)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = inviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, role } = validation.data;

    // Check if user exists
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "User not found. They need to sign up first." },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: invitedUser.id,
          organizationId: organization.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 409 }
      );
    }

    // Note: OWNER role is already prevented by schema validation
    // The inviteSchema only allows: ["ADMIN", "MEMBER", "VIEWER"]

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId: invitedUser.id,
        organizationId: organization.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // TODO: Send invitation email via Resend

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    console.error("Team invitation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
