"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  slug: string;
}

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  storeSlug: string;
  className?: string;
}

/**
 * Advanced product filters sidebar
 * Features: search, category filter, brand filter, price range, active filters
 */
export function ProductFilters({
  categories,
  brands,
  storeSlug,
  className,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || ""
  );

  const selectedCategory = searchParams.get("category");
  const selectedBrand = searchParams.get("brand");
  const currentQuery = searchParams.get("q");

  // Debounced search - waits 300ms after user stops typing
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const debouncedSearch = useCallback((value: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      params.delete("page"); // Reset to page 1
      
      const query = params.toString();
      router.push(`/store/${storeSlug}/products${query ? `?${query}` : ""}`);
    }, 300);
    
    setSearchTimeout(timeout);
  }, [searchParams, storeSlug, router]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Build filter URL
  const buildUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Reset to page 1 when filters change
    params.delete("page");

    const query = params.toString();
    return `/store/${storeSlug}/products${query ? `?${query}` : ""}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediate search on form submit
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    router.push(buildUrl({ q: searchQuery || null }));
  };
  
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const clearFilters = () => {
    setSearchQuery("");
    router.push(`/store/${storeSlug}/products`);
  };

  const hasActiveFilters =
    selectedCategory || selectedBrand || currentQuery;

  return (
    <aside className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {currentQuery && (
            <Badge variant="secondary" className="pr-1">
              Search: {currentQuery}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1 hover:bg-transparent"
                onClick={() => router.push(buildUrl({ q: null }))}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {selectedCategory && (
            <Badge variant="secondary" className="pr-1">
              Category: {categories.find((c) => c.slug === selectedCategory)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1 hover:bg-transparent"
                onClick={() => router.push(buildUrl({ category: null }))}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {selectedBrand && (
            <Badge variant="secondary" className="pr-1">
              Brand: {brands.find((b) => b.slug === selectedBrand)?.name}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1 hover:bg-transparent"
                onClick={() => router.push(buildUrl({ brand: null }))}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      <Separator />

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Products</Label>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            id="search"
            type="text"
            placeholder="Search... (auto-searches as you type)"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1"
            aria-label="Search products"
          />
          <Button type="submit" size="icon" aria-label="Search products">
            <Search className="h-4 w-4" />
            <span className="sr-only">Search</span>
          </Button>
        </form>
      </div>

      <Separator />

      {/* Categories */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <Label>Categories</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <Button
              variant={!selectedCategory ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start font-normal"
              onClick={() => router.push(buildUrl({ category: null }))}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => router.push(buildUrl({ category: category.slug }))}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Brands */}
      {brands.length > 0 && (
        <div className="space-y-3">
          <Label>Brands</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <Button
              variant={!selectedBrand ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start font-normal"
              onClick={() => router.push(buildUrl({ brand: null }))}
            >
              All Brands
            </Button>
            {brands.map((brand) => (
              <Button
                key={brand.id}
                variant={selectedBrand === brand.slug ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start font-normal"
                onClick={() => router.push(buildUrl({ brand: brand.slug }))}
              >
                {brand.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
