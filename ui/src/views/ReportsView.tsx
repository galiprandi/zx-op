import { BarChart3, CalendarDays, Clock3, DollarSign, Gift, Percent, Timer, TrendingUp, Users } from 'lucide-react';
import { DesktopShell } from '@/components/DesktopShell';
import { GlassCard } from '@/components/GlassCard';
import { StatCard } from '@/components/StatCard';
import { TimeFormatter } from '@/components/TimeFormatter';
import { useReportsSummary } from '@/hooks/useReports';
import { useSocket } from '@/hooks/useSocket';
import { formatCurrency } from '@/lib/currency';

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

export function ReportsView() {
  useSocket();
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useReportsSummary();

  const topKpis = data?.topKpis;
  const salesPeriods = data?.salesPeriods;
  const recentOperationalDaySales = data?.recentOperationalDaySales || [];

  return (
    <DesktopShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold">Reportes</h2>
          <p className="text-muted-foreground">Resumen comercial y operativo de la jornada</p>
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
              <StatCard
                title="Ventas día cerrado"
                value={formatCurrency(topKpis.operationalRevenue)}
                icon={DollarSign}
                color="success"
                description="Ingreso del último día operativo cerrado"
              />
              <StatCard
                title="Minutos vendidos"
                value={topKpis.soldMinutes}
                icon={Clock3}
                color="primary"
                description="Minutos del último día operativo cerrado"
              />
              <StatCard
                title="% ocupación"
                value={`${topKpis.occupancyPct.toFixed(1)}%`}
                icon={Users}
                color="warning"
                description="Ocupación del último día operativo cerrado"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <GlassCard className="py-3">
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
              </GlassCard>

              <GlassCard className="py-3">
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
              </GlassCard>

              <GlassCard className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">General histórico</p>
                    <p className="text-xl font-semibold">{formatCurrency(salesPeriods.lifetime)}</p>
                  </div>
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
              </GlassCard>
            </div>

            <GlassCard>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Últimos 10 días operativos</h3>
                  <p className="text-sm text-muted-foreground">Resumen diario de sesiones y ventas</p>
                </div>

                {recentOperationalDaySales.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Sin datos de ventas todavía</div>
                ) : (
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
                          {recentOperationalDaySales.map((row) => (
                            <tr key={row.operationalDate} className="border-b border-border/20">
                              <td className="py-3 pr-3 font-medium">{row.operationalDate}</td>
                              <td className="py-3 pr-3 text-right">{row.occupancyPct.toFixed(1)}%</td>
                              <td className="py-3 pr-3 text-right">{row.sessionCount}</td>
                              <td className="py-3 pr-3 text-right">
                                <TimeFormatter seconds={row.totalTimeSeconds} state="stop">
                                  {({ minutes }) => <>{minutes} min</>}
                                </TimeFormatter>
                              </td>
                              <td className="py-3 pr-3 text-right">{formatCurrency(row.timeRevenue)}</td>
                              <td className="py-3 pr-3 text-right">{formatCurrency(row.otherRevenue)}</td>
                              <td className="py-3 font-semibold text-right">{formatCurrency(row.totalRevenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:hidden space-y-3">
                      {recentOperationalDaySales.map((row) => (
                        <div key={`mobile-${row.operationalDate}`} className="rounded-lg border border-border/30 p-3 space-y-1 bg-card/40">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">{row.operationalDate}</p>
                            <p className="text-xs text-muted-foreground">
                              Ocup.: {row.occupancyPct.toFixed(1)}% | Usuarios: {row.sessionCount}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Tiempo:{' '}
                            <TimeFormatter seconds={row.totalTimeSeconds} state="stop">
                              {({ minutes }) => <>{minutes} min</>}
                            </TimeFormatter>
                          </p>
                          <p className="text-sm">Tiempo: {formatCurrency(row.timeRevenue)}</p>
                          <p className="text-sm">Otros: {formatCurrency(row.otherRevenue)}</p>
                          <p className="text-sm font-semibold">Total: {formatCurrency(row.totalRevenue)}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </GlassCard>

            <p className="text-xs text-muted-foreground text-center">
              Reportes muestra solo días operativos cerrados. Para ver el día en curso, usa Monitor.
            </p>
          </>
        )}
      </div>
    </DesktopShell>
  );
}
