"use client";

// src/components/product/image-upload.tsx
// Image upload component with drag-and-drop, preview, reorder, and remove functionality
// Uses @dnd-kit for drag-to-reorder images

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Upload,
  X,
  GripVertical,
  ImageIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Constants
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  storeId: string;
  disabled?: boolean;
}

interface SortableImageProps {
  id: string;
  url: string;
  index: number;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

// Individual sortable image component
function SortableImage({
  id,
  url,
  index,
  onRemove,
  disabled = false,
}: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative aspect-square rounded-lg border bg-muted/50 overflow-hidden ${
        isDragging ? 'ring-2 ring-primary' : ''
      }`}
    >
      {/* Image */}
      <Image
        src={url}
        alt={`Product image ${index + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 150px, (max-width: 1024px) 120px, 100px"
      />

      {/* Overlay with controls */}
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        {!disabled && (
          <>
            {/* Drag handle */}
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab rounded-md bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30 active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded-md bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-destructive hover:text-white"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Position indicator */}
      <div className="absolute left-2 top-2 rounded-md bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
        {index === 0 ? 'Main' : index + 1}
      </div>
    </div>
  );
}

export function ImageUpload({
  images,
  onChange,
  storeId,
  disabled = false,
}: ImageUploadProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle file validation
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP, SVG`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum: 10MB`;
    }
    return null;
  };

  // Upload a single file
  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('storeId', storeId);

      try {
        const response = await fetch('/api/products/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        return data.url;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    [storeId]
  );

  // Handle file upload
  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = MAX_IMAGES - images.length;

      if (remainingSlots <= 0) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed`);
        return;
      }

      const filesToUpload = fileArray.slice(0, remainingSlots);
      const skippedCount = fileArray.length - filesToUpload.length;

      // Validate files
      const validFiles: File[] = [];
      for (const file of filesToUpload) {
        const error = validateFile(file);
        if (error) {
          toast.error(error, { description: file.name });
        } else {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      setUploading(true);
      const uploadedUrls: string[] = [];
      const errors: string[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress(`Uploading ${i + 1} of ${validFiles.length}...`);

        try {
          const url = await uploadFile(file);
          if (url) {
            uploadedUrls.push(url);
          }
        } catch {
          errors.push(file.name);
        }
      }

      setUploading(false);
      setUploadProgress(null);

      if (uploadedUrls.length > 0) {
        onChange([...images, ...uploadedUrls]);
        toast.success(
          `${uploadedUrls.length} image${uploadedUrls.length > 1 ? 's' : ''} uploaded`
        );
      }

      if (errors.length > 0) {
        toast.error(`Failed to upload: ${errors.join(', ')}`);
      }

      if (skippedCount > 0) {
        toast.warning(
          `${skippedCount} file${skippedCount > 1 ? 's' : ''} skipped (max ${MAX_IMAGES} images)`
        );
      }
    },
    [images, onChange, uploadFile]
  );

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  // Handle drop zone events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((_, i) => `image-${i}` === active.id);
      const newIndex = images.findIndex((_, i) => `image-${i}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(images, oldIndex, newIndex));
      }
    }
  };

  // Handle image removal
  const handleRemove = (index: number) => {
    setDeleteIndex(index);
  };

  const handleRemoveConfirm = () => {
    if (deleteIndex !== null) {
      const newImages = images.filter((_, i) => i !== deleteIndex);
      onChange(newImages);
      toast.success('Image removed');
    }
    setDeleteIndex(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Product Images ({images.length}/{MAX_IMAGES})
        </CardTitle>
        <CardDescription className="mt-1.5">
          Upload and manage product images with drag-to-reorder support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop zone / Upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDraggingOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${disabled || uploading ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            multiple
            onChange={handleFileInputChange}
            disabled={disabled || uploading}
            className="hidden"
            aria-label="Upload product images"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">{uploadProgress}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-muted p-4">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-semibold">
                  Drop images here or click to upload
                </p>
                <p className="text-sm text-muted-foreground mt-1.5">
                  JPEG, PNG, GIF, WebP, SVG up to 10MB each
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Images grid */}
        {images.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((_, i) => `image-${i}`)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {images.map((url, index) => (
                  <SortableImage
                    key={`image-${index}`}
                    id={`image-${index}`}
                    url={url}
                    index={index}
                    onRemove={handleRemove}
                    disabled={disabled}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="rounded-lg border-2 border-dashed bg-muted/20 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-foreground mb-2">
              No images uploaded yet
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              The first image will be used as the main product image in listings and search results
            </p>
          </div>
        )}

        {/* Help text */}
        <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p>
            Drag and drop to reorder images. The first image is the main product
            image shown in listings. You can upload up to {MAX_IMAGES} images,
            each with a maximum size of 10MB.
          </p>
        </div>

        {/* Delete confirmation dialog */}
        <AlertDialog
          open={deleteIndex !== null}
          onOpenChange={() => setDeleteIndex(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Image</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this image? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
