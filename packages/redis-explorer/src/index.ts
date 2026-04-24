import type { InspectorModuleManifest } from "@redon/plugin-contracts";

export const redisExplorerModule: InspectorModuleManifest = {
  id: "redis-explorer",
  name: "Redis Explorer",
  version: "0.1.0",
  navigation: [
    {
      id: "explorer",
      label: "Explorer",
      icon: "Folder",
      route: "/explorer"
    },
    {
      id: "keys",
      label: "Keys",
      icon: "KeyRound",
      route: "/keys"
    }
  ],
  routes: [
    {
      path: "/explorer",
      componentId: "redis-explorer.browser"
    },
    {
      path: "/keys",
      componentId: "redis-explorer.keys"
    }
  ],
  commands: [
    {
      id: "redis-explorer.scan",
      title: "Scan keys"
    }
  ]
};
