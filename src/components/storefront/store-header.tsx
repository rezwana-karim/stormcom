"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/stores/cart-store";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
}

interface StoreHeaderProps {
  store: {
    name: string;
    slug: string;
    logo?: string | null;
    description?: string | null;
  };
  categories?: Category[];
}

/**
 * Store header component with navigation menu
 * Used in storefront pages for consistent navigation
 */
export function StoreHeader({ store, categories = [] }: StoreHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartBadgeKey, setCartBadgeKey] = useState(0);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  
  // Use proper Zustand selectors for reactive updates
  // Subscribe to items array directly to trigger re-renders on cart changes
  const items = useCart((state) => state.items);
  const setStoreSlug = useCart((state) => state.setStoreSlug);
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Initialize store slug - loads cart from localStorage for this store
  useEffect(() => {
    setStoreSlug(store.slug);
  }, [store.slug, setStoreSlug]);
  
  // Animate cart badge on count change
  useEffect(() => {
    if (cartCount > 0) {
      setCartBadgeKey(prev => prev + 1);
    }
  }, [cartCount]);
  
  // Close mobile menu on ESC key and handle outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Main Header */}
        <div className="flex items-center justify-between h-16">
          {/* Logo & Store Name */}
          <Link
            href={`/store/${store.slug}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.name}
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
                unoptimized
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {store.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="text-xl font-bold hidden sm:block">{store.name}</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href={`/store/${store.slug}`} className={navigationMenuTriggerStyle()}>
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href={`/store/${store.slug}/products`} className={navigationMenuTriggerStyle()}>
                    All Products
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {categories.length > 0 && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Categories</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {categories.slice(0, 8).map((category) => (
                        <li key={category.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={`/store/${store.slug}/categories/${category.slug}`}
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              )}
                            >
                              <div className="text-sm font-medium leading-none">
                                {category.name}
                              </div>
                              {category.description && (
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {category.description}
                                </p>
                              )}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                      {categories.length > 8 && (
                        <li>
                          <NavigationMenuLink asChild>
                            <Link
                              href={`/store/${store.slug}/categories`}
                              className={cn(
                                "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              )}
                            >
                              <div className="text-sm font-medium leading-none text-primary">
                                View All Categories →
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      )}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden sm:flex"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Button>

            {/* Cart Button with Badge */}
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href={`/store/${store.slug}/cart`} aria-label={`Shopping cart, ${cartCount} items`}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span 
                    key={cartBadgeKey}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium animate-in zoom-in-50 duration-300"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
                <span className="sr-only">Cart ({cartCount} items)</span>
              </Link>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Menu</span>
            </Button>
          </div>
        </div>

        {/* Search Bar (Expandable) */}
        {searchOpen && (
          <div className="py-3 border-t">
            <form
              action={`/store/${store.slug}/products`}
              method="get"
              className="flex gap-2"
            >
              <Input
                type="text"
                name="q"
                placeholder="Search products..."
                className="flex-1"
                autoFocus
              />
              <Button type="submit">Search</Button>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav 
            ref={mobileMenuRef}
            className="lg:hidden py-4 border-t"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/store/${store.slug}`}
                  className="block py-2 text-sm font-medium hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${store.slug}/products`}
                  className="block py-2 text-sm font-medium hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  All Products
                </Link>
              </li>
              {categories.length > 0 && (
                <>
                  <li className="pt-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Categories
                    </span>
                  </li>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/store/${store.slug}/categories/${category.slug}`}
                        className="block py-2 text-sm hover:text-primary pl-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </>
              )}
              <li className="pt-4 border-t">
                <form
                  action={`/store/${store.slug}/products`}
                  method="get"
                  className="flex gap-2"
                >
                  <Input
                    type="text"
                    name="q"
                    placeholder="Search products..."
                    className="flex-1"
                  />
                  <Button type="submit" size="sm">
                    Search
                  </Button>
                </form>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
