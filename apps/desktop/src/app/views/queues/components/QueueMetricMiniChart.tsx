import ReactECharts from "echarts-for-react";
import { buildMiniMetricOption } from "../utils";

interface QueueMetricMiniChartProps {
  readonly data: readonly number[];
  readonly tone?: "success" | "warning" | "danger";
}

const TONE_COLOR: Record<NonNullable<QueueMetricMiniChartProps["tone"]>, string> = {
  success: "#1eff5a",
  warning: "#f4d35e",
  danger: "#f1655c",
};

export function QueueMetricMiniChart({ data, tone = "success" }: QueueMetricMiniChartProps) {
  const option = buildMiniMetricOption(data.length > 1 ? data : [0, ...data, 0], TONE_COLOR[tone]);
  return (
    <div className="queue-mini-chart">
      <ReactECharts option={option} notMerge style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

