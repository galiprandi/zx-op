import { useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DollarSign,
  Gift,
  Percent,
  Timer,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { DesktopShell } from '@/components/DesktopShell';
import { GlassCard } from '@/components/GlassCard';
import { KPICard } from '@/components/KPICard';
import { modalOverlayClass, modalPanelBaseClass } from '@/components/modalStyles';
import { SurfaceCard } from '@/components/SurfaceCard';
import { TimeFormatter } from '@/components/TimeFormatter';
import { useOperationalDayDetail, useOperationalDaysPage, useReportsSummary } from '@/hooks/useReports';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency } from '@/lib/currency';

const PAGE_SIZE = 15;

function formatDelta(value: number | null): string {
  if (value === null) {
    return 'Sin comparación';
  }

  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
}

function formatRelativeDate(value: string): string {
  return new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StaticTime({ seconds }: { seconds: number }) {
  const safeSeconds = Math.max(0, Math.round(seconds));

  return (
    <TimeFormatter seconds={safeSeconds} state="stop">
      {({ formatted }) => <span>{formatted}</span>}
    </TimeFormatter>
  );
}

export function ReportsView() {
  useSocket();
  const [page, setPage] = useState(1);
  const [selectedOperationalDate, setSelectedOperationalDate] = useState<string | null>(null);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);

  const { data, isLoading, isError, refetch, dataUpdatedAt } = useReportsSummary();
  const {
    data: daysPage,
    isLoading: isLoadingDays,
    isError: isErrorDays,
    refetch: refetchDays,
    isFetching: isFetchingDays,
  } = useOperationalDaysPage(page, PAGE_SIZE);
  const {
    data: dayDetail,
    isLoading: isLoadingDayDetail,
    isError: isErrorDayDetail,
    refetch: refetchDayDetail,
  } = useOperationalDayDetail(selectedOperationalDate);

  const topKpis = data?.topKpis;
  const salesPeriods = data?.salesPeriods;
  const dayItems = daysPage?.items || [];
  useEffect(() => {
    if (dayItems.length > 0 && !selectedOperationalDate) {
      setSelectedOperationalDate(dayItems[0].operationalDateKey);
    }
  }, [dayItems, selectedOperationalDate]);

  useEffect(() => {
    if (selectedOperationalDate && dayItems.length > 0) {
      const existsInPage = dayItems.some((row) => row.operationalDateKey === selectedOperationalDate);
      if (!existsInPage) {
        setSelectedOperationalDate(dayItems[0].operationalDateKey);
      }
    }
  }, [dayItems, selectedOperationalDate]);

  return (
    <DesktopShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold">Reportes</h2>
          <p className="text-muted-foreground">Resumen comercial y operativo de jornadas cerradas</p>
          <p className="text-xs text-muted-foreground">
            Última actualización: {dataUpdatedAt ? formatRelativeDate(new Date(dataUpdatedAt).toISOString()) : 'Sin datos'}
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="h-40 rounded-xl bg-card/40 animate-pulse border border-border/20" />
            ))}
          </div>
        )}

        {isError && (
          <GlassCard>
            <div className="flex items-center justify-between gap-3">
              <p className="text-destructive font-medium">No se pudieron cargar los reportes.</p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Reintentar
              </button>
            </div>
          </GlassCard>
        )}

        {!isLoading && !isError && topKpis && salesPeriods && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title="Ventas día cerrado"
                value={formatCurrency(topKpis.operationalRevenue)}
                icon={DollarSign}
                color="success"
                description="Ingreso del último día operativo cerrado"
              />
              <KPICard
                title="Minutos vendidos"
                value={topKpis.soldMinutes}
                icon={Clock3}
                color="primary"
                description="Minutos del último día operativo cerrado"
              />
              <KPICard
                title="% ocupación"
                value={`${topKpis.occupancyPct.toFixed(1)}%`}
                icon={Users}
                color="warning"
                description="Ocupación del último día operativo cerrado"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SurfaceCard contentPaddingClassName="[&>div]:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Últimos 7 días</p>
                    <p className="text-xl font-semibold">{formatCurrency(salesPeriods.last7OperationalDays)}</p>
                  </div>
                  <div className="text-right">
                    <TrendingUp className="w-4 h-4 text-primary ml-auto" />
                    <p className="text-xs text-muted-foreground">{formatDelta(salesPeriods.weekOverWeekPct)}</p>
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard contentPaddingClassName="[&>div]:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Últimos 30 días</p>
                    <p className="text-xl font-semibold">{formatCurrency(salesPeriods.last30OperationalDays)}</p>
                  </div>
                  <div className="text-right">
                    <TrendingUp className="w-4 h-4 text-primary ml-auto" />
                    <p className="text-xs text-muted-foreground">{formatDelta(salesPeriods.monthOverMonthPct)}</p>
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard contentPaddingClassName="[&>div]:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">General histórico</p>
                    <p className="text-xl font-semibold">{formatCurrency(salesPeriods.lifetime)}</p>
                  </div>
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
              </SurfaceCard>
            </div>

            <SurfaceCard>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold">Historial de jornadas operativas cerradas</h3>
                  <p className="text-sm text-muted-foreground">15 por página · solo jornadas cerradas con actividad</p>
                </div>

                {isErrorDays && (
                  <div className="flex items-center justify-between gap-3 py-4">
                    <p className="text-destructive">No se pudo cargar el historial.</p>
                    <button
                      type="button"
                      onClick={() => void refetchDays()}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {!isErrorDays && isLoadingDays && (
                  <div className="py-8 text-center text-muted-foreground">Cargando jornadas...</div>
                )}

                {!isErrorDays && !isLoadingDays && dayItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Sin jornadas cerradas con actividad</div>
                )}

                {!isErrorDays && !isLoadingDays && dayItems.length > 0 && (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b border-border/30">
                            <th className="py-2 pr-3 font-medium">
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="w-4 h-4" />
                                Fecha
                              </span>
                            </th>
                            <th className="py-2 pr-3 font-medium text-right">
                              <span className="inline-flex items-center justify-end gap-1.5 w-full">
                                <Percent className="w-4 h-4" />
                                Ocup.
                              </span>
                            </th>
                            <th className="py-2 pr-3 font-medium text-right">
                              <span className="inline-flex items-center justify-end gap-1.5 w-full">
                                <Users className="w-4 h-4" />
                                Usuarios
                              </span>
                            </th>
                            <th className="py-2 pr-3 font-medium text-right">
                              <span className="inline-flex items-center justify-end gap-1.5 w-full">
                                <Clock3 className="w-4 h-4" />
                                Total
                              </span>
                            </th>
                            <th className="py-2 pr-3 font-medium text-right">
                              <span className="inline-flex items-center justify-end gap-1.5 w-full">
                                <Timer className="w-4 h-4" />
                                Prom. / vuelta
                              </span>
                            </th>
                            <th className="py-2 pr-3 font-medium text-right">
                              <span className="inline-flex items-center justify-end gap-1.5 w-full">
                                <Timer className="w-4 h-4" />
                                En tiempo
                              </span>
                            </th>
                            <th className="py-2 pr-3 font-medium text-right">
                              <span className="inline-flex items-center justify-end gap-1.5 w-full">
                                <Gift className="w-4 h-4" />
                                En otros
                              </span>
                            </th>
                            <th className="py-2 font-medium text-right">
                              <span className="inline-flex items-center justify-end gap-1.5 w-full">
                                <DollarSign className="w-4 h-4" />
                                Total
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayItems.map((row) => {
                            const isSelected = selectedOperationalDate === row.operationalDateKey;

                            return (
                              <tr
                                key={row.operationalDateKey}
                                className={`border-b border-slate-300/80 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-slate-200/70' : 'hover:bg-slate-200/50'
                                }`}
                                onClick={() => {
                                  setSelectedOperationalDate(row.operationalDateKey);
                                  setIsDayDetailOpen(true);
                                }}
                              >
                                <td className="py-3 pr-3 font-medium">{row.operationalDateLabel}</td>
                                <td className="py-3 pr-3 text-right">{row.occupancyPct.toFixed(1)}%</td>
                                <td className="py-3 pr-3 text-right">{row.sessionCount}</td>
                                <td className="py-3 pr-3 text-right">
                                  <StaticTime seconds={row.totalTimeSeconds} />
                                </td>
                                <td className="py-3 pr-3 text-right">
                                  {row.averageSecondsPerLap === null ? '-' : <StaticTime seconds={row.averageSecondsPerLap} />}
                                </td>
                                <td className="py-3 pr-3 text-right">{formatCurrency(row.timeRevenue)}</td>
                                <td className="py-3 pr-3 text-right">{formatCurrency(row.otherRevenue)}</td>
                                <td className="py-3 font-semibold text-right">{formatCurrency(row.totalRevenue)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:hidden space-y-3">
                      {dayItems.map((row) => {
                        const isSelected = selectedOperationalDate === row.operationalDateKey;

                        return (
                          <button
                            type="button"
                            key={`mobile-${row.operationalDateKey}`}
                            onClick={() => {
                              setSelectedOperationalDate(row.operationalDateKey);
                              setIsDayDetailOpen(true);
                            }}
                            className={`w-full text-left rounded-lg border p-3 space-y-1 bg-slate-100/80 ${
                              isSelected ? 'border-slate-400/60' : 'border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <p className="font-semibold">{row.operationalDateLabel}</p>
                              <p className="text-xs text-muted-foreground">
                                Ocup.: {row.occupancyPct.toFixed(1)}% | Usuarios: {row.sessionCount}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Tiempo: <StaticTime seconds={row.totalTimeSeconds} />
                            </p>
                            <p className="text-sm">
                              Prom. / vuelta:{' '}
                              {row.averageSecondsPerLap === null ? '-' : <StaticTime seconds={row.averageSecondsPerLap} />}
                            </p>
                            <p className="text-sm">Tiempo: {formatCurrency(row.timeRevenue)}</p>
                            <p className="text-sm">Otros: {formatCurrency(row.otherRevenue)}</p>
                            <p className="text-sm font-semibold">Total: {formatCurrency(row.totalRevenue)}</p>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/20">
                      <p className="text-xs text-muted-foreground">
                        Página {daysPage?.page || 1} de {daysPage?.totalPages || 1}
                        {isFetchingDays ? ' · Actualizando...' : ''}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                          disabled={!daysPage?.hasPrev}
                          className="inline-flex items-center gap-1 rounded-lg border border-border/40 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-card/60"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage((prev) => prev + 1)}
                          disabled={!daysPage?.hasNext}
                          className="inline-flex items-center gap-1 rounded-lg border border-border/40 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-card/60"
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </SurfaceCard>

            <p className="text-xs text-muted-foreground text-center">
              Reportes muestra solo días operativos cerrados. Para ver el día en curso, usa Monitor.
            </p>
          </>
        )}
      </div>

      {isDayDetailOpen && (
        <div className={modalOverlayClass}>
          <GlassCard className={`${modalPanelBaseClass} max-w-5xl max-h-[90vh] overflow-y-auto relative`}>
            <button
              type="button"
              onClick={() => setIsDayDetailOpen(false)}
              className="absolute top-4 right-4 rounded-md border border-border/40 p-2 hover:bg-card/70"
              aria-label="Cerrar detalle"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {dayDetail
                    ? `Detalle de la Jornada ${dayDetail.operationalDateLabel} - ${dayDetail.operationalWindow.startTimeLabel} a ${dayDetail.operationalWindow.endTimeLabel}`
                    : 'Detalle de la Jornada'}
                </h3>
                <p className="text-sm text-muted-foreground">Resumen operativo y comercial de la jornada cerrada seleccionada</p>
              </div>

              {selectedOperationalDate && isLoadingDayDetail && (
                <p className="text-sm text-muted-foreground">Cargando detalle de jornada...</p>
              )}

              {selectedOperationalDate && isErrorDayDetail && (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-destructive">No se pudo cargar el detalle de la jornada.</p>
                  <button
                    type="button"
                    onClick={() => void refetchDayDetail()}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {dayDetail && !isLoadingDayDetail && !isErrorDayDetail && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KPICard
                      title="Ventas totales"
                      value={formatCurrency(dayDetail.revenue.totalRevenue)}
                      icon={DollarSign}
                      color="success"
                      description="Facturación total de la jornada"
                    />
                    <KPICard
                      title="Jugadores"
                      value={dayDetail.operations.sessionCount}
                      icon={Users}
                      color="primary"
                      description="Sesiones registradas en la jornada"
                    />
                    <KPICard
                      title="% Ocupación"
                      value={`${dayDetail.operations.occupancyPct.toFixed(1)}%`}
                      icon={Percent}
                      color="warning"
                      description="Ocupación promedio de la jornada"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SurfaceCard contentPaddingClassName="[&>div]:p-4">
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold">Métricas operativas</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Minutos vendidos</span>
                            <span>{dayDetail.operations.soldMinutes}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Ocupación</span>
                            <span>{dayDetail.operations.occupancyPct.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Sesiones</span>
                            <span>{dayDetail.operations.sessionCount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Tiempo total</span>
                            <span><StaticTime seconds={dayDetail.operations.totalTimeSeconds} /></span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Vueltas totales</span>
                            <span>{dayDetail.operations.totalLaps}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Prom. por vuelta</span>
                            <span>
                              {dayDetail.operations.averageSecondsPerLap === null ? '-' : (
                                <StaticTime seconds={dayDetail.operations.averageSecondsPerLap} />
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </SurfaceCard>

                    <SurfaceCard contentPaddingClassName="[&>div]:p-4">
                      <div className="space-y-2">
                        <h4 className="text-base font-semibold">Ventas de la jornada</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Ingreso en tiempo</span>
                            <span>{formatCurrency(dayDetail.revenue.timeRevenue)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Ingreso en otros</span>
                            <span>{formatCurrency(dayDetail.revenue.otherRevenue)}</span>
                          </div>
                          <div className="flex items-center justify-between text-base font-semibold">
                            <span>Total</span>
                            <span>{formatCurrency(dayDetail.revenue.totalRevenue)}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/30">
                          <p className="text-sm font-medium mb-2">Top productos</p>
                          {dayDetail.topProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sin productos para esta jornada</p>
                          ) : (
                            <div className="space-y-2">
                              {dayDetail.topProducts.map((product) => (
                                <div key={product.productId} className="flex items-center justify-between text-sm">
                                  <span className="truncate pr-3">{product.name}</span>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-muted-foreground">{product.totalQuantity} un</span>
                                    <span className="font-medium">{formatCurrency(product.totalRevenue)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </SurfaceCard>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </DesktopShell>
  );
}
