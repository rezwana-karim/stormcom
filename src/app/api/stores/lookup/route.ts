import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Store lookup API for middleware subdomain routing
 * 
 * GET /api/stores/lookup?subdomain=vendor1&domain=vendor1.localhost
 * 
 * Returns minimal store data for routing decisions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get("subdomain");
    const domain = searchParams.get("domain");

    if (!subdomain && !domain) {
      return NextResponse.json(
        { error: "subdomain or domain required" },
        { status: 400 }
      );
    }

    // Build query conditions
    const conditions = [];
    
    if (subdomain) {
      conditions.push({ subdomain: subdomain });
    }
    
    if (domain) {
      conditions.push({ customDomain: domain });
    }

    // Query for store
    const store = await prisma.store.findFirst({
      where: {
        OR: conditions,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        subdomain: true,
        customDomain: true,
        organizationId: true,
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: store.id,
      slug: store.slug,
      name: store.name,
    });
  } catch (error) {
    console.error("[store-lookup] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
