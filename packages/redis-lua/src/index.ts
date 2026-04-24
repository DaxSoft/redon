import type { InspectorModuleManifest } from "@redon/plugin-contracts";

export const redisLuaModule: InspectorModuleManifest = {
  id: "redis-lua",
  name: "Redis Lua",
  version: "0.1.0",
  navigation: [
    {
      id: "lua",
      label: "Lua",
      icon: "FileCode2",
      route: "/lua"
    }
  ],
  routes: [
    {
      path: "/lua",
      componentId: "redis-lua.editor"
    }
  ],
  commands: [
    {
      id: "redis-lua.execute",
      title: "Execute Lua script"
    }
  ]
};
