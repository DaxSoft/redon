import type { InspectorModuleManifest } from "@redon/plugin-contracts";
import type Redis from "ioredis";

export type BullMqJobStatus = "waiting" | "active" | "delayed" | "completed" | "failed" | "retrying" | "stalled" | "paused";

export interface BullMqQueueSummary {
  readonly name: string;
  readonly prefix: string;
  readonly waiting: number;
  readonly active: number;
  readonly delayed: number;
  readonly completed: number;
  readonly failed: number;
  readonly paused: boolean;
}

export interface BullMqJobSummary {
  readonly id: string;
  readonly queueName: string;
  readonly name: string;
  readonly status: BullMqJobStatus;
  readonly attemptsMade: number;
  readonly attemptsLimit: number | null;
  readonly progress: number | null;
  readonly createdAt: Date | null;
  readonly processedAt: Date | null;
  readonly finishedAt: Date | null;
  readonly durationMs: number | null;
}

/**
 * Realtime queue counters emitted for a single BullMQ queue.
 */
export interface BullMqQueueRealtimeSnapshot {
  readonly queueName: string;
  readonly prefix: string;
  readonly waiting: number;
  readonly active: number;
  readonly delayed: number;
  readonly completed: number;
  readonly failed: number;
  readonly paused: boolean;
  readonly timestampIso: string;
}

/**
 * Pagination input for queue jobs.
 */
export interface BullMqListJobsInput {
  readonly queueName: string;
  readonly prefix?: string;
  readonly limit: number;
}

/**
 * Callback invoked every realtime tick.
 */
export type BullMqRealtimeListener = (snapshot: readonly BullMqQueueRealtimeSnapshot[]) => void;

/**
 * Service for discovering BullMQ queues and reading queue/job data from Redis.
 */
export class BullMqRedisService {
  private static readonly DEFAULT_PREFIX = "bull";

  /**
   * Creates a service bound to a connected Redis client.
   */
  public constructor(private readonly redis: Redis) {}

  /**
   * Lists discovered BullMQ queues with per-status counters.
   */
  public async listQueues(): Promise<readonly BullMqQueueSummary[]> {
    const queueRefs = await this.discoverQueueReferences();
    const summaries = await Promise.all(queueRefs.map(async (queueRef) => this.readQueueSummary(queueRef.queueName, queueRef.prefix)));
    return summaries.sort((left, right) => left.name.localeCompare(right.name));
  }

  /**
   * Lists queue jobs for the main queue states using a bounded limit.
   */
  public async listJobs(input: BullMqListJobsInput): Promise<readonly BullMqJobSummary[]> {
    const normalizedPrefix = input.prefix ?? BullMqRedisService.DEFAULT_PREFIX;
    const safeLimit = this.normalizeLimit(input.limit);
    const [waitingIds, activeIds, delayedIds, completedIds, failedIds, pausedIds] = await Promise.all([
      this.redis.lrange(this.key(normalizedPrefix, input.queueName, "wait"), 0, safeLimit - 1),
      this.redis.lrange(this.key(normalizedPrefix, input.queueName, "active"), 0, safeLimit - 1),
      this.redis.zrevrange(this.key(normalizedPrefix, input.queueName, "delayed"), 0, safeLimit - 1),
      this.redis.zrevrange(this.key(normalizedPrefix, input.queueName, "completed"), 0, safeLimit - 1),
      this.redis.zrevrange(this.key(normalizedPrefix, input.queueName, "failed"), 0, safeLimit - 1),
      this.redis.lrange(this.key(normalizedPrefix, input.queueName, "paused"), 0, safeLimit - 1)
    ]);

    const tuples = this.makeJobStateTuples(input.queueName, waitingIds, "waiting")
      .concat(this.makeJobStateTuples(input.queueName, activeIds, "active"))
      .concat(this.makeJobStateTuples(input.queueName, delayedIds, "delayed"))
      .concat(this.makeJobStateTuples(input.queueName, completedIds, "completed"))
      .concat(this.makeJobStateTuples(input.queueName, failedIds, "failed"))
      .concat(this.makeJobStateTuples(input.queueName, pausedIds, "paused"));

    const unique = new Map<string, BullMqJobStatus>();
    for (const tuple of tuples) {
      if (!unique.has(tuple.jobId)) {
        unique.set(tuple.jobId, tuple.status);
      }
    }

    const jobs = await Promise.all(
      Array.from(unique.entries()).map(async ([jobId, status]) => this.readJobSummary(normalizedPrefix, input.queueName, jobId, status))
    );
    return jobs;
  }

