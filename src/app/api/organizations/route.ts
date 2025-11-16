/**
 * API Route: Create Organization
 * POST /api/organizations
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createSlug, ensureUniqueSlug } from "@/lib/multi-tenancy";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const createOrgSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50).optional(),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const session = await getServerSession(authOptions);
    const identifier = getClientIdentifier(request, session?.user?.id);
    const rateLimitResponse = await checkRateLimit(identifier, 5, 60000);
    if (rateLimitResponse) return rateLimitResponse;

    // Authentication check
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = createOrgSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, slug: providedSlug } = validation.data;

    // Generate and ensure unique slug
    const baseSlug = providedSlug || createSlug(name);
    const slug = await ensureUniqueSlug(baseSlug);

    // Create organization with user as owner
    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        memberships: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        memberships: {
          where: { userId: session.user.id },
        },
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error("Organization creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organizations = await prisma.organization.findMany({
      where: {
        memberships: {
          some: { userId: session.user.id },
        },
      },
      include: {
        memberships: {
          where: { userId: session.user.id },
          select: { role: true },
        },
        _count: {
          select: { memberships: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error("Organizations fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
