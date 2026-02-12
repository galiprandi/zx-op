import { FastifyInstance } from 'fastify';
import { productController } from '../controllers/productController';

export async function productRoutes(fastify: FastifyInstance) {
  // Get all products
  fastify.get('/api/products', productController.getAllProducts);
  
  // Get product by ID
  fastify.get('/api/products/:id', productController.getProductById);
  
  // Create new product
  fastify.post('/api/products', productController.createProduct);
  
  // Update product
  fastify.put('/api/products/:id', productController.updateProduct);
  
  // Delete product (soft delete)
  fastify.delete('/api/products/:id', productController.deleteProduct);
  
  // Get products by category
  fastify.get('/api/products/category/:category', productController.getProductsByCategory);
  
  // Get products that have time value
  fastify.get('/api/products/time', productController.getTimeProducts);
}