  /**
   * Returns a realtime subscription helper that polls queue counters.
   */
  public createRealtimeSubscriber(intervalMs: number): BullMqQueueRealtimeSubscriber {
    return new BullMqQueueRealtimeSubscriber(this, intervalMs);
  }

  /**
   * Reads queue summaries and maps them to realtime snapshots with timestamp.
   */
  public async readRealtimeSnapshot(): Promise<readonly BullMqQueueRealtimeSnapshot[]> {
    const now = new Date().toISOString();
    const queueSummaries = await this.listQueues();
    return queueSummaries.map((summary) => ({
      queueName: summary.name,
      prefix: summary.prefix,
      waiting: summary.waiting,
      active: summary.active,
      delayed: summary.delayed,
      completed: summary.completed,
      failed: summary.failed,
      paused: summary.paused,
      timestampIso: now
    }));
  }

  /**
   * Discovers queues by scanning for BullMQ `:wait` keys.
   */
  public async discoverQueueReferences(): Promise<readonly { readonly queueName: string; readonly prefix: string }[]> {
    let cursor = "0";
    const references = new Map<string, { readonly queueName: string; readonly prefix: string }>();

    do {
      const result = await this.redis.scan(cursor, "MATCH", "*:wait", "COUNT", 500);
      cursor = result[0];
      for (const keyName of result[1]) {
        const parsed = this.parseQueueFromWaitKey(keyName);
        if (parsed !== null) {
          references.set(`${parsed.prefix}:${parsed.queueName}`, parsed);
        }
      }
    } while (cursor !== "0");

    return Array.from(references.values());
  }

  /**
   * Reads counters for a single queue.
   */
  public async readQueueSummary(queueName: string, prefix: string): Promise<BullMqQueueSummary> {
    const [waiting, active, delayed, completed, failed, pausedSize, metaPaused] = await Promise.all([
      this.redis.llen(this.key(prefix, queueName, "wait")),
      this.redis.llen(this.key(prefix, queueName, "active")),
      this.redis.zcard(this.key(prefix, queueName, "delayed")),
      this.redis.zcard(this.key(prefix, queueName, "completed")),
      this.redis.zcard(this.key(prefix, queueName, "failed")),
      this.redis.llen(this.key(prefix, queueName, "paused")),
      this.redis.hget(this.key(prefix, queueName, "meta"), "paused")
    ]);

    return {
      name: queueName,
      prefix,
      waiting,
      active,
      delayed,
      completed,
      failed,
      paused: pausedSize > 0 || metaPaused === "true" || metaPaused === "1"
    };
  }

  /**
   * Reads a single job hash and converts it into a queue job summary.
   */
  public async readJobSummary(prefix: string, queueName: string, jobId: string, status: BullMqJobStatus): Promise<BullMqJobSummary> {
    const jobKey = this.key(prefix, queueName, jobId);
    const jobData = await this.redis.hgetall(jobKey);
    const createdAt = this.parseUnixMs(jobData["timestamp"]);
    const processedAt = this.parseUnixMs(jobData["processedOn"]);
    const finishedAt = this.parseUnixMs(jobData["finishedOn"]);
    const durationMs = processedAt !== null && finishedAt !== null ? Math.max(0, finishedAt.getTime() - processedAt.getTime()) : null;

    return {
      id: jobId,
      queueName,
      name: jobData["name"] ?? "default",
      status,
      attemptsMade: this.parseInteger(jobData["attemptsMade"]) ?? 0,
      attemptsLimit: this.parseAttemptsLimit(jobData["opts"]),
      progress: this.parseProgress(jobData["progress"]),
      createdAt,
      processedAt,
      finishedAt,
      durationMs
    };
  }

  /**
   * Builds a BullMQ key for a queue and suffix.
   */
  public key(prefix: string, queueName: string, suffix: string): string {
    return `${prefix}:${queueName}:${suffix}`;
  }

