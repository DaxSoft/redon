import type { RedisDataType } from "@redon/ipc-contracts";
import type { InspectorModuleManifest } from "@redon/plugin-contracts";

export interface RedisTypeInspectorDefinition {
  readonly type: RedisDataType;
  readonly label: string;
  readonly supportsPagination: boolean;
  readonly supportsInlineEdit: boolean;
  readonly componentId: string;
}

export const redisTypeInspectors: readonly RedisTypeInspectorDefinition[] = [
  { type: "string", label: "String", supportsPagination: false, supportsInlineEdit: true, componentId: "redis-types.string" },
  { type: "hash", label: "Hash", supportsPagination: true, supportsInlineEdit: true, componentId: "redis-types.hash" },
  { type: "list", label: "List", supportsPagination: true, supportsInlineEdit: true, componentId: "redis-types.list" },
  { type: "set", label: "Set", supportsPagination: true, supportsInlineEdit: true, componentId: "redis-types.set" },
  { type: "zset", label: "Sorted Set", supportsPagination: true, supportsInlineEdit: true, componentId: "redis-types.zset" },
  { type: "stream", label: "Stream", supportsPagination: true, supportsInlineEdit: false, componentId: "redis-types.stream" },
  { type: "json", label: "JSON", supportsPagination: false, supportsInlineEdit: true, componentId: "redis-types.json" }
];

export const redisTypesModule: InspectorModuleManifest = {
  id: "redis-types",
  name: "Redis Types",
  version: "0.1.0",
  navigation: [
    {
      id: "types",
      label: "Types",
      icon: "Layers3",
      route: "/types"
    }
  ],
  routes: [
    {
      path: "/types",
      componentId: "redis-types.overview"
    }
  ],
  commands: [
    {
      id: "redis-types.refresh",
      title: "Refresh selected value"
    }
  ]
};
