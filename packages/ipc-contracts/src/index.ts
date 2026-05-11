import { z } from "zod";

export interface IpcCommandDefinition<TRequest, TResponse> {
  readonly name: string;
  readonly requestSchema: z.ZodType<TRequest>;
  readonly responseSchema: z.ZodType<TResponse>;
}

export const connectionProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  username: z.string().nullable(),
  database: z.number().int().min(0),
  tlsEnabled: z.boolean(),
  tlsAllowSelfSigned: z.boolean(),
  credentialRef: z.string().nullable(),
  color: z.string().nullable(),
  tags: z.array(z.string())
});

export const runtimeConnectionSchema = z.object({
  id: z.string(),
  profileId: z.string(),
  database: z.number().int().min(0),
  status: z.enum(["idle", "connecting", "connected", "degraded", "reconnecting", "disconnected", "failed"]),
  latencyMs: z.number().nullable(),
  openedAtIso: z.string()
});

export const redisDataTypeSchema = z.enum(["string", "hash", "list", "set", "zset", "stream", "json", "none"]);

export const redisKeySummarySchema = z.object({
  key: z.string(),
  type: redisDataTypeSchema,
  ttlSeconds: z.number().nullable(),
  memoryBytes: z.number().nullable(),
  encoding: z.string().nullable()
});

export const listProfilesCommand: IpcCommandDefinition<undefined, readonly z.infer<typeof connectionProfileSchema>[]> = {
  name: "connection.listProfiles",
  requestSchema: z.undefined(),
  responseSchema: z.array(connectionProfileSchema)
};

export const testConnectionCommand = {
  name: "connection.test",
  requestSchema: connectionProfileSchema,
  responseSchema: z.object({
    ok: z.boolean(),
    latencyMs: z.number().nullable(),
    message: z.string()
  })
} satisfies IpcCommandDefinition<z.infer<typeof connectionProfileSchema>, { readonly ok: boolean; readonly latencyMs: number | null; readonly message: string }>;

export const scanKeysCommand = {
  name: "redis.scanKeys",
  requestSchema: z.object({
    connectionId: z.string(),
    database: z.number().int().min(0),
    cursor: z.string(),
    pattern: z.string(),
    count: z.number().int().min(1).max(1000)
  }),
  responseSchema: z.object({
    cursor: z.string(),
    keys: z.array(redisKeySummarySchema)
  })
};

export const createProfileCommand = {
  name: "connection.createProfile",
  requestSchema: connectionProfileSchema,
  responseSchema: connectionProfileSchema
};

export const getHashCommand = {
  name: "redis.getHash",
  requestSchema: z.object({
    connectionId: z.string(),
    key: z.string()
  }),
  responseSchema: z.array(z.tuple([z.string(), z.string()]))
};

export const getStringCommand = {
  name: "redis.getString",
  requestSchema: z.object({
    connectionId: z.string(),
    key: z.string()
  }),
  responseSchema: z.string().nullable()
};

export const getMetricsCommand = {
  name: "redis.getMetrics",
  requestSchema: z.object({
    connectionId: z.string()
  }),
  responseSchema: z.object({
    memoryUsage: z.string(),
    opsPerSec: z.number(),
    hitRate: z.string(),
    connectedClients: z.number(),
    expiredKeys: z.number(),
    totalKeys: z.number()
  })
};

export const openConnectionCommand = {
  name: "connection.open",
  requestSchema: z.object({
    connectionId: z.string()
  }),
  responseSchema: z.object({
    success: z.boolean(),
    error: z.string().optional()
  })
};

export const closeConnectionCommand = {
  name: "connection.close",
  requestSchema: z.object({
    connectionId: z.string()
  }),
  responseSchema: z.object({
    success: z.boolean()
  })
};

export const listQueuesCommand = {
  name: "bullmq.listQueues",
  requestSchema: z.object({
    connectionId: z.string()
  }),
  responseSchema: z.array(z.object({
    name: z.string(),
    prefix: z.string(),
    waiting: z.number(),
    active: z.number(),
    delayed: z.number(),
    completed: z.number(),
    failed: z.number(),
    paused: z.boolean()
  }))
};

export const listJobsCommand = {
  name: "bullmq.listJobs",
  requestSchema: z.object({
    connectionId: z.string(),
    queueName: z.string(),
    prefix: z.string().optional()
  }),
  responseSchema: z.array(z.object({
    id: z.string(),
    queueName: z.string(),
    name: z.string(),
    status: z.enum(["waiting", "active", "delayed", "completed", "failed", "retrying", "stalled", "paused"]),
    attemptsMade: z.number(),
    attemptsLimit: z.number().nullable(),
    progress: z.number().nullable(),
    createdAt: z.string().nullable(),
    processedAt: z.string().nullable(),
    finishedAt: z.string().nullable(),
    durationMs: z.number().nullable()
  }))
};

export const getTelemetryCommand = {
  name: "redis.getTelemetry",
  requestSchema: z.object({
    connectionId: z.string(),
    queueName: z.string().optional()
  }),
  responseSchema: z.array(z.object({
    timestampIso: z.string(),
    opsPerSecond: z.number().nullable(),
    usedMemoryBytes: z.number().nullable(),
    connectedClients: z.number().nullable(),
    hitRate: z.number().nullable()
  }))
};

export const ipcCommands = [
  listProfilesCommand,
  testConnectionCommand,
  scanKeysCommand,
  createProfileCommand,
  getHashCommand,
  getStringCommand,
  getMetricsCommand,
  openConnectionCommand,
  closeConnectionCommand,
  listQueuesCommand,
  listJobsCommand,
  getTelemetryCommand
] as const;

export type ConnectionProfile = z.infer<typeof connectionProfileSchema>;
export type RuntimeConnection = z.infer<typeof runtimeConnectionSchema>;
export type RedisDataType = z.infer<typeof redisDataTypeSchema>;
export type RedisKeySummary = z.infer<typeof redisKeySummarySchema>;
