import type { InspectorModuleManifest } from "@redon/plugin-contracts";

export interface RedisMetricSample {
  readonly timestampIso: string;
  readonly opsPerSecond: number;
  readonly usedMemoryBytes: number;
  readonly connectedClients: number;
  readonly hitRate: number;
}

export const redisMetricsModule: InspectorModuleManifest = {
  id: "redis-metrics",
  name: "Redis Metrics",
  version: "0.1.0",
  navigation: [
    {
      id: "metrics",
      label: "Metrics",
      icon: "BarChart3",
      route: "/metrics"
    }
  ],
  routes: [
    {
      path: "/metrics",
      componentId: "redis-metrics.dashboard"
    }
  ],
  commands: [
    {
      id: "redis-metrics.refresh",
      title: "Refresh Redis metrics"
    }
  ]
};
