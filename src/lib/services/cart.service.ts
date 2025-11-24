// src/lib/services/cart.service.ts
// Cart Service - Handles shopping cart operations with database persistence

import { prisma } from '@/lib/prisma';
import { ProductStatus, InventoryStatus } from '@prisma/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CartWithItems {
  id: string;
  userId: string | null;
  sessionId: string | null;
  storeId: string;
  items: CartItemWithProduct[];
  itemCount: number;
  subtotal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemWithProduct {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  productName: string;
  variantName: string | null;
  sku: string;
  image: string | null;
  availableStock: number;
  maxQuantity: number;
}

export interface AddToCartInput {
  storeId: string;
  productId: string;
  variantId?: string;
  quantity?: number;
  userId?: string;
  sessionId?: string;
}

export interface UpdateCartItemInput {
  cartItemId: string;
  quantity: number;
  userId?: string;
  sessionId?: string;
}

// ============================================================================
// CART SERVICE
// ============================================================================

export class CartService {
  /**
   * Get or create cart for user or session
   */
  static async getOrCreateCart(
    storeId: string,
    userId?: string,
    sessionId?: string
  ): Promise<CartWithItems> {
    if (!userId && !sessionId) {
      throw new Error('Either userId or sessionId is required');
    }

    // Find existing cart
    let cart = await prisma.cart.findFirst({
      where: {
        storeId,
        ...(userId ? { userId } : { sessionId }),
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: true,
              },
            },
            variant: true,
          },
        },
      },
    });

    // Create new cart if not found
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          storeId,
          userId: userId || null,
          sessionId: sessionId || null,
          expiresAt: !userId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 30 days for guest carts
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  variants: true,
                },
              },
              variant: true,
            },
          },
        },
      });
    }

    return this.transformCart(cart);
  }

  /**
   * Add item to cart
   */
  static async addToCart(input: AddToCartInput): Promise<CartWithItems> {
    const { storeId, productId, variantId, quantity = 1, userId, sessionId } = input;

    // Validate product exists and is available
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
        status: ProductStatus.ACTIVE,
        deletedAt: null,
      },
      include: {
        variants: variantId ? { where: { id: variantId } } : true,
      },
    });

    if (!product) {
      throw new Error('Product not found or not available');
    }

    // If variant specified, validate it exists
    let variant = null;
    if (variantId) {
      variant = product.variants.find((v) => v.id === variantId);
      if (!variant) {
        throw new Error('Product variant not found');
      }
    }

    // Check stock availability
    const availableStock = variant ? variant.inventoryQty : product.inventoryQty;
    if (product.trackInventory && availableStock < quantity) {
      throw new Error(`Only ${availableStock} units available`);
    }

    // Get or create cart
    const cart = await this.getOrCreateCart(storeId, userId, sessionId);

    // Check if item already exists in cart
    const existingItem = cart.items.find(
      (item) => item.productId === productId && item.variantId === variantId
    );

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.trackInventory && availableStock < newQuantity) {
        throw new Error(`Only ${availableStock} units available`);
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity, updatedAt: new Date() },
      });
    } else {
      // Add new item
      const price = variant?.price || product.price;
      const images = JSON.parse(product.images || '[]');
      const image = variant?.image || images[0] || product.thumbnailUrl || null;

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
          price,
          productName: product.name,
          variantName: variant?.name || null,
          sku: variant?.sku || product.sku,
          image,
        },
      });
    }

    // Update cart activity
    await prisma.cart.update({
      where: { id: cart.id },
      data: { lastActivityAt: new Date() },
    });

    return this.getOrCreateCart(storeId, userId, sessionId);
  }

  /**
   * Update cart item quantity
   */
  static async updateCartItem(input: UpdateCartItemInput): Promise<CartWithItems> {
    const { cartItemId, quantity, userId, sessionId } = input;

    // Get cart item with cart and product info
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
        variant: true,
      },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    // Verify ownership
    if (userId && cartItem.cart.userId !== userId) {
      throw new Error('Unauthorized');
    }
    if (sessionId && cartItem.cart.sessionId !== sessionId) {
      throw new Error('Unauthorized');
    }

    // If quantity is 0, remove item
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItemId } });
    } else {
      // Check stock availability
      const availableStock = cartItem.variant
        ? cartItem.variant.inventoryQty
        : cartItem.product.inventoryQty;

      if (cartItem.product.trackInventory && availableStock < quantity) {
        throw new Error(`Only ${availableStock} units available`);
      }

      await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity, updatedAt: new Date() },
      });
    }

    // Update cart activity
    await prisma.cart.update({
      where: { id: cartItem.cart.id },
      data: { lastActivityAt: new Date() },
    });

    return this.getOrCreateCart(cartItem.cart.storeId, userId, sessionId);
  }

  /**
   * Remove item from cart
   */
  static async removeCartItem(
    cartItemId: string,
    userId?: string,
    sessionId?: string
  ): Promise<CartWithItems> {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new Error('Cart item not found');
    }

    // Verify ownership
    if (userId && cartItem.cart.userId !== userId) {
      throw new Error('Unauthorized');
    }
    if (sessionId && cartItem.cart.sessionId !== sessionId) {
      throw new Error('Unauthorized');
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });

    // Update cart activity
    await prisma.cart.update({
      where: { id: cartItem.cart.id },
      data: { lastActivityAt: new Date() },
    });

    return this.getOrCreateCart(cartItem.cart.storeId, userId, sessionId);
  }

  /**
   * Clear all items from cart
   */
  static async clearCart(
    storeId: string,
    userId?: string,
    sessionId?: string
  ): Promise<CartWithItems> {
    const cart = await prisma.cart.findFirst({
      where: {
        storeId,
        ...(userId ? { userId } : { sessionId }),
      },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await prisma.cart.update({
        where: { id: cart.id },
        data: { lastActivityAt: new Date() },
      });
    }

    return this.getOrCreateCart(storeId, userId, sessionId);
  }

  /**
   * Merge guest cart into user cart after login
   */
  static async mergeCarts(
    storeId: string,
    userId: string,
    sessionId: string
  ): Promise<CartWithItems> {
    const [userCart, guestCart] = await Promise.all([
      prisma.cart.findFirst({
        where: { storeId, userId },
        include: { items: true },
      }),
      prisma.cart.findFirst({
        where: { storeId, sessionId },
        include: { items: true },
      }),
    ]);

    if (!guestCart || !guestCart.items.length) {
      return this.getOrCreateCart(storeId, userId);
    }

    if (!userCart) {
      // Just assign guest cart to user
      await prisma.cart.update({
        where: { id: guestCart.id },
        data: { userId, sessionId: null },
      });
    } else {
      // Merge items from guest cart into user cart
      for (const guestItem of guestCart.items) {
        const existingItem = userCart.items.find(
          (item) =>
            item.productId === guestItem.productId &&
            item.variantId === guestItem.variantId
        );

        if (existingItem) {
          // Update quantity
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + guestItem.quantity },
          });
        } else {
          // Move item to user cart
          await prisma.cartItem.update({
            where: { id: guestItem.id },
            data: { cartId: userCart.id },
          });
        }
      }

      // Delete guest cart
      await prisma.cart.delete({ where: { id: guestCart.id } });
    }

    return this.getOrCreateCart(storeId, userId);
  }

  /**
   * Validate cart items (check stock, prices, availability)
   */
  static async validateCart(
    storeId: string,
    userId?: string,
    sessionId?: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
    cart: CartWithItems;
  }> {
    const cart = await this.getOrCreateCart(storeId, userId, sessionId);
    const errors: string[] = [];

    for (const item of cart.items) {
      // Check if product is still available
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          storeId,
          status: ProductStatus.ACTIVE,
          deletedAt: null,
        },
        include: {
          variants: item.variantId ? { where: { id: item.variantId } } : false,
        },
      });

      if (!product) {
        errors.push(`Product "${item.productName}" is no longer available`);
        continue;
      }

      // Check stock
      if (product.trackInventory) {
        if (item.availableStock < item.quantity) {
          errors.push(
            `Only ${item.availableStock} units of "${item.productName}" available (you have ${item.quantity} in cart)`
          );
        }
      }

      // Check price changes
      const currentPrice = item.variantId
        ? product.variants?.[0]?.price || product.price
        : product.price;

      if (currentPrice !== item.price) {
        errors.push(
          `Price of "${item.productName}" has changed from $${item.price} to $${currentPrice}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      cart,
    };
  }

  /**
   * Get cart item count
   */
  static async getCartCount(
    storeId: string,
    userId?: string,
    sessionId?: string
  ): Promise<number> {
    const cart = await prisma.cart.findFirst({
      where: {
        storeId,
        ...(userId ? { userId } : { sessionId }),
      },
      include: {
        items: {
          select: { quantity: true },
        },
      },
    });

    if (!cart) return 0;

    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Clean up expired guest carts (should be run as a cron job)
   */
  static async cleanupExpiredCarts(): Promise<number> {
    const result = await prisma.cart.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private static transformCart(cart: any): CartWithItems {
    const items: CartItemWithProduct[] = cart.items.map((item: any) => {
      const availableStock = item.variant
        ? item.variant.inventoryQty
        : item.product.inventoryQty;

      return {
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        productName: item.productName,
        variantName: item.variantName,
        sku: item.sku,
        image: item.image,
        availableStock,
        maxQuantity: item.product.trackInventory ? availableStock : 9999,
      };
    });

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      storeId: cart.storeId,
      items,
      itemCount,
      subtotal,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
