/**
 * GDPR Data Export API
 * 
 * GET /api/gdpr/export - Export user data for GDPR compliance
 * 
 * @module api/gdpr/export
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Verify user has permission to export data
    if (userId !== session.user.id) {
      // In production, check if user is admin
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: true,
        sessions: true,
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare GDPR export data
    const exportData = {
      personal_information: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accounts: user.accounts.map((account) => ({
        provider: account.provider,
        type: account.type,
        createdAt: account.createdAt,
      })),
      sessions: user.sessions.map((session) => ({
        expires: session.expires,
        createdAt: session.createdAt,
      })),
      organizations: user.memberships.map((membership) => ({
        name: membership.organization.name,
        role: membership.role,
        joinedAt: membership.createdAt,
      })),
      export_info: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.id,
        format: 'JSON',
      },
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-export-${userId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('GDPR export error:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}
