/**
 * Admin Reports API
 * 
 * Generate and manage system reports (admin only).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const generateReportSchema = z.object({
  type: z.enum(['sales', 'users', 'products', 'revenue', 'custom']),
  format: z.enum(['pdf', 'csv', 'xlsx', 'json']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
});

/**
 * GET /api/admin/reports
 * List available reports
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock reports list
    const reports = [
      {
        id: 'report_1',
        name: 'Monthly Sales Report',
        type: 'sales',
        format: 'pdf',
        status: 'completed',
        generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '2.4 MB',
        downloadUrl: '/api/admin/reports/report_1/download',
      },
      {
        id: 'report_2',
        name: 'User Growth Analysis',
        type: 'users',
        format: 'xlsx',
        status: 'completed',
        generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        fileSize: '1.8 MB',
        downloadUrl: '/api/admin/reports/report_2/download',
      },
      {
        id: 'report_3',
        name: 'Product Performance',
        type: 'products',
        format: 'csv',
        status: 'processing',
        generatedAt: new Date().toISOString(),
        fileSize: null,
        downloadUrl: null,
      },
    ];

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/reports
 * Generate a new report
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = generateReportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Mock report generation - In production, queue background job
    const report = {
      id: `report_${Date.now()}`,
      name: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Report`,
      type: data.type,
      format: data.format,
      status: 'processing',
      startDate: data.startDate,
      endDate: data.endDate,
      filters: data.filters,
      requestedBy: session.user.id,
      generatedAt: new Date().toISOString(),
    };

    console.log('Report generation queued (mock):', report);

    return NextResponse.json({ report, message: 'Report generation started' }, { status: 202 });
  } catch (error) {
    console.error('Generate report error:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
