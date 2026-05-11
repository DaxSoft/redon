import express from "express";
import cors from "cors";
import { prisma } from "@redon/local-db";
import { testConnection, createRuntimeClient } from "@redon/redis-connections";
import { 
  testConnectionCommand, 
  createProfileCommand,
  scanKeysCommand,
  getHashCommand,
  getStringCommand,
  getMetricsCommand,
  openConnectionCommand,
  closeConnectionCommand,
  listQueuesCommand,
  listJobsCommand,
  pauseQueueCommand,
  resumeQueueCommand,
  retryFailedJobsCommand,
  cleanCompletedJobsCommand,
  retryJobCommand,
  promoteJobCommand,
  removeJobCommand,
  getTelemetryCommand
} from "@redon/ipc-contracts";
import { readKeySummary } from "@redon/redis-core";
import { BullMqService } from "./bullmq-service.js";

const app = express();
app.use(cors());
app.use(express.json());

const activeClients = new Map<string, any>();

setInterval(async () => {
    for (const [connectionId, runtimeClient] of activeClients.entries()) {
        try {
            const info = await runtimeClient.client.info();
            const parseInfo = (str: string, key: string) => {
                const match = str.match(new RegExp(`${key}:(.*)`));
                return match?.[1]?.trim() ?? "0";
            };

            const memoryUsage = parseInfo(info, "used_memory");
            const opsPerSec = parseInt(parseInfo(info, "instantaneous_ops_per_sec"), 10);
            const connectedClients = parseInt(parseInfo(info, "connected_clients"), 10);
            
            const hits = parseInt(parseInfo(info, "keyspace_hits"), 10);
            const misses = parseInt(parseInfo(info, "keyspace_misses"), 10);
            const hitRate = hits + misses === 0 ? 0 : (hits / (hits + misses)) * 100;

            await prisma.metricTelemetry.create({
                data: {
                    connectionId,
                    timestampIso: new Date().toISOString(),
                    opsPerSecond: opsPerSec,
                    usedMemoryBytes: parseInt(memoryUsage, 10),
                    connectedClients,
                    hitRate
                }
            });

            // Cleanup old telemetry (keep last 1 hour, approx 720 points per connection if 5s interval)
            const count = await prisma.metricTelemetry.count({ where: { connectionId } });
            if (count > 720) {
                 const oldest = await prisma.metricTelemetry.findMany({
                     where: { connectionId },
                     orderBy: { timestampIso: 'asc' },
                     take: count - 720
                 });
                 if (oldest.length > 0) {
                     await prisma.metricTelemetry.deleteMany({
                         where: {
                             id: { in: oldest.map((o: { id: string }) => o.id) }
                         }
                     });
                 }
            }

        } catch (e) {
            console.error("Telemetry error", e);
        }
    }
}, 5000);

