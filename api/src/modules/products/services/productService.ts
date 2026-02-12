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
  timeValueSeconds?: number;
}

export class ProductService {
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
    emitProductEvent('product:deleted', { product: deletedProduct });

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
