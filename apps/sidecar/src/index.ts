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
import { Queue } from "bullmq";

const app = express();
app.use(cors());
app.use(express.json());

const activeClients = new Map<string, any>();

type BullJobStatus =
  | "waiting"
  | "active"
  | "delayed"
  | "completed"
  | "failed"
  | "retrying"
  | "stalled"
  | "paused"
  | "prioritized"
  | "waiting-children";

function createQueue(runtimeClient: any, queueName: string, prefix?: string) {
  return new Queue(queueName, { connection: runtimeClient.client, prefix: prefix ?? "bull" });
}

function mapBullJobStatus(state: string): BullJobStatus {
  if (state === "waiting-children") return "waiting-children";
  if (state === "prioritized") return "prioritized";
  if (state === "paused") return "paused";
  if (state === "stalled") return "stalled";
  if (state === "retrying") return "retrying";
  if (state === "failed") return "failed";
  if (state === "completed") return "completed";
  if (state === "delayed") return "delayed";
  if (state === "active") return "active";
  return "waiting";
}

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

        let cursor = "0";
        const metaKeys: string[] = [];
        do {
            const [next, keys] = await runtimeClient.client.scan(cursor, "MATCH", "bull:*:meta", "COUNT", 1000);
            cursor = next;
            metaKeys.push(...keys);
        } while (cursor !== "0");

        const uniqueQueueRefs = new Map<string, { name: string; prefix: string }>();
        for (const metaKey of metaKeys) {
            const parts = metaKey.split(":");
            if (parts.length < 3) continue;

            const prefix = parts[0] ?? "bull";
            const name = parts.slice(1, parts.length - 1).join(":");
            if (name.length === 0) continue;
            uniqueQueueRefs.set(`${prefix}:${name}`, { name, prefix });
        }

        const result: Array<{
            name: string;
            prefix: string;
            waiting: number;
            active: number;
            delayed: number;
            completed: number;
            failed: number;
            paused: boolean;
        }> = [];

        for (const queueRef of uniqueQueueRefs.values()) {
            const queue = createQueue(runtimeClient, queueRef.name, queueRef.prefix);
            const counts = await queue.getJobCounts("waiting", "active", "delayed", "completed", "failed", "paused");
            const paused = await queue.isPaused();
            result.push({
                name: queueRef.name,
                prefix: queueRef.prefix,
                waiting: counts["waiting"] ?? 0,
                active: counts["active"] ?? 0,
                delayed: counts["delayed"] ?? 0,
                completed: counts["completed"] ?? 0,
                failed: counts["failed"] ?? 0,
                paused
            });
        }

        result.sort((a, b) => a.name.localeCompare(b.name));
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

        const queue = createQueue(runtimeClient, parsed.queueName, parsed.prefix);
        const jobs = await queue.getJobs(
            [
                "waiting",
                "active",
                "delayed",
                "completed",
                "failed",
                "paused",
                "prioritized",
                "waiting-children"
            ],
            0,
            249,
            false
        );

        const result = await Promise.all(
            jobs.map(async (job) => {
                const state = await job.getState();
                const jobId = job.id?.toString() ?? "";
                const jobLogs = jobId.length > 0 ? await queue.getJobLogs(jobId, 0, 0, true) : { logs: [], count: 0 };

                return {
                    id: jobId,
                    queueName: parsed.queueName,
                    name: job.name,
                    status: mapBullJobStatus(state),
                    attemptsMade: job.attemptsMade,
                    attemptsLimit: job.opts.attempts ?? null,
                    progress: typeof job.progress === "number" ? job.progress : null,
                    createdAt: job.timestamp ? new Date(job.timestamp).toISOString() : null,
                    processedAt: job.processedOn ? new Date(job.processedOn).toISOString() : null,
                    finishedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
                    durationMs: job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : null,
                    processedBy: job.processedBy ?? null,
                    failedReason: job.failedReason ? job.failedReason : null,
                    stacktrace: Array.isArray(job.stacktrace) ? job.stacktrace : [],
                    data: job.data,
                    opts: job.opts,
                    returnValue: job.returnvalue ?? null,
                    logsCount: jobLogs.count
                };
            })
        );

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

        const queue = createQueue(runtimeClient, parsed.queueName, parsed.prefix);
        await queue.pause();
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

        const queue = createQueue(runtimeClient, parsed.queueName, parsed.prefix);
        await queue.resume();
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

        const queue = createQueue(runtimeClient, parsed.queueName, parsed.prefix);
        await queue.retryJobs({ state: "failed" });
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

        const queue = createQueue(runtimeClient, parsed.queueName, parsed.prefix);
        await queue.clean(24 * 60 * 60 * 1000, 5000, "completed");
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

        const queue = createQueue(runtimeClient, parsed.queueName, parsed.prefix);
        const job = await queue.getJob(parsed.jobId);
        if (!job) throw new Error("Job not found");
        await job.retry();
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

        const queue = createQueue(runtimeClient, parsed.queueName, parsed.prefix);
        const job = await queue.getJob(parsed.jobId);
        if (!job) throw new Error("Job not found");
        await job.promote();
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

        const queue = createQueue(runtimeClient, parsed.queueName, parsed.prefix);
        const job = await queue.getJob(parsed.jobId);
        if (!job) throw new Error("Job not found");
        await job.remove();
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
