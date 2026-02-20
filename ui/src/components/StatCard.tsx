import { KPICard, type KPICardProps } from "./KPICard";

export type StatCardProps = KPICardProps;

export function StatCard(props: StatCardProps) {
  return <KPICard {...props} />;
}
