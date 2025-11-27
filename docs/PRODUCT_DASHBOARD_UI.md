# Product Dashboard UI Documentation

## Overview

The Product Dashboard UI provides a comprehensive admin interface for managing products in the StormCom e-commerce platform. Built with React, Next.js 16, and shadcn-ui components, it offers a complete solution for product listing, creation, editing, variant management, and bulk operations.

## Table of Contents

1. [Components](#components)
2. [Pages](#pages)
3. [API Integration](#api-integration)
4. [Features](#features)
5. [Acceptance Criteria](#acceptance-criteria)
6. [Usage Examples](#usage-examples)

---

## Components

### 1. Product List Page (`src/components/products-page-client.tsx`)

The main products listing page with search, filters, sorting, and bulk actions.

**Features:**
- Paginated product table (10/25/50/100 per page)
- Real-time search with 300ms debounce
- Status filter (Draft, Active, Archived)
- Inventory status filter (In Stock, Low Stock, Out of Stock, Discontinued)
- Sort by name, price, created date, updated date
- Bulk actions for 100+ selected products

**Props:** None (client-side component)

**State Management:**
- `storeId` - Selected store context
- `filters` - Search, status, inventory status, sort options
- `selectedProducts` - Map of selected product IDs for bulk actions
- `debouncedSearch` - Debounced search term

---

### 2. Products Table (`src/components/products-table.tsx`)

Data table component for displaying products with selection and actions.

**Features:**
- Checkbox selection for bulk actions
- Product thumbnail images
- Quick status actions via dropdown menu
- Loading skeletons
- Responsive column hiding on mobile

**Props:**
```typescript
interface ProductsTableProps {
  storeId: string;
  search?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  inventoryStatus?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  selectedProducts?: SelectedProducts;
  onSelectionChange?: (selection: SelectedProducts) => void;
  isPending?: boolean;
}
```

---

### 3. Product Form (`src/components/product-form.tsx`)

Form for creating new products with full validation.

**Features:**
- React Hook Form + Zod validation
- Auto-generated slug from product name
- Category and brand selection
- Image upload integration
- Variant manager integration
- Pricing fields (price, compare at price, cost per item)
- Inventory management (stock quantity, status)

**Validation Schema:**
```typescript
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().max(5000).optional(),
  sku: z.string().min(1, 'SKU is required').max(100),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  costPerItem: z.coerce.number().min(0).optional().nullable(),
  inventoryQty: z.coerce.number().int().min(0),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
});
```

---

### 4. Product Edit Form (`src/components/product-edit-form.tsx`)

Form for editing existing products with pre-populated data.

**Features:**
- Same validation as create form
- Fetches existing product data on store selection
- Preserves existing images and variants
- Category/brand pre-selection

**Props:**
```typescript
interface ProductEditFormProps {
  productId: string;
}
```

---

### 5. Variant Manager (`src/components/product/variant-manager.tsx`)

Inline-editable table for managing product variants.

**Features:**
- Add/edit/remove up to 100 variants per product
- Inline editing with validation
- SKU uniqueness validation within product
- Delete confirmation dialog
- Responsive table design for mobile

**Props:**
```typescript
interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  disabled?: boolean;
}

interface ProductVariant {
  id?: string;
  name: string;
  sku: string;
  price: number | null;
  stock: number;
}
```

**Usage:**
```tsx
const [variants, setVariants] = useState<ProductVariant[]>([]);

<VariantManager
  variants={variants}
  onChange={setVariants}
  disabled={loading}
/>
```

---

### 6. Image Upload (`src/components/product/image-upload.tsx`)

Drag-and-drop image upload with reordering capability.

**Features:**
- Drag-and-drop upload via @dnd-kit
- Image reordering by drag
- Preview with thumbnails
- Remove images with confirmation
- Max 10 images, 10MB per file
- Supported formats: JPEG, PNG, GIF, WebP, SVG

**Props:**
```typescript
interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  storeId: string;
  disabled?: boolean;
}
```

**Usage:**
```tsx
const [images, setImages] = useState<string[]>([]);

<ImageUpload
  images={images}
  onChange={setImages}
  storeId={storeId}
  disabled={loading}
/>
```

---

### 7. Category Selector (`src/components/product/category-selector.tsx`)

Dropdown selector for product categories.

**Features:**
- Fetches categories from store
- Shows parent > child hierarchy
- "No category" option
- Loading skeleton

**Props:**
```typescript
interface CategorySelectorProps {
  storeId: string;
  value?: string | null;
  onChange: (categoryId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

---

### 8. Brand Selector (`src/components/product/brand-selector.tsx`)

Dropdown selector for product brands.

**Features:**
- Fetches brands from store
- "No brand" option
- Loading skeleton

**Props:**
```typescript
interface BrandSelectorProps {
  storeId: string;
  value?: string | null;
  onChange: (brandId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

---

## Pages

### Products List Page (`/dashboard/products`)

**Route:** `src/app/dashboard/products/page.tsx`

Main entry point for product management. Renders `ProductsPageClient` component.

### New Product Page (`/dashboard/products/new`)

**Route:** `src/app/dashboard/products/new/page.tsx`

Creates new products using `ProductForm` component.

### Edit Product Page (`/dashboard/products/[id]`)

**Route:** `src/app/dashboard/products/[id]/page.tsx`

Edits existing products using `ProductEditForm` component.

---

## API Integration

### Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List products with filters |
| `/api/products` | POST | Create new product |
| `/api/products/[id]` | GET | Get single product |
| `/api/products/[id]` | PATCH | Update product |
| `/api/products/[id]` | DELETE | Soft delete product |
| `/api/products/upload` | POST | Upload product images |
| `/api/products/import` | POST | CSV bulk import |
| `/api/categories` | GET | List categories |
| `/api/brands` | GET | List brands |

### Request/Response Examples

**Create Product:**
```typescript
// POST /api/products
const response = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    storeId: 'store_123',
    name: 'Product Name',
    slug: 'product-name',
    sku: 'SKU-001',
    price: 29.99,
    description: 'Product description',
    categoryId: 'cat_123',
    brandId: 'brand_123',
    status: 'DRAFT',
    inventoryQty: 100,
    images: ['https://example.com/image1.jpg'],
    variants: [
      { name: 'Small', sku: 'SKU-001-S', price: 29.99, inventoryQty: 50 }
    ]
  })
});
```

**List Products:**
```typescript
// GET /api/products
const params = new URLSearchParams({
  storeId: 'store_123',
  page: '1',
  perPage: '25',
  search: 'search term',
  status: 'ACTIVE',
  sortBy: 'createdAt',
  sortOrder: 'desc'
});
const response = await fetch(`/api/products?${params}`);
```

---

## Features

### Bulk Actions

The bulk actions system allows managing multiple products at once:

1. **Select Products:** Click checkboxes in the table or use "Select All"
2. **Action Bar:** Appears when products are selected
3. **Available Actions:**
   - Delete (soft delete)
   - Publish (set status to ACTIVE)
   - Archive (set status to ARCHIVED)
4. **Confirmation:** All actions require confirmation dialog
5. **Progress:** Shows count of affected products

### Search & Filters

- **Search:** 300ms debounced, searches name and SKU
- **Status Filter:** DRAFT, ACTIVE, ARCHIVED
- **Inventory Filter:** IN_STOCK, LOW_STOCK, OUT_OF_STOCK, DISCONTINUED
- **Sort Options:** Name, Price, Created, Updated (ASC/DESC)

### Mobile Responsiveness

Tested breakpoints:
- **375px** (iPhone SE): Single column layout, collapsed table
- **768px** (Tablet): Two column forms, essential table columns
- **1024px** (Desktop): Full layout with all features

---

## Acceptance Criteria

| Criteria | Status |
|----------|--------|
| Product list shows 50+ products with <2s load time | ✅ Implemented |
| Create form validates all required fields | ✅ Implemented |
| Variant management UI (up to 100 variants) | ✅ Implemented |
| Image upload with preview and drag-to-reorder | ✅ Implemented |
| Bulk actions for 100+ products | ✅ Implemented |
| Search and filters apply instantly (<500ms) | ✅ Implemented |
| Mobile responsive (375px, 768px, 1024px) | ✅ Implemented |

---

## Usage Examples

### Complete Product Creation Flow

```tsx
// 1. Select store
const [storeId, setStoreId] = useState('');
<StoreSelector onStoreChange={setStoreId} />

// 2. Fill basic info via form
const form = useForm({
  resolver: zodResolver(productFormSchema),
  defaultValues: { name: '', sku: '', price: 0, status: 'DRAFT' }
});

// 3. Add images
const [images, setImages] = useState([]);
<ImageUpload images={images} onChange={setImages} storeId={storeId} />

// 4. Add variants
const [variants, setVariants] = useState([]);
<VariantManager variants={variants} onChange={setVariants} />

// 5. Submit
const onSubmit = async (data) => {
  const response = await fetch('/api/products', {
    method: 'POST',
    body: JSON.stringify({ storeId, ...data, images, variants })
  });
};
```

### Bulk Delete Products

```tsx
// Select products
const [selectedProducts, setSelectedProducts] = useState({});

// Execute bulk delete
const handleBulkDelete = async () => {
  const ids = Object.keys(selectedProducts).filter(id => selectedProducts[id]);
  
  for (const id of ids) {
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
  }
  
  // Refresh list
  refetchProducts();
};
```

---

## Related Documentation

- [Product CRUD API Documentation](./api/PRODUCT_API.md)
- [Database Schema Quick Reference](./DATABASE_SCHEMA_QUICK_REFERENCE.md)
- [Implementation Status & Roadmap](./IMPLEMENTATION_STATUS_AND_ROADMAP.md)

---

## Changelog

### Version 1.0.0 (November 2025)

- Initial implementation of Product Dashboard UI
- Product list with search, filters, and bulk actions
- Create/Edit forms with React Hook Form + Zod validation
- Variant manager supporting up to 100 variants
- Image upload with drag-to-reorder via @dnd-kit
- Category and brand selector components
- Mobile responsive design (375px, 768px, 1024px)
