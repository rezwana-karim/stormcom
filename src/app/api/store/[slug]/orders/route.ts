// src/app/api/store/[slug]/orders/route.ts
// Store-specific order creation API (guest checkout)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { InventoryStatus, OrderStatus, PaymentStatus } from '@prisma/client';
import { sendOrderConfirmationEmail } from '@/lib/email-service';
import { randomBytes } from 'crypto';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

const customerSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required'),
});

const orderItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  variantId: z.string().cuid('Invalid variant ID').optional(),
  quantity: z.number().int().positive('Quantity must be positive'),
  price: z.number().min(0, 'Price must be non-negative'),
});

const createOrderSchema = z.object({
  customer: customerSchema,
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  subtotal: z.number().min(0, 'Subtotal must be non-negative'),
  taxAmount: z.number().min(0, 'Tax amount must be non-negative'),
  shippingAmount: z.number().min(0, 'Shipping amount must be non-negative'),
  totalAmount: z.number().min(0, 'Total amount must be non-negative'),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique order number with format: ORD-YYYYMMDD-XXXX
 */
function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  // Use crypto.randomBytes for cryptographically secure random numbers
  const random = randomBytes(2).readUInt16BE(0) % 10000;
  const randomStr = random.toString().padStart(4, '0');

  return `ORD-${year}${month}${day}-${randomStr}`;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * POST /api/store/[slug]/orders
 * Create a new order (guest checkout)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // Step 1: Validate store exists and is active
    const store = await prisma.store.findUnique({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        subscriptionStatus: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    // Check if store is active
    if (store.subscriptionStatus !== 'ACTIVE' && store.subscriptionStatus !== 'TRIAL') {
      return NextResponse.json(
        { error: 'Store is not currently accepting orders' },
        { status: 403 }
      );
    }

    // Step 2: Validate all cart items exist and fetch product details
    const productIds = validatedData.items.map((item) => item.productId);
    const variantIds = validatedData.items
      .filter((item) => item.variantId)
      .map((item) => item.variantId!);

    const [products, variants] = await Promise.all([
      prisma.product.findMany({
        where: {
          id: { in: productIds },
          storeId: store.id,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true,
          inventoryQty: true,
          trackInventory: true,
          thumbnailUrl: true,
        },
      }),
      variantIds.length > 0
        ? prisma.productVariant.findMany({
            where: {
              id: { in: variantIds },
            },
            select: {
              id: true,
              productId: true,
              name: true,
              sku: true,
              price: true,
              inventoryQty: true,
            },
          })
        : Promise.resolve([]),
    ]);

    // Create lookup maps
    const productMap = new Map(products.map((p) => [p.id, p]));
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Step 3: Validate inventory and pricing
    const inventoryErrors: string[] = [];
    const pricingErrors: string[] = [];

    for (const item of validatedData.items) {
      const product = productMap.get(item.productId);

      if (!product) {
        inventoryErrors.push(`Product ${item.productId} not found or not available`);
        continue;
      }

      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant) {
          inventoryErrors.push(`Variant ${item.variantId} not found`);
          continue;
        }

        // Check variant inventory
        if (variant.inventoryQty < item.quantity) {
          inventoryErrors.push(
            `Insufficient stock for "${product.name} - ${variant.name}". Available: ${variant.inventoryQty}, Requested: ${item.quantity}`
          );
        }

        // Validate variant price
        const expectedPrice = variant.price ?? product.price;
        if (Math.abs(item.price - expectedPrice) > 0.01) {
          pricingErrors.push(
            `Price mismatch for "${product.name} - ${variant.name}". Expected: ${expectedPrice}, Received: ${item.price}`
          );
        }
      } else {
        // Check product inventory
        if (product.trackInventory && product.inventoryQty < item.quantity) {
          inventoryErrors.push(
            `Insufficient stock for "${product.name}". Available: ${product.inventoryQty}, Requested: ${item.quantity}`
          );
        }

        // Validate product price
        if (Math.abs(item.price - product.price) > 0.01) {
          pricingErrors.push(
            `Price mismatch for "${product.name}". Expected: ${product.price}, Received: ${item.price}`
          );
        }
      }
    }

    if (inventoryErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Inventory validation failed',
          details: inventoryErrors,
        },
        { status: 400 }
      );
    }

    if (pricingErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Price validation failed',
          details: pricingErrors,
        },
        { status: 400 }
      );
    }

    // Step 4: Validate order totals
    const calculatedSubtotal = validatedData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const calculatedTotal =
      validatedData.subtotal + validatedData.taxAmount + validatedData.shippingAmount;

    if (Math.abs(calculatedSubtotal - validatedData.subtotal) > 0.01) {
      return NextResponse.json(
        {
          error: 'Subtotal mismatch',
          details: `Expected: ${calculatedSubtotal}, Received: ${validatedData.subtotal}`,
        },
        { status: 400 }
      );
    }

    if (Math.abs(calculatedTotal - validatedData.totalAmount) > 0.01) {
      return NextResponse.json(
        {
          error: 'Total amount mismatch',
          details: `Expected: ${calculatedTotal}, Received: ${validatedData.totalAmount}`,
        },
        { status: 400 }
      );
    }

    // Step 5: Create or get customer
    let customer = await prisma.customer.findUnique({
      where: {
        storeId_email: {
          storeId: store.id,
          email: validatedData.customer.email,
        },
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          storeId: store.id,
          email: validatedData.customer.email,
          firstName: validatedData.customer.firstName,
          lastName: validatedData.customer.lastName,
          phone: validatedData.customer.phone,
        },
      });
    }

    // Step 6: Generate unique order number
    let orderNumber: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      orderNumber = generateOrderNumber();
      const existing = await prisma.order.findUnique({
        where: {
          storeId_orderNumber: {
            storeId: store.id,
            orderNumber,
          },
        },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique order number. Please try again.' },
        { status: 500 }
      );
    }

    // Step 7: Create order with items in a transaction
    // Note: Using longer timeout (30s) to accommodate inventory deduction for multiple items
    const order = await prisma.$transaction(
      async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            storeId: store.id,
            customerId: customer!.id,
            orderNumber: orderNumber!,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            subtotal: validatedData.subtotal,
            taxAmount: validatedData.taxAmount,
            shippingAmount: validatedData.shippingAmount,
            discountAmount: 0,
            totalAmount: validatedData.totalAmount,
            shippingAddress: JSON.stringify(validatedData.shippingAddress),
            billingAddress: JSON.stringify(validatedData.billingAddress),
            ipAddress:
              request.headers.get('x-forwarded-for') ||
              request.headers.get('x-real-ip') ||
              undefined,
            items: {
              create: validatedData.items.map((item) => {
                const product = productMap.get(item.productId)!;
                const variant = item.variantId
                  ? variantMap.get(item.variantId)
                  : undefined;

                return {
                  productId: item.productId,
                  variantId: item.variantId || null,
                  productName: product.name,
                  variantName: variant?.name || null,
                  sku: variant?.sku || product.sku,
                  image: product.thumbnailUrl || null,
                  price: item.price,
                  quantity: item.quantity,
                  subtotal: item.price * item.quantity,
                  taxAmount: 0, // Tax is calculated at order level
                  discountAmount: 0,
                  totalAmount: item.price * item.quantity,
                };
              }),
            },
          },
          include: {
            items: true,
            customer: true,
          },
        });

        // Step 8: Deduct inventory inline (avoiding nested transaction from InventoryService)
        // This prevents transaction timeout by keeping all operations in the same transaction
        for (const item of validatedData.items) {
          const product = productMap.get(item.productId)!;

          if (item.variantId) {
            // Variant-level deduction
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: {
                inventoryQty: true,
                lowStockThreshold: true,
                name: true,
              },
            });

            if (variant) {
              const newQty = variant.inventoryQty - item.quantity;

              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { inventoryQty: newQty },
              });

              await tx.inventoryLog.create({
                data: {
                  storeId: store.id,
                  productId: item.productId,
                  variantId: item.variantId,
                  orderId: newOrder.id,
                  previousQty: variant.inventoryQty,
                  newQty,
                  changeQty: -item.quantity,
                  reason: 'order_created',
                  note: `Order ${newOrder.orderNumber}`,
                },
              });
            }
          } else {
            // Product-level deduction
            const currentProduct = await tx.product.findUnique({
              where: { id: item.productId },
              select: {
                inventoryQty: true,
                lowStockThreshold: true,
                inventoryStatus: true,
              },
            });

            if (currentProduct && product.trackInventory) {
              const newQty = currentProduct.inventoryQty - item.quantity;
              const newStatus =
                newQty === 0
                  ? 'OUT_OF_STOCK'
                  : newQty <= currentProduct.lowStockThreshold
                    ? 'LOW_STOCK'
                    : 'IN_STOCK';

              await tx.product.update({
                where: { id: item.productId },
                data: {
                  inventoryQty: newQty,
                  inventoryStatus: newStatus,
                },
              });

              await tx.inventoryLog.create({
                data: {
                  storeId: store.id,
                  productId: item.productId,
                  orderId: newOrder.id,
                  previousQty: currentProduct.inventoryQty,
                  newQty,
                  changeQty: -item.quantity,
                  reason: 'order_created',
                  note: `Order ${newOrder.orderNumber}`,
                },
              });
            }
          }
        }

        // Update customer stats
        await tx.customer.update({
          where: { id: customer!.id },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: validatedData.totalAmount },
            averageOrderValue:
              (customer!.totalSpent + validatedData.totalAmount) /
              (customer!.totalOrders + 1),
            lastOrderAt: new Date(),
          },
        });

        return newOrder;
      },
      {
        timeout: 30000, // 30 second timeout for complex orders
        maxWait: 10000, // 10 second max wait for transaction to start
      }
    );

    // Step 9: Send order confirmation email (non-blocking)
    sendOrderConfirmationEmail(validatedData.customer.email, {
      customerName: `${validatedData.customer.firstName} ${validatedData.customer.lastName}`,
      orderNumber: orderNumber!,
      orderTotal: formatCurrency(validatedData.totalAmount, store.currency),
      orderItems: validatedData.items.map((item) => {
        const product = productMap.get(item.productId)!;
        const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
        const itemName = variant ? `${product.name} - ${variant.name}` : product.name;

        return {
          name: itemName,
          quantity: item.quantity,
          price: formatCurrency(item.price * item.quantity, store.currency),
        };
      }),
      shippingAddress: validatedData.shippingAddress,
      storeName: store.name,
    }).catch((error) => {
      console.error('Failed to send order confirmation email:', error);
      // Don't fail the order creation if email fails
    });

    // Step 10: Return success response
    return NextResponse.json(
      {
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/store/[slug]/orders error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle database errors
    if (error instanceof Error) {
      // Check for inventory errors (thrown by InventoryService)
      if (error.message.includes('Insufficient stock')) {
        return NextResponse.json(
          {
            error: 'Inventory error',
            details: error.message,
          },
          { status: 400 }
        );
      }

      // Check for unique constraint violations
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          {
            error: 'Order number conflict. Please try again.',
          },
          { status: 409 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
