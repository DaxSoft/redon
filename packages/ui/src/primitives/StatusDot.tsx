import type { BadgeTone } from "./Badge";

export interface StatusDotProps {
  readonly label: string;
  readonly tone: BadgeTone;
}

export function StatusDot({ label, tone }: StatusDotProps) {
  return (
    <span className={`status-dot status-dot-${tone}`}>
      <i />
      {label}
    </span>
  );
}
