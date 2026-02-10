import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/productController';

export async function productRoutes(fastify: FastifyInstance, controller: ProductController) {
  // Get all products
  fastify.get('/api/products', controller.getProducts.bind(controller));

  // Create product
  fastify.post('/api/products', controller.createProduct.bind(controller));

  // Update product
  fastify.put('/api/products/:id', controller.updateProduct.bind(controller));

  // Delete product
  fastify.delete('/api/products/:id', controller.deleteProduct.bind(controller));
}
