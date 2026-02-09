import { PrismaClient } from '@prisma/client'
import { CreateProductRequest, UpdateProductRequest } from '@shared/schemas'

const prisma = new PrismaClient()

export class ProductService {
  // Get all products (excluding deleted)
  static async getAll() {
    return await prisma.product.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' }
    })
  }

  // Get product by ID
  static async getById(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, isDeleted: false }
    })
    
    if (!product) {
      throw new Error('Product not found')
    }
    
    return product
  }

  // Create new product
  static async create(data: CreateProductRequest) {
    return await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
      }
    })
  }

  // Update product
  static async update(id: string, data: UpdateProductRequest) {
    // Check if product exists and is not deleted
    const existingProduct = await this.getById(id)
    
    return await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
      }
    })
  }

  // Soft delete product
  static async softDelete(id: string) {
    // Check if product exists and is not deleted
    const existingProduct = await this.getById(id)
    
    return await prisma.product.update({
      where: { id },
      data: { isDeleted: true }
    })
  }

  // Restore soft deleted product
  static async restore(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, isDeleted: true }
    })
    
    if (!product) {
      throw new Error('Deleted product not found')
    }
    
    return await prisma.product.update({
      where: { id },
      data: { isDeleted: false }
    })
  }

  // Get deleted products (for admin/restore functionality)
  static async getDeleted() {
    return await prisma.product.findMany({
      where: { isDeleted: true },
      orderBy: { updatedAt: 'desc' }
    })
  }

  // Get products by category
  static async getByCategory(category: string) {
    return await prisma.product.findMany({
      where: { 
        category,
        isDeleted: false 
      },
      orderBy: { name: 'asc' }
    })
  }
}