  /**
   * Converts queue key matches into queue references.
   */
  private parseQueueFromWaitKey(keyName: string): { readonly queueName: string; readonly prefix: string } | null {
    const suffix = ":wait";
    if (!keyName.endsWith(suffix)) return null;
    const base = keyName.slice(0, keyName.length - suffix.length);
    const splitIndex = base.lastIndexOf(":");
    if (splitIndex <= 0 || splitIndex === base.length - 1) return null;
    const prefix = base.slice(0, splitIndex);
    const queueName = base.slice(splitIndex + 1);
    return { prefix, queueName };
  }

  /**
   * Normalizes requested list size to a safe range.
   */
  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit) || limit < 1) return 50;
    if (limit > 500) return 500;
    return Math.floor(limit);
  }

  /**
   * Parses integer text values returned by Redis.
   */
  private parseInteger(value: string | undefined): number | null {
    if (value === undefined) return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  /**
   * Parses BullMQ progress values from raw Redis hash data.
   */
  private parseProgress(value: string | undefined): number | null {
    if (value === undefined) return null;
    const numeric = Number.parseFloat(value);
    if (Number.isFinite(numeric)) return numeric;

    try {
      const parsed: unknown = JSON.parse(value);
      if (typeof parsed === "number" && Number.isFinite(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }

    return null;
  }

  /**
   * Parses timestamp fields stored as unix milliseconds.
   */
  private parseUnixMs(value: string | undefined): Date | null {
    const ms = this.parseInteger(value);
    if (ms === null) return null;
    return new Date(ms);
  }

  /**
   * Extracts configured attempt limit from BullMQ job options.
   */
  private parseAttemptsLimit(rawOpts: string | undefined): number | null {
    if (rawOpts === undefined) return null;
    try {
      const parsed: unknown = JSON.parse(rawOpts);
      if (!this.hasAttemptsField(parsed)) return null;
      const attemptsValue = parsed.attempts;
      return typeof attemptsValue === "number" && Number.isFinite(attemptsValue) ? attemptsValue : null;
    } catch {
      return null;
    }
  }

  /**
   * Type guard for BullMQ options payload with attempts field.
   */
  private hasAttemptsField(value: unknown): value is { readonly attempts: unknown } {
    return typeof value === "object" && value !== null && "attempts" in value;
  }

  /**
   * Maps job id collections to queue/job status tuples.
   */
  private makeJobStateTuples(
    queueName: string,
    jobIds: readonly string[],
    status: BullMqJobStatus
  ): readonly { readonly queueName: string; readonly jobId: string; readonly status: BullMqJobStatus }[] {
    return jobIds.map((jobId) => ({
      queueName,
      jobId,
      status
    }));
  }
}

/**
 * Realtime poller for BullMQ queue counters.
 */
export class BullMqQueueRealtimeSubscriber {
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<BullMqRealtimeListener>();

  /**
   * Creates a subscriber for a queue redis service.
   */
  public constructor(
    private readonly service: BullMqRedisService,
    private readonly intervalMs: number
  ) {}

  /**
   * Adds a listener and returns an unsubscribe function.
   */
  public subscribe(listener: BullMqRealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Starts polling queue snapshots in realtime.
   */
  public start(): void {
    if (this.timer !== null) return;
    this.timer = setInterval(() => {
      void this.tick();
    }, this.intervalMs);
    void this.tick();
  }

  /**
   * Stops polling queue snapshots.
   */
  public stop(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  /**
   * Executes one polling cycle and notifies listeners.
   */
  public async tick(): Promise<void> {
    const snapshot = await this.service.readRealtimeSnapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

export const bullMqModule: InspectorModuleManifest = {
  id: "bullmq-visualizer",
  name: "BullMQ Visualizer",
  version: "0.1.0",
  navigation: [
    {
      id: "queues",
      label: "Queues",
      icon: "ListRestart",
      route: "/queues"
    }
  ],
  routes: [
    {
      path: "/queues",
      componentId: "bullmq.dashboard"
    }
  ],
  commands: [
    {
      id: "bullmq.refresh",
      title: "Refresh BullMQ queues"
    }
  ]
};
