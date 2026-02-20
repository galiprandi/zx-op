import { PrismaClient, Product } from '@prisma/client';
import { emitProductEvent } from '../../playerSessions/services/socketService';

const prisma = new PrismaClient();

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  category: string;
  required?: boolean;
  timeValueSeconds?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  required?: boolean;
  timeValueSeconds?: number | null;
}

export class ProductService {
  private async ensureCategoryExists(name: string): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Category name is required');
    }

    const existing = await prisma.productCategory.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } },
    });

    if (existing) {
      return;
    }

    await prisma.productCategory.create({
      data: { name: trimmedName },
    });
  }

  private async syncCategoriesFromProducts(): Promise<void> {
    const usedCategories = await prisma.product.findMany({
      where: { isDeleted: false },
      select: { category: true },
      distinct: ['category'],
    });

    if (usedCategories.length === 0) {
      return;
    }

    await prisma.productCategory.createMany({
      data: usedCategories.map((entry) => ({ name: entry.category })),
      skipDuplicates: true,
    });
  }

  async getProductCategories(): Promise<string[]> {
    await this.syncCategoriesFromProducts();
    const categories = await prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
      select: { name: true },
    });
    return categories.map((category) => category.name);
  }

  async createProductCategory(name: string): Promise<string> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Category name is required');
    }

    const existing = await prisma.productCategory.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } },
    });

    if (existing) {
      throw new Error('Category already exists');
    }

    const category = await prisma.productCategory.create({
      data: { name: trimmedName },
    });

    return category.name;
  }

  async renameProductCategory(currentName: string, newName: string): Promise<string> {
    const sourceName = currentName.trim();
    const targetName = newName.trim();

    if (!sourceName || !targetName) {
      throw new Error('Both current and new category names are required');
    }

    if (sourceName.toLowerCase() === targetName.toLowerCase()) {
      return sourceName;
    }

    const existingTarget = await prisma.productCategory.findFirst({
      where: { name: { equals: targetName, mode: 'insensitive' } },
    });
    if (existingTarget) {
      throw new Error('Category already exists');
    }

    const sourceCategory = await prisma.productCategory.findFirst({
      where: { name: { equals: sourceName, mode: 'insensitive' } },
    });
    if (!sourceCategory) {
      throw new Error('Category not found');
    }

    await prisma.$transaction([
      prisma.productCategory.update({
        where: { id: sourceCategory.id },
        data: { name: targetName },
      }),
      prisma.product.updateMany({
        where: { category: sourceCategory.name },
        data: { category: targetName },
      }),
    ]);

    return targetName;
  }

  async deleteProductCategory(name: string): Promise<void> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Category name is required');
    }

    const category = await prisma.productCategory.findFirst({
      where: { name: { equals: trimmedName, mode: 'insensitive' } },
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const productsUsingCategory = await prisma.product.count({
      where: {
        category: category.name,
        isDeleted: false,
      },
    });

    if (productsUsingCategory > 0) {
      throw new Error('Cannot delete category with active products');
    }

    await prisma.productCategory.delete({
      where: { id: category.id },
    });
  }

  async getAllProducts(): Promise<Product[]> {
    return prisma.product.findMany({ 
      where: { isDeleted: false },
      orderBy: { name: 'asc' }
    });
  }

  async getProductById(id: string): Promise<Product | null> {
    return prisma.product.findFirst({ 
      where: { id, isDeleted: false } 
    });
  }

  async createProduct(data: CreateProductRequest): Promise<Product> {
    await this.ensureCategoryExists(data.category);
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        required: !!data.required,
        timeValueSeconds: data.timeValueSeconds ?? null,
      },
    });

    // Emitir evento Socket.IO
    emitProductEvent('product:created', { product });

    return product;
  }

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    // Verificar que el producto existe y no está eliminado
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    if (data.category) {
      const existingCategory = await prisma.productCategory.findFirst({
        where: { name: { equals: data.category, mode: 'insensitive' } },
      });
      if (!existingCategory) {
        throw new Error('Category not found');
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        required: data.required !== undefined ? !!data.required : undefined,
        timeValueSeconds: data.timeValueSeconds !== undefined ? data.timeValueSeconds : undefined,
      },
    });

    // Emitir evento Socket.IO
    emitProductEvent('product:updated', { product: updatedProduct });

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<Product> {
    // Soft delete
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      throw new Error('Product not found');
    }

    const deletedProduct = await prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    // Emitir evento Socket.IO
    emitProductEvent('product:deleted', { productId: deletedProduct.id });

    return deletedProduct;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return prisma.product.findMany({
      where: { category, isDeleted: false },
      orderBy: { name: 'asc' }
    });
  }

  async getTimeProducts(): Promise<Product[]> {
    return prisma.product.findMany({
      where: { 
        isDeleted: false,
        timeValueSeconds: { not: null }
      },
      orderBy: { name: 'asc' }
    });
  }
}

export const productService = new ProductService();
