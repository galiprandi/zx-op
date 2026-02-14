import { FastifyInstance } from 'fastify';
import { emitCartUpdate, type CartItem } from '../services/cartService';

export async function cartRoutes(fastify: FastifyInstance) {
  // Emit cart update events
  fastify.post('/cart/notify', async (request) => {
    const { barcodeId, cart } = request.body as { barcodeId: string; cart: CartItem[] };
    
    emitCartUpdate({ barcodeId, cart });
    
    return { success: true };
  });
}
