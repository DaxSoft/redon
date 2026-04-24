export interface SparklineProps {
  readonly compact?: boolean;
  readonly danger?: boolean;
  readonly variant?: "line" | "area";
}

const linePoints = "0,30 12,24 24,26 36,16 48,22 60,8 72,18 84,12 96,20 108,10 120,14";
const areaPoints = `${linePoints} 120,54 0,54`;

export function Sparkline({ compact = false, danger = false, variant = "line" }: SparklineProps) {
  const className = danger ? "sparkline sparkline-danger" : "sparkline";
  const height = compact ? 42 : 124;

  return (
    <svg aria-hidden className={className} preserveAspectRatio="none" viewBox={`0 0 120 ${height}`}>
      {variant === "area" ? <polygon points={areaPoints} /> : null}
      <polyline points={linePoints} />
    </svg>
  );
}
