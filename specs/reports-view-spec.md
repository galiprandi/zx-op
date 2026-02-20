# Reports View Spec (Closed Operational Days Only)

## Scope
This spec defines the reporting behavior for `/reports`.

## Critical Rule
Reports must **never** include the in-progress operational day.

- The Monitor is the source for in-progress operational visibility.
- Reports are the source for validated historical/closed-day analysis.

## Operational Day Definition
- Operational day boundaries are defined by:
  - `SystemSetting.timezone`
  - `SystemSetting.operationalDayStart`
- A day is considered **closed** only after reaching the next operational boundary.

## Data Windows
- Top KPI cards (`Ventas`, `Minutos vendidos`, `% ocupación`) use the **last closed operational day**.
- Table (`Historial de jornadas operativas cerradas`) uses **paginated** closed operational days with activity.
  - Default page size: **15** rows.
  - Sorted by most recent closed day first.
- Table includes `Prom. / vuelta` (average seconds per lap) for each closed day row.
- Period cards:
  - `Últimos 7 días`: last 7 closed operational days.
  - `Últimos 30 días`: last 30 closed operational days.
  - `General histórico`: all data strictly before current operational day start.

## Occupancy in Reports
- Daily occupancy is computed on closed-day data only.
- Formula:
  - `occupancyPct = totalTimeSeconds / (maxOccupancy * 24h) * 100`

## Lap Pace Metric in Reports
- Daily lap pace is computed on closed-day data only.
- Scope: only sessions with `lapsCount > 0` in each closed-day window.
- Formula (weighted):
  - `averageSecondsPerLap = sum(accumulatedSeconds) / sum(lapsCount)`
- Fallback:
  - If `sum(lapsCount) = 0`, the value is `N/A` in UI.

## Exclusions
- If a closed day has no transactions, it is omitted from the paginated table.
- No metric in Reports may include in-progress day transactions.

## Day Detail
- Clicking a row in the closed-day history opens a **day detail panel**.
- Day detail uses monitor-style cards for:
  - Operational KPIs (sessions, sold minutes, occupancy, laps, average seconds per lap).
  - Commercial KPIs and top sold products for that closed day.
- Day detail is available only for **closed** operational days.
