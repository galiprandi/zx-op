import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSystemSettings, updateSystemSettings, type SystemSettings } from "@/api/system";
import { toast } from "sonner";

export function useSystemSettings() {
	const queryClient = useQueryClient();

	const {
		data: settings = null,
		isLoading,
		error,
	} = useQuery<SystemSettings, Error>({
		queryKey: ["systemSettings"],
		queryFn: getSystemSettings,
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
		retry: 2,
	});

	const updateSettingsMutation = useMutation({
		mutationFn: (settings: Partial<SystemSettings>) => updateSystemSettings(settings),
		onError: (error) => {
			console.error('Failed to update system settings:', error);
			toast.error(`Error al actualizar configuración: ${error.message}`);
		},
	});

	// Helper functions para actualizar campos específicos
	const updateSiteName = (siteName: string) => {
		return updateSettingsMutation.mutateAsync({ siteName });
	};

	const updateLogoUrl = (logoUrl: string | null) => {
		return updateSettingsMutation.mutateAsync({ logoUrl });
	};

	const updateMaxOccupancy = (maxOccupancy: number) => {
		return updateSettingsMutation.mutateAsync({ maxOccupancy });
	};

	const updateMultipleSettings = (settings: Partial<SystemSettings>) => {
		return updateSettingsMutation.mutateAsync(settings);
	};

	// Refrescar datos manualmente
	const refetch = () => {
		return queryClient.refetchQueries({ queryKey: ["systemSettings"] });
	};

	// Invalidar cache (útil para actualizaciones en tiempo real vía socket)
	const invalidate = () => {
		queryClient.invalidateQueries({ queryKey: ["systemSettings"] });
	};

	return {
		settings,
		isLoading,
		error,
		isUpdating: updateSettingsMutation.isPending,
		updateSiteName,
		updateLogoUrl,
		updateMaxOccupancy,
		updateMultipleSettings,
		refetch,
		invalidate,
		updateSettingsMutation,
	};
}
