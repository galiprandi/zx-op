import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

export class ProductService {
  constructor(
    private prisma: PrismaClient,
    private io: SocketIOServer
  ) {}

  async getAllProducts() {
    return await this.prisma.product.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(name: string, description: string, price: number, category: string, required: boolean) {
    const product = await this.prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        category,
        required: Boolean(required),
      },
    });

    this.io.emit('product:created', product);
    return product;
  }

  async updateProduct(id: string, name: string, description: string, price: number, category: string, required: boolean) {
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: Number(price),
        category,
        required: Boolean(required),
      },
    });

    this.io.emit('product:updated', product);
    return product;
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    this.io.emit('product:deleted', product);
    return product;
  }

  async findProductById(id: string) {
    return await this.prisma.product.findUnique({
      where: { id },
    });
  }
}
