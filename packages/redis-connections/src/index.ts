import type { ConnectionProfile } from "@redon/ipc-contracts";
import { createRedisClient, type RedisRuntimeClient } from "@redon/redis-core";

export type RedisConnectionStatus = "idle" | "connecting" | "connected" | "degraded" | "reconnecting" | "disconnected" | "failed";

export interface RuntimeRedisConnection {
  readonly id: string;
  readonly profileId: string;
  readonly database: number;
  readonly status: RedisConnectionStatus;
  readonly latencyMs: number | null;
  readonly openedAt: Date;
}

export interface OpenConnectionInput {
  readonly profile: ConnectionProfile;
  readonly password: string | null;
}

export async function testConnection(input: OpenConnectionInput): Promise<{ readonly ok: boolean; readonly latencyMs: number | null; readonly message: string }> {
  const runtime = createRuntimeClient(input);
  const start = performance.now();

  try {
    await runtime.client.ping();
    return {
      ok: true,
      latencyMs: Math.round((performance.now() - start) * 100) / 100,
      message: "Connected"
    };
  } finally {
    runtime.client.disconnect();
  }
}

export function createRuntimeClient(input: OpenConnectionInput): RedisRuntimeClient {
  return createRedisClient(input.profile.id, {
    host: input.profile.host,
    port: input.profile.port,
    username: input.profile.username,
    password: input.password,
    database: input.profile.database,
    tlsEnabled: input.profile.tlsEnabled,
    tlsAllowSelfSigned: input.profile.tlsAllowSelfSigned
  });
}
