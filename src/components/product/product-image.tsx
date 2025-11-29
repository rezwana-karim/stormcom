"use client";

// src/components/product/product-image.tsx
// Product image component with fallback handling for missing images

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
}

const PLACEHOLDER_SRC = '/placeholder.svg';

export function ProductImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  sizes,
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src || null);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (imgSrc !== PLACEHOLDER_SRC) {
      setImgSrc(PLACEHOLDER_SRC);
      setHasError(true);
    }
  };

  // If no source or error occurred and placeholder also failed, show icon
  if (!imgSrc || (hasError && imgSrc === PLACEHOLDER_SRC)) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={`object-cover ${className}`}
        sizes={sizes}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 56}
      height={height || 56}
      className={`object-cover ${className}`}
      onError={handleError}
    />
  );
}

export default ProductImage;
