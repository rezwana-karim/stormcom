"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

/**
 * Product image gallery with thumbnails and zoom
 * Features: thumbnail navigation, keyboard controls, zoom modal
 */
export function ImageGallery({
  images,
  productName,
  className,
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const hasMultipleImages = images.length > 1;

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (images.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
          <span className="text-8xl opacity-30">🛍️</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-4", className)}>
        {/* Main Image */}
        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
          <Image
            src={images[selectedIndex]}
            alt={`${productName} - Image ${selectedIndex + 1}`}
            fill
            className="object-cover"
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={selectedIndex === 0}
          />

          {/* Zoom Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsZoomed(true)}
          >
            <ZoomIn className="h-4 w-4" />
            <span className="sr-only">Zoom image</span>
          </Button>

          {/* Navigation Arrows */}
          {hasMultipleImages && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous image</span>
              </Button>

              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Next image</span>
              </Button>
            </>
          )}

          {/* Image Counter */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {hasMultipleImages && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative aspect-square rounded-md overflow-hidden border-2 transition-all",
                  selectedIndex === index
                    ? "border-primary ring-2 ring-primary"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Image
                  src={image}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                  sizes="(max-width: 768px) 20vw, 10vw"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl w-full p-0">
          <div className="relative aspect-square w-full">
            <Image
              src={images[selectedIndex]}
              alt={`${productName} - Zoomed`}
              fill
              className="object-contain"
              unoptimized
              sizes="90vw"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
