import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  getPaymentMethodsAdmin,
  togglePaymentMethodActive,
  updatePaymentMethod,
  type CreatePaymentMethodRequest,
  type UpdatePaymentMethodRequest,
} from '@/api/paymentMethods';

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['paymentMethods'],
    queryFn: getPaymentMethods,
  });
}

export function usePaymentMethodsAdmin() {
  const query = useQuery({
    queryKey: ['paymentMethodsAdmin'],
    queryFn: getPaymentMethodsAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePaymentMethodRequest) => createPaymentMethod(payload),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePaymentMethodRequest }) =>
      updatePaymentMethod(id, payload),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePaymentMethod(id),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => togglePaymentMethodActive(id),
  });

  return {
    ...query,
    createPaymentMethod: createMutation.mutateAsync,
    updatePaymentMethod: updateMutation.mutateAsync,
    deletePaymentMethod: deleteMutation.mutateAsync,
    togglePaymentMethodActive: toggleMutation.mutateAsync,
    isMutating:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      toggleMutation.isPending,
  };
}