app.post("/ipc/connection.listProfiles", async (req, res) => {
  try {
    const profiles = await prisma.connectionProfile.findMany();
    res.json({
      success: true,
      data: profiles.map((p: any) => ({
        ...p,
        tlsAllowSelfSigned: p.tlsAllowSelfSigned ?? false,
        tags: p.tags ? JSON.parse(p.tags) : []
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/ipc/connection.createProfile", async (req, res) => {
  try {
    const parsed = createProfileCommand.requestSchema.parse(req.body);
    const profile = await prisma.connectionProfile.create({
      data: {
        ...parsed,
        tags: JSON.stringify(parsed.tags)
      }
    });
    res.json({ success: true, data: { ...profile, tlsAllowSelfSigned: profile.tlsAllowSelfSigned ?? false, tags: parsed.tags } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/ipc/connection.test", async (req, res) => {
  try {
    const parsed = testConnectionCommand.requestSchema.parse(req.body);
    const result = await testConnection({ profile: parsed.profile, password: parsed.password ?? null });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/ipc/connection.open", async (req, res) => {
  try {
    const parsed = openConnectionCommand.requestSchema.parse(req.body);
    const profile = await prisma.connectionProfile.findUnique({ where: { id: parsed.connectionId } });
    if (!profile) throw new Error("Profile not found");
    
    if (activeClients.has(parsed.connectionId)) {
        await activeClients.get(parsed.connectionId).client.disconnect();
    }

    const runtimeClient = createRuntimeClient({
        profile: { ...profile, tlsAllowSelfSigned: profile.tlsAllowSelfSigned ?? false, tags: profile.tags ? JSON.parse(profile.tags) : [] },
        password: parsed.password ?? null 
    });
    
    await runtimeClient.client.ping();
    activeClients.set(parsed.connectionId, runtimeClient);

    res.json({ success: true, data: { success: true } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/ipc/connection.close", async (req, res) => {
  try {
    const parsed = closeConnectionCommand.requestSchema.parse(req.body);
    if (activeClients.has(parsed.connectionId)) {
        await activeClients.get(parsed.connectionId).client.disconnect();
        activeClients.delete(parsed.connectionId);
    }
    res.json({ success: true, data: { success: true } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/ipc/redis.scanKeys", async (req, res) => {
  try {
    const parsed = scanKeysCommand.requestSchema.parse(req.body);
    const runtimeClient = activeClients.get(parsed.connectionId);
    if (!runtimeClient) throw new Error("Connection not open");

    if (parsed.database !== runtimeClient.client.options.db) {
        await runtimeClient.client.select(parsed.database);
    }

    const [nextCursor, keys] = await runtimeClient.client.scan(parsed.cursor, "MATCH", parsed.pattern, "COUNT", parsed.count);
    
    const keySummaries = [];
    for (const key of keys) {
        const summary = await readKeySummary(runtimeClient.client, key);
        keySummaries.push(summary);
    }

    res.json({ success: true, data: { cursor: nextCursor, keys: keySummaries } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/ipc/redis.getHash", async (req, res) => {
    try {
      const parsed = getHashCommand.requestSchema.parse(req.body);
      const runtimeClient = activeClients.get(parsed.connectionId);
      if (!runtimeClient) throw new Error("Connection not open");
  
      const hash = await runtimeClient.client.hgetall(parsed.key);
      const entries = Object.entries(hash);
      
      res.json({ success: true, data: entries });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/redis.getString", async (req, res) => {
    try {
      const parsed = getStringCommand.requestSchema.parse(req.body);
      const runtimeClient = activeClients.get(parsed.connectionId);
      if (!runtimeClient) throw new Error("Connection not open");
  
      const val = await runtimeClient.client.get(parsed.key);
      
      res.json({ success: true, data: val });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/redis.getMetrics", async (req, res) => {
    try {
      const parsed = getMetricsCommand.requestSchema.parse(req.body);
      const runtimeClient = activeClients.get(parsed.connectionId);
      if (!runtimeClient) throw new Error("Connection not open");
  
      const info = await runtimeClient.client.info();
      
      const parseInfo = (str: string, key: string) => {
          const match = str.match(new RegExp(`${key}:(.*)`));
          return match?.[1]?.trim() ?? "0";
      };

      const memoryUsage = parseInfo(info, "used_memory_human");
      const opsPerSec = parseInt(parseInfo(info, "instantaneous_ops_per_sec"), 10);
      const connectedClients = parseInt(parseInfo(info, "connected_clients"), 10);
      const expiredKeys = parseInt(parseInfo(info, "expired_keys"), 10);
      const keyspace = parseInfo(info, "db0"); 
      const totalKeysMatch = keyspace.match(/keys=(\d+)/);
      const totalKeysValue = totalKeysMatch?.[1];
      const totalKeys = totalKeysValue ? parseInt(totalKeysValue, 10) : 0;
      
      const hits = parseInt(parseInfo(info, "keyspace_hits"), 10);
      const misses = parseInt(parseInfo(info, "keyspace_misses"), 10);
      const hitRate = hits + misses === 0 ? "0%" : ((hits / (hits + misses)) * 100).toFixed(2) + "%";

      res.json({ success: true, data: {
          memoryUsage,
          opsPerSec,
          hitRate,
          connectedClients,
          expiredKeys,
          totalKeys
      } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/bullmq.listQueues", async (req, res) => {
    try {
        const parsed = listQueuesCommand.requestSchema.parse(req.body);
        const runtimeClient = activeClients.get(parsed.connectionId);
        if (!runtimeClient) throw new Error("Connection not open");
        const service = new BullMqService(runtimeClient);
        const result = await service.listQueues();
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/bullmq.listJobs", async (req, res) => {
    try {
        const parsed = listJobsCommand.requestSchema.parse(req.body);
        const runtimeClient = activeClients.get(parsed.connectionId);
        if (!runtimeClient) throw new Error("Connection not open");
        const service = new BullMqService(runtimeClient);
        const result = await service.listJobs(parsed.queueName, parsed.prefix);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/bullmq.pauseQueue", async (req, res) => {
    try {
        const parsed = pauseQueueCommand.requestSchema.parse(req.body);
        const runtimeClient = activeClients.get(parsed.connectionId);
        if (!runtimeClient) throw new Error("Connection not open");
        const service = new BullMqService(runtimeClient);
        await service.pauseQueue(parsed.queueName, parsed.prefix);
        res.json({ success: true, data: { success: true } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/bullmq.resumeQueue", async (req, res) => {
    try {
        const parsed = resumeQueueCommand.requestSchema.parse(req.body);
        const runtimeClient = activeClients.get(parsed.connectionId);
        if (!runtimeClient) throw new Error("Connection not open");
        const service = new BullMqService(runtimeClient);
        await service.resumeQueue(parsed.queueName, parsed.prefix);
        res.json({ success: true, data: { success: true } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/bullmq.retryFailedJobs", async (req, res) => {
    try {
        const parsed = retryFailedJobsCommand.requestSchema.parse(req.body);
        const runtimeClient = activeClients.get(parsed.connectionId);
        if (!runtimeClient) throw new Error("Connection not open");
        const service = new BullMqService(runtimeClient);
        await service.retryFailedJobs(parsed.queueName, parsed.prefix);
        res.json({ success: true, data: { success: true } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/bullmq.cleanCompletedJobs", async (req, res) => {
    try {
        const parsed = cleanCompletedJobsCommand.requestSchema.parse(req.body);
        const runtimeClient = activeClients.get(parsed.connectionId);
        if (!runtimeClient) throw new Error("Connection not open");
        const service = new BullMqService(runtimeClient);
        await service.cleanCompletedJobs(parsed.queueName, parsed.prefix);
        res.json({ success: true, data: { success: true } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/bullmq.retryJob", async (req, res) => {
    try {
        const parsed = retryJobCommand.requestSchema.parse(req.body);
        const runtimeClient = activeClients.get(parsed.connectionId);
        if (!runtimeClient) throw new Error("Connection not open");
        const service = new BullMqService(runtimeClient);
        await service.retryJob(parsed.queueName, parsed.jobId, parsed.prefix);
        res.json({ success: true, data: { success: true } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/bullmq.promoteJob", async (req, res) => {
    try {
        const parsed = promoteJobCommand.requestSchema.parse(req.body);
        const runtimeClient = activeClients.get(parsed.connectionId);
        if (!runtimeClient) throw new Error("Connection not open");
        const service = new BullMqService(runtimeClient);
        await service.promoteJob(parsed.queueName, parsed.jobId, parsed.prefix);
        res.json({ success: true, data: { success: true } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/bullmq.removeJob", async (req, res) => {
    try {
        const parsed = removeJobCommand.requestSchema.parse(req.body);
        const runtimeClient = activeClients.get(parsed.connectionId);
        if (!runtimeClient) throw new Error("Connection not open");
        const service = new BullMqService(runtimeClient);
        await service.removeJob(parsed.queueName, parsed.jobId, parsed.prefix);
        res.json({ success: true, data: { success: true } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/ipc/redis.getTelemetry", async (req, res) => {
    try {
        const parsed = getTelemetryCommand.requestSchema.parse(req.body);
        const records = await prisma.metricTelemetry.findMany({
            where: { connectionId: parsed.connectionId },
            orderBy: { timestampIso: 'asc' },
            take: 120
        });

        res.json({ success: true, data: records });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 1421;
app.listen(PORT, () => {
  console.log(`Sidecar listening on http://localhost:${PORT}`);
});
