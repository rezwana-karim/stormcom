import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroConfig } from "@/types/storefront-config";
import type { StoreInfo } from "./types";

interface HeroSectionProps {
  store: StoreInfo;
  config: HeroConfig;
}

/**
 * Hero Section Component
 * Supports multiple styles: gradient, image, minimal
 * Configurable headline, subheadline, and CTA buttons
 */
export function HeroSection({ store, config }: HeroSectionProps) {
  const {
    style = 'gradient',
    headline,
    subheadline,
    primaryCta,
    secondaryCta,
    backgroundImage,
  } = config;

  // Base styles
  const baseClasses = "relative overflow-hidden";
  
  // Style-specific classes
  const styleClasses = {
    gradient: "bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
    image: "bg-cover bg-center bg-no-repeat",
    minimal: "bg-background",
  };

  return (
    <section 
      className={cn(baseClasses, styleClasses[style])}
      style={style === 'image' && backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined}
    >
      {/* Grid pattern overlay for gradient style */}
      {style === 'gradient' && (
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-size-[40px_40px]" />
      )}
      
      {/* Dark overlay for image style */}
      {style === 'image' && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      <div className="relative container mx-auto px-4 py-20 sm:py-28 lg:py-32">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          {/* Store Badge */}
          <Badge 
            variant="secondary" 
            className={cn(
              "text-sm",
              style === 'image' && "bg-white/90 text-black hover:bg-white"
            )}
          >
            Welcome to {store.name}
          </Badge>
          
          {/* Headline */}
          <h1 
            className={cn(
              "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight",
              style === 'image' && "text-white"
            )}
          >
            {headline || (
              <>
                Discover Amazing
                <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}Products{" "}
                </span>
                Today
              </>
            )}
          </h1>
          
          {/* Subheadline */}
          {subheadline && (
            <p 
              className={cn(
                "text-lg sm:text-xl max-w-2xl mx-auto",
                style === 'image' ? "text-white/90" : "text-muted-foreground"
              )}
            >
              {subheadline}
            </p>
          )}
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {primaryCta && (
              <Button asChild size="lg" className="text-base">
                <Link href={primaryCta.href}>
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {primaryCta.text}
                </Link>
              </Button>
            )}
            
            {secondaryCta && (
              <Button 
                asChild 
                size="lg" 
                variant={style === 'image' ? 'secondary' : 'outline'} 
                className="text-base"
              >
                <Link href={secondaryCta.href}>
                  {secondaryCta.text}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
