import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Folder } from "lucide-react";

interface CategoriesPageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Categories",
};

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { slug } = await params;
  const headersList = await headers();
  const storeId = headersList.get("x-store-id");

  const store = await prisma.store.findFirst({
    where: storeId ? { id: storeId, deletedAt: null } : { slug, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });

  if (!store) notFound();

  const categories = await prisma.category.findMany({
    where: {
      storeId: store.id,
      isPublished: true,
      deletedAt: null,
      parentId: null,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      _count: {
        select: {
          products: { where: { status: "ACTIVE", deletedAt: null } },
          children: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Shop by Category</h1>
          <p className="text-muted-foreground">Explore our curated collections</p>
        </div>

        {categories.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Folder className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Categories Yet</h3>
              <Button asChild>
                <Link href={`/store/${store.slug}/products`}>Browse All Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.id} href={`/store/${store.slug}/categories/${category.slug}`} className="group">
                <Card className="h-full overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-xl">
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                    {category.image ? (
                      <Image src={category.image} alt={category.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Folder className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                        {category._count.products} {category._count.products === 1 ? 'product' : 'products'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">{category.name}</h3>
                    {category.description && <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
