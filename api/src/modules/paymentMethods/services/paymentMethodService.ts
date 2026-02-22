import { PaymentMethod, PrismaClient } from '@prisma/client';
import { emitPaymentMethodEvent } from '../../playerSessions/services/socketService';

const prisma = new PrismaClient();

export interface CreatePaymentMethodRequest {
  name: string;
}

export interface UpdatePaymentMethodRequest {
  name: string;
}

export class PaymentMethodService {
  async getActiveMethods(): Promise<PaymentMethod[]> {
    return prisma.paymentMethod.findMany({
      where: {
        isDeleted: false,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getAllForAdmin(): Promise<PaymentMethod[]> {
    return prisma.paymentMethod.findMany({
      orderBy: [{ isDeleted: 'asc' }, { name: 'asc' }],
    });
  }

  async createMethod(data: CreatePaymentMethodRequest): Promise<PaymentMethod> {
    const name = data.name.trim();
    if (!name) {
      throw new Error('Payment method name is required');
    }

    const existing = await prisma.paymentMethod.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new Error('Payment method already exists');
    }

    const method = await prisma.paymentMethod.create({
      data: {
        name,
        isActive: true,
        isDeleted: false,
      },
    });

    emitPaymentMethodEvent('payment-method:created', { paymentMethod: method });
    return method;
  }

  async updateMethod(id: string, data: UpdatePaymentMethodRequest): Promise<PaymentMethod> {
    const current = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!current || current.isDeleted) {
      throw new Error('Payment method not found');
    }

    const name = data.name.trim();
    if (!name) {
      throw new Error('Payment method name is required');
    }

    const duplicate = await prisma.paymentMethod.findFirst({
      where: {
        id: { not: id },
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (duplicate) {
      throw new Error('Payment method already exists');
    }

    const method = await prisma.paymentMethod.update({
      where: { id },
      data: { name },
    });

    emitPaymentMethodEvent('payment-method:updated', { paymentMethod: method });
    return method;
  }

  async softDeleteMethod(id: string): Promise<PaymentMethod> {
    const current = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!current || current.isDeleted) {
      throw new Error('Payment method not found');
    }

    const method = await prisma.paymentMethod.update({
      where: { id },
      data: {
        isDeleted: true,
        isActive: false,
      },
    });

    emitPaymentMethodEvent('payment-method:deleted', { paymentMethod: method });
    return method;
  }

  async toggleActive(id: string): Promise<PaymentMethod> {
    const current = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!current || current.isDeleted) {
      throw new Error('Payment method not found');
    }

    const method = await prisma.paymentMethod.update({
      where: { id },
      data: {
        isActive: !current.isActive,
      },
    });

    emitPaymentMethodEvent('payment-method:status-changed', { paymentMethod: method });
    return method;
  }
}

export const paymentMethodService = new PaymentMethodService();
