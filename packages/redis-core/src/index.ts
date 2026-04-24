import Redis from "ioredis";

import type { RedisDataType, RedisKeySummary } from "@redon/ipc-contracts";

export interface RedisClientHandle {
  readonly connectionId: string;
  readonly database: number;
}

export interface RedisConnectionOptions {
  readonly host: string;
  readonly port: number;
  readonly username: string | null;
  readonly password: string | null;
  readonly database: number;
  readonly tlsEnabled: boolean;
}

export interface RedisRuntimeClient {
  readonly handle: RedisClientHandle;
  readonly client: Redis;
}

export function createRedisClient(connectionId: string, options: RedisConnectionOptions): RedisRuntimeClient {
  const client = new Redis({
    host: options.host,
    port: options.port,
    username: options.username ?? undefined,
    password: options.password ?? undefined,
    db: options.database,
    tls: options.tlsEnabled ? {} : undefined,
    lazyConnect: true,
    maxRetriesPerRequest: 2
  });

  return {
    handle: {
      connectionId,
      database: options.database
    },
    client
  };
}

export function decodeRedisDataType(value: string): RedisDataType {
  if (value === "string") return "string";
  if (value === "hash") return "hash";
  if (value === "list") return "list";
  if (value === "set") return "set";
  if (value === "zset") return "zset";
  if (value === "stream") return "stream";
  if (value === "ReJSON-RL") return "json";
  return "none";
}

export async function readKeySummary(client: Redis, key: string): Promise<RedisKeySummary> {
  const [type, ttl, memory] = await Promise.all([
    client.type(key),
    client.ttl(key),
    client.memory("USAGE", key)
  ]);

  return {
    key,
    type: decodeRedisDataType(type),
    ttlSeconds: ttl >= 0 ? ttl : null,
    memoryBytes: typeof memory === "number" ? memory : null,
    encoding: null
  };
}

export async function scanKeys(client: Redis, cursor: string, pattern: string, count: number): Promise<readonly string[]> {
  const result = await client.scan(cursor, "MATCH", pattern, "COUNT", count);
  return result[1];
}
