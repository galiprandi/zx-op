import { API } from './api';

export interface PaymentMethod {
  id: string;
  name: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodRequest {
  name: string;
}

export interface UpdatePaymentMethodRequest {
  name: string;
}

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const { data } = await API.get<PaymentMethod[]>('/api/payment-methods');
  return data;
};

export const getPaymentMethodsAdmin = async (): Promise<PaymentMethod[]> => {
  const { data } = await API.get<PaymentMethod[]>('/api/payment-methods/admin');
  return data;
};

export const createPaymentMethod = async (payload: CreatePaymentMethodRequest): Promise<PaymentMethod> => {
  const { data } = await API.post<PaymentMethod>('/api/payment-methods', payload);
  return data;
};

export const updatePaymentMethod = async (id: string, payload: UpdatePaymentMethodRequest): Promise<PaymentMethod> => {
  const { data } = await API.put<PaymentMethod>(`/api/payment-methods/${id}`, payload);
  return data;
};

export const deletePaymentMethod = async (id: string): Promise<PaymentMethod> => {
  const { data } = await API.delete<PaymentMethod>(`/api/payment-methods/${id}`);
  return data;
};

export const togglePaymentMethodActive = async (id: string): Promise<PaymentMethod> => {
  const { data } = await API.patch<PaymentMethod>(`/api/payment-methods/${id}/toggle-active`);
  return data;
};
