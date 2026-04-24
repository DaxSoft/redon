import { bullMqModule } from "@redon/bullmq-visualizer";
import { redisExplorerModule } from "@redon/redis-explorer";
import { redisLuaModule } from "@redon/redis-lua";
import { redisMetricsModule } from "@redon/redis-metrics";
import { redisPubSubModule } from "@redon/redis-pubsub";
import { redisStreamsModule } from "@redon/redis-streams";
import { redisTypesModule } from "@redon/redis-types";
import type { InspectorModuleManifest } from "@redon/plugin-contracts";

export const registeredModules: readonly InspectorModuleManifest[] = [
  redisExplorerModule,
  redisTypesModule,
  redisMetricsModule,
  bullMqModule,
  redisStreamsModule,
  redisPubSubModule,
  redisLuaModule
];
