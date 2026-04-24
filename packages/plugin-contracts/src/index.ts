export interface NavigationItemManifest {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly route: string;
}

export interface RouteManifest {
  readonly path: string;
  readonly componentId: string;
}

export interface CommandManifest {
  readonly id: string;
  readonly title: string;
}

export interface InspectorModuleManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly navigation: readonly NavigationItemManifest[];
  readonly routes: readonly RouteManifest[];
  readonly commands: readonly CommandManifest[];
}

export type RedisCommandCapability =
  | "redis.read"
  | "redis.write"
  | "redis.admin"
  | "redis.pubsub"
  | "redis.lua"
  | "bullmq.manage";
