import type { InspectorModuleManifest } from "@redon/plugin-contracts";

export const redisStreamsModule: InspectorModuleManifest = {
  id: "redis-streams",
  name: "Redis Streams",
  version: "0.1.0",
  navigation: [
    {
      id: "streams",
      label: "Streams",
      icon: "Workflow",
      route: "/streams"
    }
  ],
  routes: [
    {
      path: "/streams",
      componentId: "redis-streams.dashboard"
    }
  ],
  commands: [
    {
      id: "redis-streams.refresh",
      title: "Refresh streams"
    }
  ]
};
