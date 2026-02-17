import { AlertCircle, ImageIcon, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DesktopShell } from "@/components/DesktopShell";
import { GlassCard } from "@/components/GlassCard";
import { useSocket } from "@/hooks/useSocket";
import { useSystemSettings } from "@/hooks/useSystemSettingsQuery";

interface SettingsFormState {
	maxOccupancy: string;
	siteName: string;
	logoUrl: string;
	operationalDayStart: string;
	timezone: string;
}

function isValidHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function isValidTimeZone(value: string): boolean {
	try {
		new Intl.DateTimeFormat("es-AR", { timeZone: value }).format(new Date());
		return true;
	} catch {
		return false;
	}
}

export function SettingsView() {
	useSocket();

	const { settings, isLoading, updateMultipleSettings, isUpdating } = useSystemSettings();
	const [form, setForm] = useState<SettingsFormState>({
		maxOccupancy: "",
		siteName: "",
		logoUrl: "",
		operationalDayStart: "07:00",
		timezone: "America/Argentina/Tucuman",
	});

	useEffect(() => {
		if (!settings) return;
		setForm({
			maxOccupancy: String(settings.maxOccupancy ?? ""),
			siteName: settings.siteName ?? "",
			logoUrl: settings.logoUrl ?? "",
			operationalDayStart: settings.operationalDayStart ?? "07:00",
			timezone: settings.timezone ?? "America/Argentina/Tucuman",
		});
	}, [settings]);

	const handleSave = async (event: React.FormEvent) => {
		event.preventDefault();

		const parsedMax = Number(form.maxOccupancy);
		if (!Number.isFinite(parsedMax) || parsedMax <= 0 || !Number.isInteger(parsedMax)) {
			toast.error("La ocupación máxima debe ser un número entero mayor que 0");
			return;
		}

		const normalizedSiteName = form.siteName.trim();
		if (normalizedSiteName.length === 0) {
			toast.error("El nombre del sitio es obligatorio");
			return;
		}

		const normalizedLogoUrl = form.logoUrl.trim();
		if (normalizedLogoUrl.length > 0 && !isValidHttpUrl(normalizedLogoUrl)) {
			toast.error("La URL del logo no es válida");
			return;
		}

		if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(form.operationalDayStart)) {
			toast.error("La hora de inicio debe tener formato HH:mm");
			return;
		}

		const normalizedTimezone = form.timezone.trim();
		if (!isValidTimeZone(normalizedTimezone)) {
			toast.error("La zona horaria no es válida");
			return;
		}

		try {
			await updateMultipleSettings({
				maxOccupancy: parsedMax,
				siteName: normalizedSiteName,
				logoUrl: normalizedLogoUrl === "" ? null : normalizedLogoUrl,
				operationalDayStart: form.operationalDayStart,
				timezone: normalizedTimezone,
			});
			toast.success("Configuración guardada correctamente");
		} catch {
			toast.error("No se pudo guardar la configuración");
		}
	};

	return (
		<DesktopShell>
			<div className="space-y-6">
				<div>
					<h2 className="text-3xl font-bold">Configuración</h2>
					<p className="text-muted-foreground">Administra parámetros globales del sitio</p>
				</div>

				{isLoading && (
					<div className="flex items-center justify-center min-h-[30vh]">
						<div className="text-center">
							<div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
							<p className="text-muted-foreground">Cargando configuración...</p>
						</div>
					</div>
				)}

				{!isLoading && !settings && (
					<div className="flex items-center justify-center min-h-[30vh]">
						<div className="text-center">
							<AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
							<p className="text-destructive font-medium">No se pudo cargar la configuración</p>
						</div>
					</div>
				)}

				{!isLoading && settings && (
					<GlassCard>
						<form className="space-y-6" onSubmit={handleSave}>
							<div className="flex items-center gap-2">
								<Settings className="w-5 h-5 text-primary" />
								<h3 className="text-xl font-semibold">Ajustes del sistema</h3>
							</div>

							<div className="space-y-2">
								<Label htmlFor="maxOccupancy">Ocupación máxima del sitio</Label>
								<Input
									id="maxOccupancy"
									type="number"
									min={1}
									step={1}
									value={form.maxOccupancy}
									onChange={(e) => setForm((prev) => ({ ...prev, maxOccupancy: e.target.value }))}
									placeholder="Ej: 100"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="siteName">Nombre del sitio</Label>
								<Input
									id="siteName"
									type="text"
									value={form.siteName}
									onChange={(e) => setForm((prev) => ({ ...prev, siteName: e.target.value }))}
									placeholder="Zona Xtreme"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="logoUrl">URL del logo (opcional)</Label>
								<div className="relative">
									<ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										id="logoUrl"
										type="url"
										value={form.logoUrl}
										onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
										placeholder="https://ejemplo.com/logo.png"
										className="pl-10"
									/>
								</div>
								<p className="text-xs text-muted-foreground">
									Si se deja vacío, se usará el logo por defecto con iniciales.
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="operationalDayStart">Inicio del día operativo</Label>
								<Input
									id="operationalDayStart"
									type="time"
									value={form.operationalDayStart}
									onChange={(e) => setForm((prev) => ({ ...prev, operationalDayStart: e.target.value }))}
								/>
								<p className="text-xs text-muted-foreground">
									Los stats se acumulan desde esta hora hasta el mismo horario del día siguiente.
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="timezone">Zona horaria</Label>
								<Input
									id="timezone"
									type="text"
									value={form.timezone}
									onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
									placeholder="America/Argentina/Tucuman"
								/>
							</div>

							<div className="flex justify-end">
								<Button type="submit" disabled={isUpdating} className="flex items-center gap-2">
									<Save className="w-4 h-4" />
									{isUpdating ? "Guardando..." : "Guardar cambios"}
								</Button>
							</div>
						</form>
					</GlassCard>
				)}
			</div>
		</DesktopShell>
	);
}
