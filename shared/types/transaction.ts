import type { Wristband } from "./wristband";
import type { Product } from "./product";

export interface Transaction {
  id: string;
  wristbandId: string;
  wristband?: Wristband;
  productId: string;
  product?: Product;
  quantity: number;
  totalPrice: number;
  createdAt: Date;
}
