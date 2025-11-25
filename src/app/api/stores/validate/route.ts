import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Store validation endpoint for middleware
 * GET /api/stores/validate?slug=store-slug
 * 
 * Used internally by middleware to validate store existence
 */
export async function GET(request: NextRequest) {
  // Only allow internal middleware requests
  const isMiddlewareRequest = request.headers.get("x-middleware-request") === "true";
  
  const searchParams = request.nextUrl.searchParams;
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "Slug parameter is required" },
      { status: 400 }
    );
  }

  try {
    const store = await prisma.store.findUnique({
      where: { 
        slug,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Return store info
    // For non-middleware requests, return limited info
    if (isMiddlewareRequest) {
      return NextResponse.json({
        storeId: store.id,
        storeName: store.name,
        slug: store.slug,
      });
    }

    // Public response with less info
    return NextResponse.json({
      slug: store.slug,
      name: store.name,
    });
  } catch (error) {
    console.error("Store validation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
