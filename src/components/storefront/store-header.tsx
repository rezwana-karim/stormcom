"use client";

import Link from "next/link";
import { Store, ShoppingCart, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/stores/cart-store";
import { cn } from "@/lib/utils";

interface StoreHeaderProps {
  storeName: string;
  storeSlug: string;
  storeLogo?: string | null;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export function StoreHeader({
  storeName,
  storeSlug,
  storeLogo,
  categories = [],
}: StoreHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const cartItemCount = useCartStore((state) => state.getStoreItemCount(storeSlug));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/store/${storeSlug}/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px]">
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                href={`/store/${storeSlug}`}
                className="text-lg font-semibold hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link
                href={`/store/${storeSlug}/products`}
                className="text-lg font-semibold hover:text-primary transition-colors"
              >
                All Products
              </Link>
              {categories.length > 0 && (
                <>
                  <div className="border-t pt-4 mt-2">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Categories
                    </span>
                  </div>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/store/${storeSlug}/products?category=${category.slug}`}
                      className="text-base hover:text-primary transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo/Store Name */}
        <Link
          href={`/store/${storeSlug}`}
          className="flex items-center gap-2 font-bold text-xl"
        >
          {storeLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storeLogo}
              alt={storeName}
              className="h-8 w-8 object-contain rounded"
            />
          ) : (
            <Store className="h-6 w-6" />
          )}
          <span className="hidden sm:inline">{storeName}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href={`/store/${storeSlug}`}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Home
          </Link>
          <Link
            href={`/store/${storeSlug}/products`}
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Products
          </Link>
          {categories.slice(0, 4).map((category) => (
            <Link
              key={category.id}
              href={`/store/${storeSlug}/products?category=${category.slug}`}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {/* Search & Cart */}
        <div className="flex items-center gap-2">
          {/* Search Toggle */}
          <div className={cn("hidden sm:flex items-center", isSearchOpen && "flex-1")}>
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
                <Input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-xs"
                  autoFocus
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            )}
          </div>

          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => {
              const query = prompt("Search products:");
              if (query?.trim()) {
                window.location.href = `/store/${storeSlug}/products?search=${encodeURIComponent(query)}`;
              }
            }}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Cart Button */}
          <Link href={`/store/${storeSlug}/cart`}>
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {cartItemCount > 99 ? "99+" : cartItemCount}
                </Badge>
              )}
              <span className="sr-only">Cart ({cartItemCount} items)</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
