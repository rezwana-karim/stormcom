// src/lib/services/attribute.service.ts
// Attribute Service - Manages product attributes (Color, Size, Material, etc.)

import { prisma } from '@/lib/prisma';
import type { ProductAttribute, ProductAttributeValue, Prisma } from '@prisma/client';

// ProductAttribute stores `values` as JSON string in DB. Use a runtime type
// that maps `values` to a string[] while preserving other model fields.
export interface AttributeWithValues extends Omit<ProductAttribute, 'values'> {
  values: string[];
  _count?: {
    productValues: number;
  };
}

export interface ListAttributesParams {
  storeId: string;
  search?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

export interface CreateAttributeParams {
  name: string;
  storeId: string;
  values?: string[];
}

export interface UpdateAttributeParams {
  name?: string;
  values?: string[];
}

export class AttributeService {
  private static instance: AttributeService;

  private constructor() {}

  static getInstance(): AttributeService {
    if (!AttributeService.instance) {
      AttributeService.instance = new AttributeService();
    }
    return AttributeService.instance;
  }

  /**
   * List attributes with pagination and filtering
   */
  async listAttributes(params: ListAttributesParams) {
    const {
      storeId,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
      page = 1,
      perPage = 10,
    } = params;

    const skip = (page - 1) * perPage;
    const take = Math.min(perPage, 100);

    // Build where clause (use Prisma input type for safe typings)
    const where: Prisma.ProductAttributeWhereInput = {
      storeId,
    };
    if (search) {
      where.name = {
        contains: search,
      };
    }

    // Get total count
    const total = await prisma.productAttribute.count({ where });

    // Get attributes
    const attributes: ProductAttribute[] = await prisma.productAttribute.findMany({
      where,
      include: {
        _count: {
          select: {
            productValues: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take,
    });

    // Parse JSON values
    const attributesWithValues = attributes.map((attr) => ({
      ...attr,
      values: this.parseValues(attr.values),
    }));

    return {
      data: attributesWithValues,
      meta: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Create a new attribute
   */
  async createAttribute(params: CreateAttributeParams): Promise<AttributeWithValues> {
    const { name, storeId, values = [] } = params;

    // Check if attribute with same name already exists in this store
    const existing = await prisma.productAttribute.findFirst({
      where: { 
        storeId,
        name 
      },
    });

    if (existing) {
      throw new Error(`Attribute with name "${name}" already exists in this store`);
    }

    // Create attribute
    const attribute = await prisma.productAttribute.create({
      data: {
        name,
        storeId,
        values: JSON.stringify(values),
      },
      include: {
        _count: {
          select: {
            productValues: true,
          },
        },
      },
    });

    return {
      ...attribute,
      values: this.parseValues(attribute.values),
    };
  }

  /**
   * Get attribute by ID
   */
  async getAttributeById(id: string): Promise<AttributeWithValues | null> {
    const attribute = await prisma.productAttribute.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productValues: true,
          },
        },
      },
    });

    if (!attribute) {
      return null;
    }

    return {
      ...attribute,
      values: this.parseValues(attribute.values),
    };
  }

  /**
   * Update attribute
   */
  async updateAttribute(
    id: string,
    params: UpdateAttributeParams
  ): Promise<AttributeWithValues> {
    const { name, values } = params;

    // Check if attribute exists
    const existing = await this.getAttributeById(id);
    if (!existing) {
      throw new Error('Attribute not found');
    }

    // Check for duplicate name if updating name
    if (name && name !== existing.name) {
      const duplicate = await prisma.productAttribute.findFirst({
        where: { 
          storeId: existing.storeId,
          name, 
          id: { not: id } 
        },
      });
      if (duplicate) {
        throw new Error(`Attribute with name "${name}" already exists in this store`);
      }
    }

    // Build update data
    const data: { name?: string; values?: string } = {};
    if (name !== undefined) {
      data.name = name;
    }
    if (values !== undefined) {
      data.values = JSON.stringify(values);
    }

    // Update attribute
    const updated = await prisma.productAttribute.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            productValues: true,
          },
        },
      },
    });

    return {
      ...updated,
      values: this.parseValues(updated.values),
    };
  }

  /**
   * Delete attribute
   */
  async deleteAttribute(id: string): Promise<void> {
    // Check if attribute is in use
    const attribute = await prisma.productAttribute.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            productValues: true,
          },
        },
      },
    });

    if (!attribute) {
      throw new Error('Attribute not found');
    }

    if (attribute._count.productValues > 0) {
      throw new Error(
        `Cannot delete attribute. It is used in ${attribute._count.productValues} product(s)`
      );
    }

    // Delete attribute
    await prisma.productAttribute.delete({
      where: { id },
    });
  }

  /**
   * Get attributes used by a product
   */
  async getProductAttributes(productId: string) {
    const productValues = await prisma.productAttributeValue.findMany({
      where: { productId },
      include: {
        attribute: true,
      },
    }) as Array<ProductAttributeValue & { attribute: ProductAttribute }>;

    // Group by attribute
    const attributesMap = new Map<string, { attribute: ProductAttribute; values: string[] }>();

    for (const pv of productValues) {
      if (!attributesMap.has(pv.attributeId)) {
        attributesMap.set(pv.attributeId, {
          attribute: pv.attribute,
          values: [],
        });
      }
      attributesMap.get(pv.attributeId)!.values.push(pv.value);
    }

    return Array.from(attributesMap.values()).map(({ attribute, values }) => ({
      ...attribute,
      values: this.parseValues(attribute.values),
      selectedValues: values,
    }));
  }

  /**
   * Set product attributes
   */
  async setProductAttributes(
    productId: string,
    attributes: Array<{ attributeId: string; values: string[] }>
  ): Promise<void> {
    // Delete existing product attributes
    await prisma.productAttributeValue.deleteMany({
      where: { productId },
    });

    // Create new product attributes
    if (attributes.length > 0) {
      const productAttributeValues = attributes.flatMap((attr) =>
        attr.values.map((value) => ({
          productId,
          attributeId: attr.attributeId,
          value,
        }))
      );

      await prisma.productAttributeValue.createMany({
        data: productAttributeValues,
      });
    }
  }

  /**
   * Parse JSON values
   */
  private parseValues(valuesJson: string): string[] {
    try {
      const parsed = JSON.parse(valuesJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Search attributes by name
   */
  async searchAttributes(query: string, limit: number = 10) {
    const attributes = await prisma.productAttribute.findMany({
      where: {
        name: {
          contains: query,
        },
      },
      take: limit,
    });

    return attributes.map((attr) => ({
      ...attr,
      values: this.parseValues(attr.values),
    }));
  }
}
