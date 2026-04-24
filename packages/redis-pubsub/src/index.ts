import type { InspectorModuleManifest } from "@redon/plugin-contracts";

export const redisPubSubModule: InspectorModuleManifest = {
  id: "redis-pubsub",
  name: "Redis Pub/Sub",
  version: "0.1.0",
  navigation: [
    {
      id: "pubsub",
      label: "Pub/Sub",
      icon: "Radio",
      route: "/pubsub"
    }
  ],
  routes: [
    {
      path: "/pubsub",
      componentId: "redis-pubsub.live"
    }
  ],
  commands: [
    {
      id: "redis-pubsub.pause",
      title: "Pause Pub/Sub stream"
    }
  ]
};
