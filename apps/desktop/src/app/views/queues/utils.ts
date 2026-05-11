import type { EChartsOption } from "echarts";
import type { BullQueueJob } from "@redon/ipc-contracts";

export function toneFromJobStatus(status: BullQueueJob["status"]): "success" | "info" | "warning" | "danger" | "muted" {
  if (status === "completed") return "success";
  if (status === "active" || status === "prioritized") return "info";
  if (status === "delayed" || status === "waiting" || status === "waiting-children") return "warning";
  if (status === "failed" || status === "stalled") return "danger";
  return "muted";
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatWhen(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleString([], { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function safeProgress(value: number | null): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export function buildThroughputChartOption(telemetry: Array<{ timestampIso: string; opsPerSecond: number | null }>): EChartsOption {
  return {
    animation: true,
    grid: { top: 14, right: 12, left: 36, bottom: 24 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#030d06",
      borderColor: "#1eff5a",
      textStyle: { color: "#d4ffe3" },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: telemetry.map((point) => {
        const date = new Date(point.timestampIso);
        return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      }),
      axisLine: { lineStyle: { color: "rgba(30,255,90,0.22)" } },
      axisLabel: { color: "#74b892", fontSize: 11 },
      splitLine: { show: true, lineStyle: { color: "rgba(30,255,90,0.08)" } },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisLabel: { color: "#74b892", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(30,255,90,0.08)" } },
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "none",
        data: telemetry.map((point) => point.opsPerSecond ?? 0),
        lineStyle: { color: "#1eff5a", width: 2.3 },
        areaStyle: { color: "rgba(30,255,90,0.18)" },
      },
    ],
  };
}

export function buildHealthDonutOption(input: { healthy: number; warning: number; paused: number; failing: number }): EChartsOption {
  return {
    animation: false,
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: ["58%", "78%"],
        avoidLabelOverlap: false,
        label: { show: false },
        labelLine: { show: false },
        data: [
          { value: input.healthy, name: "Healthy", itemStyle: { color: "#45e66f" } },
          { value: input.warning, name: "Warning", itemStyle: { color: "#dcb65c" } },
          { value: input.paused, name: "Paused", itemStyle: { color: "#5d7a67" } },
          { value: input.failing, name: "Failing", itemStyle: { color: "#f1655c" } },
        ],
      },
    ],
  };
}

export function buildMiniMetricOption(data: readonly number[], color: string): EChartsOption {
  const points = Array.from(data);
  return {
    animation: false,
    grid: { top: 0, right: 0, bottom: 0, left: 0 },
    xAxis: {
      type: "category",
      show: false,
      boundaryGap: false,
      data: data.map((_, index) => index),
    },
    yAxis: {
      type: "value",
      show: false,
      min: 0,
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "none",
        data: points,
        lineStyle: { color, width: 1.8 },
        areaStyle: { color: `${color}33` },
      },
    ],
  };
}
