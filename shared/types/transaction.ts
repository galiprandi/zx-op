import type { PlayerSession } from "./playerSession";
import type { Product } from "./product";

export interface Transaction {
  id: string;
  playerSessionId: string;
  playerSession?: PlayerSession;
  productId: string;
  product?: Product;
  quantity: number;
  totalPrice: number;
  createdAt: Date;
}

export interface TransactionWithRelations {
  id: string;
  playerSessionId: string;
  playerSession: {
    id: string;
    barcodeId: string;
  };
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    category: string;
    timeValueSeconds: number | null;
  };
  quantity: number;
  totalPrice: number;
  createdAt: Date;
}

export interface CreateTransactionRequest {
  playerSessionId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
}

export interface TransactionStats {
  totalTransactions: number;
  totalRevenue: number;
  topProducts: Array<{
    productId: string;
    product: {
      name: string;
      category: string;
    };
    _sum: {
      totalPrice: number;
    };
    _count: {
      id: number;
    };
  }>;
}
