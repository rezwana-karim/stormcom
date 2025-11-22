/**
 * Invoice PDF Generation API Route
 * GET /api/orders/:id/invoice
 * 
 * @description Generates and returns a PDF invoice for a specific order
 * @access Store Admin, Super Admin
 * 
 * TODO: Install PDF generation library (options):
 *   - puppeteer: HTML→PDF (most flexible, best formatting)
 *   - @react-pdf/renderer: React components → PDF
 *   - jspdf: JavaScript PDF generation
 *   - pdfkit: Low-level PDF creation
 * 
 * Current implementation uses placeholder PDF with metadata structure.
 * Replace generatePDFBuffer() with actual PDF library implementation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/lib/services/order.service';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extract params
    const { id: orderId } = await context.params;

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get storeId from session (for multi-tenant isolation)
    type UserWithStoreId = typeof session.user & { storeId?: string };
    const storeId = (session.user as UserWithStoreId).storeId;

    // Get invoice data
    const orderService = OrderService.getInstance();
    const invoiceData = await orderService.getInvoiceData(orderId, storeId);

    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Order not found or access denied' },
        { status: 404 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generatePDFBuffer(invoiceData);

    // Return PDF with proper headers
    const filename = `invoice-${invoiceData.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfUint8Array.length.toString(),
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });

  } catch (error) {
    console.error('[GET /api/orders/[id]/invoice] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

/**
 * Generate PDF buffer from invoice data
 * 
 * TODO: Replace this placeholder implementation with actual PDF generation
 * 
 * Recommended approach for StormCom:
 * 1. Create HTML invoice template in src/components/invoices/invoice-template.tsx
 * 2. Use puppeteer to render HTML → PDF server-side
 * 3. Benefits: Full CSS styling, print-optimized layouts, easy to maintain
 */
async function generatePDFBuffer(invoiceData: Awaited<ReturnType<typeof OrderService.prototype.getInvoiceData>>): Promise<Buffer> {
  if (!invoiceData) {
    throw new Error('Invoice data is required');
  }

  // Placeholder PDF with metadata structure
  const placeholderPDF = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 300 >>
stream
BT
/F1 24 Tf
50 750 Td
(INVOICE - ${invoiceData.orderNumber}) Tj
/F1 12 Tf
50 720 Td
(Store: ${invoiceData.store.name}) Tj
50 700 Td
(Customer: ${invoiceData.customer ? `${invoiceData.customer.firstName} ${invoiceData.customer.lastName}` : 'N/A'}) Tj
50 680 Td
(Total: $${invoiceData.totalAmount.toFixed(2)}) Tj
50 660 Td
(Status: ${invoiceData.paymentStatus}) Tj
50 640 Td
(Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}) Tj
50 600 Td
(This is a placeholder PDF. Implement with puppeteer or @react-pdf/renderer.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000308 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
658
%%EOF`;

  return Buffer.from(placeholderPDF, 'utf-8');
}
