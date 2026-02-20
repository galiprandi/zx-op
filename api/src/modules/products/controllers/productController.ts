import { FastifyRequest, FastifyReply } from 'fastify';
import { productService, CreateProductRequest, UpdateProductRequest } from '../services/productService';

export class ProductController {
  async getProductCategories(request: FastifyRequest, reply: FastifyReply) {
    try {
      const categories = await productService.getProductCategories();
      return categories;
    } catch (error) {
      console.error('Get product categories error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async createProductCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as { name?: string };
      if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return reply.status(400).send({ error: 'Category name is required' });
      }

      const category = await productService.createProductCategory(body.name);
      return { name: category };
    } catch (error) {
      console.error('Create product category error:', error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async renameProductCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name } = request.params as { name: string };
      const body = request.body as { newName?: string };

      if (!body.newName || typeof body.newName !== 'string' || body.newName.trim().length === 0) {
        return reply.status(400).send({ error: 'newName is required' });
      }

      const updatedName = await productService.renameProductCategory(name, body.newName);
      return { name: updatedName };
    } catch (error) {
      console.error('Rename product category error:', error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async deleteProductCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { name } = request.params as { name: string };
      await productService.deleteProductCategory(name);
      return { success: true };
    } catch (error) {
      console.error('Delete product category error:', error);
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getAllProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const products = await productService.getAllProducts();
      return products;
    } catch (error) {
      console.error('Get products error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getProductById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const product = await productService.getProductById(id);
      
      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      
      return product;
    } catch (error) {
      console.error('Get product error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async createProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as CreateProductRequest;
      
      // Validaciones
      if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return reply.status(400).send({ error: 'Product name is required' });
      }
      
      if (typeof body.price !== 'number' || body.price <= 0) {
        return reply.status(400).send({ error: 'Price must be a positive number' });
      }
      
      if (!body.category || typeof body.category !== 'string' || body.category.trim().length === 0) {
        return reply.status(400).send({ error: 'Category is required' });
      }
      
      if (
        body.timeValueSeconds !== undefined &&
        body.timeValueSeconds !== null &&
        (typeof body.timeValueSeconds !== 'number' || body.timeValueSeconds <= 0)
      ) {
        return reply.status(400).send({ error: 'timeValueSeconds must be a positive number or null' });
      }

      const product = await productService.createProduct(body);
      return product;
    } catch (error) {
      console.error('Create product error:', error);
      
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async updateProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as UpdateProductRequest;
      
      // Validaciones opcionales (solo si se proporcionan)
      if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
        return reply.status(400).send({ error: 'Product name must be a non-empty string' });
      }
      
      if (body.price !== undefined && (typeof body.price !== 'number' || body.price <= 0)) {
        return reply.status(400).send({ error: 'Price must be a positive number' });
      }
      
      if (body.category !== undefined && (typeof body.category !== 'string' || body.category.trim().length === 0)) {
        return reply.status(400).send({ error: 'Category must be a non-empty string' });
      }
      
      if (
        body.timeValueSeconds !== undefined &&
        body.timeValueSeconds !== null &&
        (typeof body.timeValueSeconds !== 'number' || body.timeValueSeconds <= 0)
      ) {
        return reply.status(400).send({ error: 'timeValueSeconds must be a positive number or null' });
      }

      const product = await productService.updateProduct(id, body);
      return product;
    } catch (error) {
      console.error('Update product error:', error);
      
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async deleteProduct(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const product = await productService.deleteProduct(id);
      return product;
    } catch (error) {
      console.error('Delete product error:', error);
      
      if (error instanceof Error) {
        return reply.status(400).send({ error: error.message });
      }
      
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getProductsByCategory(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { category } = request.params as { category: string };
      const products = await productService.getProductsByCategory(category);
      return products;
    } catch (error) {
      console.error('Get products by category error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  async getTimeProducts(request: FastifyRequest, reply: FastifyReply) {
    try {
      const products = await productService.getTimeProducts();
      return products;
    } catch (error) {
      console.error('Get time products error:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}

export const productController = new ProductController();
