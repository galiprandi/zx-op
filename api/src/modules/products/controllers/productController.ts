import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/productService';

export class ProductController {
  constructor(private productService: ProductService) {}

  async getProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const products = await this.productService.getAllProducts();
      return products;
    } catch (error) {
      reply.status(500).send({ error: 'Error fetching products' });
    }
  }

  async createProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name, description, price, category, required } = request.body as {
        name: string;
        description: string;
        price: number;
        category: string;
        required: boolean;
      };

      const product = await this.productService.createProduct(name, description, price, category, required);
      return product;
    } catch (error) {
      reply.status(400).send({ error: 'Error creating product' });
    }
  }

  async updateProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { name, description, price, category, required } = request.body as {
        name: string;
        description: string;
        price: number;
        category: string;
        required: boolean;
      };

      const product = await this.productService.updateProduct(id, name, description, price, category, required);
      return product;
    } catch (error) {
      reply.status(400).send({ error: 'Error updating product' });
    }
  }

  async deleteProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const product = await this.productService.deleteProduct(id);
      return product;
    } catch (error) {
      reply.status(400).send({ error: 'Error deleting product' });
    }
  }
}
