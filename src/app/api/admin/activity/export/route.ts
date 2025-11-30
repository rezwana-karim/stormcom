/**
 * Activity Export API
 * 
 * Exports platform activities to CSV format.
 * Super Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is super admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isSuperAdmin: true },
  });

  if (!user?.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const actorId = searchParams.get("actor");
  const storeId = searchParams.get("store");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Build filter conditions
  const where: Record<string, unknown> = {};

  if (action) {
    where.action = action;
  }

  if (actorId) {
    where.actorId = actorId;
  }

  if (storeId) {
    where.storeId = storeId;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      (where.createdAt as Record<string, Date>).gte = new Date(from);
    }
    if (to) {
      (where.createdAt as Record<string, Date>).lte = new Date(to);
    }
  }

  try {
    const activities = await prisma.platformActivity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, name: true, email: true } },
        targetUser: { select: { id: true, name: true, email: true } },
        store: { select: { id: true, name: true } },
      },
      take: 10000, // Limit export size
    });

    // Generate CSV
    const headers = [
      "ID",
      "Action",
      "Description",
      "Actor Name",
      "Actor Email",
      "Target User Name",
      "Target User Email",
      "Store Name",
      "IP Address",
      "Created At",
    ];

    const rows = activities.map((activity) => [
      activity.id,
      activity.action,
      (activity.description || "").replace(/"/g, '""'),
      activity.actor?.name || "",
      activity.actor?.email || "",
      activity.targetUser?.name || "",
      activity.targetUser?.email || "",
      activity.store?.name || "",
      activity.ipAddress || "",
      activity.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="activity-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Failed to export activities:", error);
    return NextResponse.json(
      { error: "Failed to export activities" },
      { status: 500 }
    );
  }
}
