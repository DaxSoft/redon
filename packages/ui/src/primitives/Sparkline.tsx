export interface SparklineProps {
  readonly compact?: boolean;
  readonly danger?: boolean;
  readonly variant?: "line" | "area";
  readonly data?: number[];
}

const defaultLinePoints = "0,30 12,24 24,26 36,16 48,22 60,8 72,18 84,12 96,20 108,10 120,14";
const defaultAreaPoints = `${defaultLinePoints} 120,54 0,54`;

export function Sparkline({ compact = false, danger = false, variant = "line", data }: SparklineProps) {
  const className = danger ? "sparkline sparkline-danger" : "sparkline";
  const height = compact ? 42 : 124;

  let linePoints = defaultLinePoints;
  let areaPoints = defaultAreaPoints;

  if (data && data.length > 0) {
      const max = Math.max(...data, 1);
      const min = 0;
      const range = max - min;
      const stepX = 120 / Math.max(data.length - 1, 1);
      
      const pts = data.map((d, i) => {
          const x = i * stepX;
          const y = height - ((d - min) / range) * height;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      linePoints = pts.join(" ");
      areaPoints = `${linePoints} 120,${height} 0,${height}`;
  }

  return (
    <svg aria-hidden className={className} preserveAspectRatio="none" viewBox={`0 0 120 ${height}`}>
      {variant === "area" ? <polygon points={areaPoints} /> : null}
      <polyline points={linePoints} />
    </svg>
  );
}
