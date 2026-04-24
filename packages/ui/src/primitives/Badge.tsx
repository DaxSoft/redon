import type { ReactNode } from "react";

export type BadgeTone = "success" | "info" | "warning" | "danger" | "muted";

export interface BadgeProps {
  readonly children: ReactNode;
  readonly tone?: BadgeTone;
}

export function Badge({ children, tone = "muted" }: BadgeProps) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
