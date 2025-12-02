import Link from "next/link";

interface StoreFooterProps {
  store: {
    name: string;
    slug: string;
    description?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    website?: string | null;
  };
}

/**
 * Store footer component
 * Displays store information and quick links
 */
export function StoreFooter({ store }: StoreFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t mt-auto bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Store Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">{store.name}</h3>
            {store.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {store.description}
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/store/${store.slug}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${store.slug}/products`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  href={`/store/${store.slug}/categories`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {store.email && (
                <li>
                  <a
                    href={`mailto:${store.email}`}
                    className="hover:text-primary transition-colors"
                  >
                    {store.email}
                  </a>
                </li>
              )}
              {store.phone && (
                <li>
                  <a
                    href={`tel:${store.phone}`}
                    className="hover:text-primary transition-colors"
                  >
                    {store.phone}
                  </a>
                </li>
              )}
              {store.address && (
                <li className="leading-relaxed">
                  {store.address}
                  {store.city && `, ${store.city}`}
                  {store.state && `, ${store.state}`}
                  {store.postalCode && ` ${store.postalCode}`}
                </li>
              )}
              {store.website && (
                <li>
                  <a
                    href={store.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    Visit Website
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Powered By */}
          <div className="space-y-4">
            <h3 className="font-semibold">Powered By</h3>
            <p className="text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">
                StormCom
              </Link>
              <br />
              <span className="text-xs">
                Multi-tenant E-commerce Platform
              </span>
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              © {currentYear} {store.name}. All rights reserved.
            </p>
            <p>
              Powered by{" "}
              <Link href="/" className="text-primary hover:underline">
                StormCom
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
