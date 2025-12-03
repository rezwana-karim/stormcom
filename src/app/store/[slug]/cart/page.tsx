"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CartItemComponent } from "../components/cart-item";
import { EmptyState } from "../components/empty-state";
import { ShoppingBag, ArrowRight } from "lucide-react";

interface CartItem {
  key: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantSku?: string;
  price: number;
  quantity: number;
  thumbnailUrl?: string | null;
}

interface Cart {
  items: CartItem[];
}

/**
 * Shopping cart page with totals and checkout CTA
 * Cart state managed in localStorage
 */
export default function CartPage() {
  const params = useParams<{ slug: string }>();
  const storeSlug = params.slug;

  const [cart, setCart] = useState<Cart>({ items: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      const cartKey = `cart_${storeSlug}`;
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart));
        } catch (error) {
          console.error("Failed to parse cart:", error);
        }
      }
      setIsLoading(false);
    };

    loadCart();

    // Listen for cart updates
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [storeSlug]);

  // Save cart to localStorage
  const saveCart = (updatedCart: Cart) => {
    const cartKey = `cart_${storeSlug}`;
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    setCart(updatedCart);
    window.dispatchEvent(new CustomEvent("cartUpdated"));
  };

  // Handle quantity change
  const handleQuantityChange = (key: string, quantity: number) => {
    const updatedItems = cart.items.map((item) =>
      item.key === key ? { ...item, quantity } : item
    );
    saveCart({ items: updatedItems });
  };

  // Handle remove item
  const handleRemove = (key: string) => {
    const updatedItems = cart.items.filter((item) => item.key !== key);
    saveCart({ items: updatedItems });
  };

  // Calculate totals
  const subtotal = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const estimatedTax = subtotal * 0.1; // 10% tax estimate
  const estimatedShipping = subtotal > 50 ? 0 : 10; // Free shipping over $50
  const total = subtotal + estimatedTax + estimatedShipping;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <EmptyState
          icon={<ShoppingBag className="h-16 w-16" />}
          title="Your cart is empty"
          description="Looks like you haven't added anything to your cart yet."
          actionLabel="Start Shopping"
          actionHref={`/store/${storeSlug}/products`}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Shopping Cart</h1>
          <p className="text-muted-foreground">
            {cart.items.length} {cart.items.length === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cart Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {cart.items.map((item) => (
                    <CartItemComponent
                      key={item.key}
                      item={item}
                      storeSlug={storeSlug}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Button variant="outline" asChild>
                <Link href={`/store/${storeSlug}/products`}>
                  ← Continue Shopping
                </Link>
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>

                {/* Estimated Tax */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Tax</span>
                  <span className="font-medium">${estimatedTax.toFixed(2)}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {estimatedShipping === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${estimatedShipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                {/* Free Shipping Notice */}
                {subtotal < 50 && subtotal > 0 && (
                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                    Add ${(50 - subtotal).toFixed(2)} more to qualify for free shipping!
                  </div>
                )}

                <Separator />

                {/* Total */}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {/* Checkout Button */}
                <Button size="lg" className="w-full" asChild>
                  <Link href={`/store/${storeSlug}/checkout`}>
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>

                {/* Trust Badges */}
                <div className="pt-4 space-y-2 text-xs text-center text-muted-foreground">
                  <p>🔒 Secure Checkout</p>
                  <p>✓ 30-Day Returns</p>
                  <p>✓ Quality Guaranteed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
