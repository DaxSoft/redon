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

export const ipcCommands = [
  listProfilesCommand,
  testConnectionCommand,
  scanKeysCommand
] as const;

export type ConnectionProfile = z.infer<typeof connectionProfileSchema>;
export type RuntimeConnection = z.infer<typeof runtimeConnectionSchema>;
export type RedisDataType = z.infer<typeof redisDataTypeSchema>;
export type RedisKeySummary = z.infer<typeof redisKeySummarySchema>;
