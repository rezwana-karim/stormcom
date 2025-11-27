import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the first image URL from a product's image data
 * Handles both thumbnailUrl and JSON-encoded images array
 */
export function getProductImageUrl(
  thumbnailUrl: string | null | undefined,
  imagesJson: string | null | undefined
): string | null {
  // Try thumbnail first
  if (thumbnailUrl) {
    return thumbnailUrl;
  }

  // Parse images JSON array
  if (imagesJson) {
    try {
      const images = JSON.parse(imagesJson);
      if (Array.isArray(images) && images.length > 0) {
        return images[0];
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  return null;
}
