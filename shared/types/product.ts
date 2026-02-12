export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  required: boolean;
  timeValueSeconds?: number | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  category: string;
  required?: boolean;
  timeValueSeconds?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  required?: boolean;
  timeValueSeconds?: number;
}

export interface ProductCategory {
  name: string;
  count: number;
}
