// src/lib/services/checkout.service.ts
// Checkout Service - Handles cart validation, shipping calculation, and order creation

import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, ProductStatus, PaymentMethod, PaymentGateway } from '@prisma/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Cart item structure for checkout validation
 */
export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

/**
 * Shipping address for calculation and storage
 */
export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

/**
 * Shipping option returned by calculation
 */
export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  cost: number;
  estimatedDays: string;
}

/**
 * Validated cart result with product details
 */
export interface ValidatedCart {
  isValid: boolean;
  errors: string[];
  items: ValidatedCartItem[];
  subtotal: number;
}

export interface ValidatedCartItem {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  image?: string;
  price: number;
  quantity: number;
  availableStock: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

/**
 * Order creation input
 */
export interface CreateOrderInput {
  storeId: string;
  customerId?: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  shippingMethod: string;
  shippingCost: number;
  discountCode?: string;
  customerNote?: string;
  ipAddress?: string;
  paymentMethod?: string;
  paymentGateway?: string;
}

/**
 * Created order result
 */
export interface CreatedOrder {
  id: string;
  orderNumber: string;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  items: {
    id: string;
    productName: string;
    variantName?: string;
    sku: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class CheckoutService {
  private static instance: CheckoutService;

  private constructor() {}

  public static getInstance(): CheckoutService {
    if (!CheckoutService.instance) {
      CheckoutService.instance = new CheckoutService();
    }
    return CheckoutService.instance;
  }

  /**
   * Validate cart items and check stock availability
   * OPTIMIZED: Batch-fetch all products in single query
   */
  async validateCart(storeId: string, items: CartItem[]): Promise<ValidatedCart> {
    const errors: string[] = [];
    const validatedItems: ValidatedCartItem[] = [];
    let subtotal = 0;

    if (items.length === 0) {
      return {
        isValid: false,
        errors: ['Cart is empty'],
        items: [],
        subtotal: 0,
      };
    }

    // Extract all product IDs and variant IDs from cart
    const productIds = items.map(item => item.productId);
    const variantIds = items.filter(item => item.variantId).map(item => item.variantId!);

    // Batch-fetch ALL products with variants in single query
    const products = await prisma.product.findMany({where: {
        id: { in: productIds },
        storeId,
        status: ProductStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        thumbnailUrl: true,
        inventoryQty: true,
        trackInventory: true,
        variants: variantIds.length > 0 ? {
          where: { id: { in: variantIds } },
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            inventoryQty: true,
          },
        } : undefined,
      },
    });

    // Create lookup maps for O(1) access
    const productMap = new Map(products.map(p => [p.id, p]));
    type VariantType = { id: string; name: string; sku: string; price: number; inventoryQty: number };
    const variantMap = new Map<string, VariantType>();
    products.forEach(p => {
      if (p.variants) {
        (p.variants as VariantType[]).forEach((v: VariantType) => variantMap.set(v.id, v));
      }
    });

    // Validate each cart item using cached data
    for (const item of items) {
      const product = productMap.get(item.productId);

      if (!product) {
        errors.push(`Product ${item.productId} not found or unavailable`);
        continue;
      }

      // Check variant if specified
      const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
      if (item.variantId && !variant) {
        errors.push(`Variant ${item.variantId} not found for product ${product.name}`);
        continue;
      }

      // Determine stock and price
      const availableStock = variant?.inventoryQty ?? product.inventoryQty;
      const price = variant?.price ?? product.price;
      const trackInventory = product.trackInventory;

      // Validate quantity
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for ${product.name}`);
        continue;
      }

      // Check stock only if inventory tracking is enabled
      if (trackInventory && item.quantity > availableStock) {
        errors.push(
          `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
        );
        continue;
      }

      // Calculate item subtotal
      const itemSubtotal = price * item.quantity;
      subtotal += itemSubtotal;

      // Add validated item
      validatedItems.push({
        productId: product.id,
        variantId: variant?.id,
        productName: product.name,
        variantName: variant?.name,
        sku: variant?.sku ?? product.sku,
        image: product.thumbnailUrl ?? undefined,
        price,
        quantity: item.quantity,
        availableStock,
        subtotal: itemSubtotal,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: itemSubtotal,
      });
    }

