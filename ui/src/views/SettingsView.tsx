import { AlertCircle, ImageIcon, Plus, Save, Settings, Trash2, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DesktopShell } from '@/components/DesktopShell';
import { GlassCard } from '@/components/GlassCard';
import { modalOverlayClass, modalPanelBaseClass } from '@/components/modalStyles';
import { useSocket } from '@/hooks/useSocket';
import { useSystemSettings } from '@/hooks/useSystemSettingsQuery';
import { usePaymentMethodsAdmin } from '@/hooks/usePaymentMethods';

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
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('es-AR', { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function SettingsView() {
  useSocket();

  const { settings, isLoading, updateMultipleSettings, isUpdating } = useSystemSettings();
  const paymentMethodsAdmin = usePaymentMethodsAdmin();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [newPaymentName, setNewPaymentName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [form, setForm] = useState<SettingsFormState>({
    maxOccupancy: '',
    siteName: '',
    logoUrl: '',
    operationalDayStart: '07:00',
    timezone: 'America/Argentina/Tucuman',
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      maxOccupancy: String(settings.maxOccupancy ?? ''),
      siteName: settings.siteName ?? '',
      logoUrl: settings.logoUrl ?? '',
      operationalDayStart: settings.operationalDayStart ?? '07:00',
      timezone: settings.timezone ?? 'America/Argentina/Tucuman',
    });
  }, [settings]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsedMax = Number(form.maxOccupancy);
    if (!Number.isFinite(parsedMax) || parsedMax <= 0 || !Number.isInteger(parsedMax)) {
      toast.error('La ocupación máxima debe ser un número entero mayor que 0');
      return;
    }

    const normalizedSiteName = form.siteName.trim();
    if (normalizedSiteName.length === 0) {
      toast.error('El nombre del sitio es obligatorio');
      return;
    }

    const normalizedLogoUrl = form.logoUrl.trim();
    if (normalizedLogoUrl.length > 0 && !isValidHttpUrl(normalizedLogoUrl)) {
      toast.error('La URL del logo no es válida');
      return;
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(form.operationalDayStart)) {
      toast.error('La hora de inicio debe tener formato HH:mm');
      return;
    }

    const normalizedTimezone = form.timezone.trim();
    if (!isValidTimeZone(normalizedTimezone)) {
      toast.error('La zona horaria no es válida');
      return;
    }

    try {
      await updateMultipleSettings({
        maxOccupancy: parsedMax,
        siteName: normalizedSiteName,
        logoUrl: normalizedLogoUrl === '' ? null : normalizedLogoUrl,
        operationalDayStart: form.operationalDayStart,
        timezone: normalizedTimezone,
      });
      toast.success('Configuración guardada correctamente');
    } catch {
      toast.error('No se pudo guardar la configuración');
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="operationalDayStart">Inicio del día operativo</Label>
                <Input
                  id="operationalDayStart"
                  type="time"
                  value={form.operationalDayStart}
                  onChange={(e) => setForm((prev) => ({ ...prev, operationalDayStart: e.target.value }))}
                />
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

              <div className="space-y-2 rounded-lg border border-border/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-primary" />
                      Medios de pago
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Alta, edición, activación y baja lógica de medios para check-in
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(true)}>
                    Administrar
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isUpdating} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {isUpdating ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </GlassCard>
        )}

        {isPaymentModalOpen && (
          <div className={`${modalOverlayClass} !mt-0 px-4`}>
            <div className={`${modalPanelBaseClass} max-w-2xl p-6 space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">CRUD de medios de pago</h3>
                <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
                  Cerrar
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Nuevo medio de pago"
                  value={newPaymentName}
                  onChange={(e) => setNewPaymentName(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={async () => {
                    if (!newPaymentName.trim()) return;
                    try {
                      await paymentMethodsAdmin.createPaymentMethod({ name: newPaymentName.trim() });
                      setNewPaymentName('');
                      toast.success('Medio de pago creado');
                    } catch {
                      toast.error('No se pudo crear el medio de pago');
                    }
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {paymentMethodsAdmin.isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}

                {(paymentMethodsAdmin.data || []).map((method) => (
                  <div key={method.id} className="rounded-lg border border-border/30 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {method.isDeleted ? 'Eliminado' : method.isActive ? 'Activo' : 'Inactivo'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!method.isDeleted && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await paymentMethodsAdmin.togglePaymentMethodActive(method.id);
                              } catch {
                                toast.error('No se pudo cambiar estado');
                              }
                            }}
                          >
                            {method.isActive ? 'Desactivar' : 'Activar'}
                          </Button>
                        )}
                        {!method.isDeleted && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingId(method.id);
                              setEditingName(method.name);
                            }}
                          >
                            Editar
                          </Button>
                        )}
                        {!method.isDeleted && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={async () => {
                              if (!window.confirm('¿Eliminar lógicamente este medio de pago?')) return;
                              try {
                                await paymentMethodsAdmin.deletePaymentMethod(method.id);
                                toast.success('Medio de pago desactivado y eliminado lógicamente');
                              } catch {
                                toast.error('No se pudo eliminar');
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {editingId === method.id && (
                      <div className="flex gap-2">
                        <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                        <Button
                          type="button"
                          onClick={async () => {
                            try {
                              await paymentMethodsAdmin.updatePaymentMethod({
                                id: method.id,
                                payload: { name: editingName.trim() },
                              });
                              setEditingId(null);
                              setEditingName('');
                              toast.success('Medio de pago actualizado');
                            } catch {
                              toast.error('No se pudo actualizar');
                            }
                          }}
                        >
                          Guardar
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DesktopShell>
  );
}
