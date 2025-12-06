import { TruckIcon, Shield, Star, Package, CreditCard, Headphones } from "lucide-react";
import type { TrustBadgesConfig } from "@/types/storefront-config";

interface TrustBadgesProps {
  config: TrustBadgesConfig;
}

/**
 * Trust Badges Section
 * Displays trust indicators like free shipping, secure payment, etc.
 * Configurable badges with icons, titles, and descriptions
 */
export function TrustBadges({ config }: TrustBadgesProps) {
  if (!config.enabled || config.badges.length === 0) {
    return null;
  }

  // Map icon names to Lucide icons
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    truck: TruckIcon,
    shield: Shield,
    star: Star,
    package: Package,
    'credit-card': CreditCard,
    headphones: Headphones,
  };

  return (
    <section className="border-y bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-center">
          {config.badges.map((badge, index) => {
            const Icon = iconMap[badge.icon] || Package;
            
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <Icon className="h-8 w-8 text-primary" />
                <h3 className="font-semibold">{badge.title}</h3>
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