    return {
      isValid: errors.length === 0 && validatedItems.length > 0,
      errors,
      items: validatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  /**
   * Calculate shipping options based on address and cart weight
   */
  async calculateShipping(
    _storeId: string,
    shippingAddress: ShippingAddress,
    cartItems: CartItem[]
  ): Promise<ShippingOption[]> {
    // TODO: Integrate with real shipping API (e.g., Shippo, EasyPost)
    const isDomestic = shippingAddress.country === 'BD' || shippingAddress.country === 'US';
    const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const options: ShippingOption[] = [
      {
        id: 'standard',
        name: isDomestic ? 'Standard Shipping' : 'International Standard',
        description: isDomestic ? '5-7 business days' : '10-15 business days',
        cost: isDomestic ? 5.99 : 15.99,
        estimatedDays: isDomestic ? '5-7 days' : '10-15 days',
      },
      {
        id: 'express',
        name: isDomestic ? 'Express Shipping' : 'International Express',
        description: isDomestic ? '2-3 business days' : '5-7 business days',
        cost: isDomestic ? 12.99 : 29.99,
        estimatedDays: isDomestic ? '2-3 days' : '5-7 days',
      },
    ];

    // Add free shipping for domestic orders over $50
    if (isDomestic && cartSubtotal >= 50) {
      options.push({
        id: 'free',
        name: 'Free Shipping',
        description: '7-10 business days',
        cost: 0,
        estimatedDays: '7-10 days',
      });
    }

    return options;
  }

  /**
   * Calculate tax amount based on address and subtotal
   */
  calculateTax(shippingAddress: ShippingAddress, subtotal: number): number {
    // TODO: Integrate with real tax API (e.g., TaxJar, Avalara)
    // Simple state-based tax rates for US
    const stateTaxRates: Record<string, number> = {
      CA: 0.0725, // California
      NY: 0.08, // New York
      TX: 0.0625, // Texas
      FL: 0.06, // Florida
      BD: 0.15, // Bangladesh (15% VAT)
    };

    const taxRate = stateTaxRates[shippingAddress.state ?? shippingAddress.country] ?? 0;
    return Math.round(subtotal * taxRate * 100) / 100;
  }

  /**
   * Generate unique order number for store
   */
  async generateOrderNumber(storeId: string): Promise<string> {
    const orderCount = await prisma.order.count({
      where: { storeId },
    });

    const orderNum = (orderCount + 1).toString().padStart(5, '0');
    return `ORD-${orderNum}`;
  }

  /**
   * Create order with items in transaction
   */
  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    // Validate cart first
    const validated = await this.validateCart(input.storeId, input.items);
    if (!validated.isValid) {
      throw new Error(`Cart validation failed: ${validated.errors.join(', ')}`);
    }

    // Calculate totals
    const subtotal = validated.subtotal;
    const taxAmount = this.calculateTax(input.shippingAddress, subtotal);
    const shippingAmount = input.shippingCost;
    const discountAmount = 0; // TODO: Apply discount code
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    // Generate order number
    const orderNumber = await this.generateOrderNumber(input.storeId);

    // Create order with items in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          storeId: input.storeId,
          customerId: input.customerId,
          orderNumber,
          status: OrderStatus.PENDING,
          shippingAddress: JSON.stringify(input.shippingAddress),
          billingAddress: JSON.stringify(input.billingAddress || input.shippingAddress),
          subtotal,
          taxAmount,
          shippingAmount,
          discountAmount,
          totalAmount,
          discountCode: input.discountCode,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: input.paymentMethod ? (input.paymentMethod as PaymentMethod) : null,
          paymentGateway: input.paymentGateway ? (input.paymentGateway as PaymentGateway) : null,
          shippingMethod: input.shippingMethod,
          customerNote: input.customerNote,
          ipAddress: input.ipAddress,
        },
      });

      // Create order items
      const orderItems = await Promise.all(
        validated.items.map((item) =>
          tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              image: item.image,
              price: item.price,
              quantity: item.quantity,
              subtotal: item.subtotal,
              taxAmount: item.taxAmount,
              discountAmount: item.discountAmount,
              totalAmount: item.totalAmount,
            },
          })
        )
      );

      // Reduce inventory for each item with audit trail
      for (const item of validated.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { 
            inventoryQty: true, 
            lowStockThreshold: true,
            trackInventory: true,
          },
        });

        if (!product || !product.trackInventory) {
          continue; // Skip inventory update for non-tracked products
        }

        if (item.variantId) {
          // Update variant inventory
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              inventoryQty: {
                decrement: item.quantity,
              },
            },
          });
        } else {
          // Calculate new quantity
          const newQty = product.inventoryQty - item.quantity;
          
          // Determine new inventory status
          let newStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
          if (newQty === 0) {
            newStatus = 'OUT_OF_STOCK';
          } else if (newQty <= product.lowStockThreshold) {
            newStatus = 'LOW_STOCK';
          }

          // Update product stock and status
          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventoryQty: newQty,
              inventoryStatus: newStatus,
            },
          });
        }

        // Create inventory log entry for audit trail
        await tx.inventoryLog.create({
          data: {
            storeId: input.storeId,
            productId: item.productId,
            previousQty: product.inventoryQty,
            newQty: product.inventoryQty - item.quantity,
            changeQty: -item.quantity,
            reason: 'order_created',
            note: `Order ${newOrder.orderNumber}`,
            orderId: newOrder.id,
          },
        });
      }

      return { ...newOrder, items: orderItems };
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      shippingAmount: Number(order.shippingAmount),
      discountAmount: Number(order.discountAmount),
      totalAmount: Number(order.totalAmount),
      status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        variantName: item.variantName ?? undefined,
        sku: item.sku,
        price: Number(item.price),
        quantity: item.quantity,
        subtotal: Number(item.subtotal),
      })),
    };
  }
}
