import type { ReactNode } from "react";

import { Sparkline } from "./Sparkline";

export interface MetricCardProps {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon?: ReactNode;
  readonly sparkline?: boolean;
  readonly trend?: "up" | "down";
  readonly danger?: boolean;
}

export function MetricCard({ label, value, detail, icon, sparkline = false, trend = "up", danger = false }: MetricCardProps) {
  const toneClass = danger ? "metric-card metric-danger" : "metric-card";

  return (
    <article className={toneClass}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <em>{trend === "up" ? "↑" : "↓"} {detail}</em>
      </div>
      {icon !== undefined ? <i>{icon}</i> : null}
      {sparkline ? <Sparkline compact={true} danger={danger} /> : null}
    </article>
  );
}
