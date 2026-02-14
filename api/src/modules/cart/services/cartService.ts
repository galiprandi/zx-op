import { emitCartEvent } from '../../playerSessions/services/socketService';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CartUpdateData {
  barcodeId: string;
  cart: CartItem[];
}

export function emitCartUpdate(data: CartUpdateData) {
  emitCartEvent('cart:updated', data);
}
