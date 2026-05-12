import { Queue } from "bullmq";

export type BullJobStatus =
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

export interface BullQueueSummary {
  readonly name: string;
  readonly prefix: string;
  readonly waiting: number;
  readonly active: number;
  readonly delayed: number;
  readonly completed: number;
  readonly failed: number;
  readonly paused: boolean;
}

export interface BullQueueJob {
  readonly id: string;
  readonly queueName: string;
  readonly name: string;
  readonly status: BullJobStatus;
  readonly attemptsMade: number;
  readonly attemptsLimit: number | null;
  readonly progress: number | null;
  readonly createdAt: string | null;
  readonly processedAt: string | null;
  readonly finishedAt: string | null;
  readonly durationMs: number | null;
  readonly processedBy: string | null;
  readonly failedReason: string | null;
  readonly stacktrace: readonly string[];
  readonly data: unknown;
  readonly opts: unknown;
  readonly returnValue: unknown | null;
  readonly logsCount: number;
}

interface RuntimeClientShape {
  readonly client: any;
}

interface QueueRef {
  readonly name: string;
  readonly prefix: string;
}

const DISCOVERY_SUFFIXES = [":meta", ":wait", ":active", ":delayed", ":completed", ":failed", ":paused", ":events", ":id"] as const;

function parseQueueRefsFromKey(keyName: string, suffix: string): readonly QueueRef[] {
  if (!keyName.endsWith(suffix)) return [];
  const base = keyName.slice(0, keyName.length - suffix.length);
  const refs = new Map<string, QueueRef>();

  const firstSplitIndex = base.indexOf(":");
  if (firstSplitIndex > 0 && firstSplitIndex < base.length - 1) {
    const prefix = base.slice(0, firstSplitIndex);
    const name = base.slice(firstSplitIndex + 1);
    if (prefix && name) refs.set(`${prefix}:${name}`, { prefix, name });
  }

  const lastSplitIndex = base.lastIndexOf(":");
  if (lastSplitIndex > 0 && lastSplitIndex < base.length - 1) {
    const prefix = base.slice(0, lastSplitIndex);
    const name = base.slice(lastSplitIndex + 1);
    if (prefix && name) refs.set(`${prefix}:${name}`, { prefix, name });
  }

  return Array.from(refs.values());
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

export class BullMqService {
  public constructor(private readonly runtimeClient: RuntimeClientShape) {}

  public createQueue(queueName: string, prefix?: string): Queue {
    return new Queue(queueName, {
      connection: this.runtimeClient.client,
      prefix: prefix ?? "bull",
    });
  }

  public async listQueues(): Promise<readonly BullQueueSummary[]> {
    const queueRefs = await this.discoverQueueRefs();
    const summaries = await Promise.all(queueRefs.map(async (queueRef) => this.readQueueSummary(queueRef)));
    return summaries
      .filter((summary): summary is BullQueueSummary => summary !== null)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  public async listJobs(queueName: string, prefix?: string): Promise<readonly BullQueueJob[]> {
    const queue = this.createQueue(queueName, prefix);
    const jobs = await queue.getJobs(
      ["waiting", "active", "delayed", "completed", "failed", "paused", "prioritized", "waiting-children"],
      0,
      249,
      false
    );

    return Promise.all(
      jobs.map(async (job) => {
        const state = await job.getState();
        const jobId = job.id?.toString() ?? "";
        const jobLogs = jobId.length > 0 ? await queue.getJobLogs(jobId, 0, 0, true) : { count: 0 };

        return {
          id: jobId,
          queueName,
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
          logsCount: jobLogs.count,
        };
      })
    );
  }

  public async pauseQueue(queueName: string, prefix?: string): Promise<void> {
    await this.createQueue(queueName, prefix).pause();
  }

  public async resumeQueue(queueName: string, prefix?: string): Promise<void> {
    await this.createQueue(queueName, prefix).resume();
  }

  public async retryFailedJobs(queueName: string, prefix?: string): Promise<void> {
    await this.createQueue(queueName, prefix).retryJobs({ state: "failed" });
  }

  public async cleanCompletedJobs(queueName: string, prefix?: string): Promise<void> {
    await this.createQueue(queueName, prefix).clean(24 * 60 * 60 * 1000, 5000, "completed");
  }

  public async retryJob(queueName: string, jobId: string, prefix?: string): Promise<void> {
    const queue = this.createQueue(queueName, prefix);
    const job = await queue.getJob(jobId);
    if (!job) throw new Error("Job not found");
    await job.retry();
  }

  public async promoteJob(queueName: string, jobId: string, prefix?: string): Promise<void> {
    const queue = this.createQueue(queueName, prefix);
    const job = await queue.getJob(jobId);
    if (!job) throw new Error("Job not found");
    await job.promote();
  }

  public async removeJob(queueName: string, jobId: string, prefix?: string): Promise<void> {
    const queue = this.createQueue(queueName, prefix);
    const job = await queue.getJob(jobId);
    if (!job) throw new Error("Job not found");
    await job.remove();
  }

  private async discoverQueueRefs(): Promise<readonly QueueRef[]> {
    const uniqueQueueRefs = new Map<string, QueueRef>();
    for (const suffix of DISCOVERY_SUFFIXES) {
      let cursor = "0";
      do {
        const [next, keys] = await this.runtimeClient.client.scan(cursor, "MATCH", `*${suffix}`, "COUNT", 1000);
        cursor = next;
        for (const keyName of keys as string[]) {
          for (const parsedRef of parseQueueRefsFromKey(keyName, suffix)) {
            uniqueQueueRefs.set(`${parsedRef.prefix}:${parsedRef.name}`, parsedRef);
          }
        }
      } while (cursor !== "0");
    }
    return Array.from(uniqueQueueRefs.values());
  }

  private async readQueueSummary(queueRef: QueueRef): Promise<BullQueueSummary | null> {
    const queue = this.createQueue(queueRef.name, queueRef.prefix);
    try {
      const counts = await queue.getJobCounts("waiting", "active", "delayed", "completed", "failed", "paused");
      const paused = await queue.isPaused();
      return {
        name: queueRef.name,
        prefix: queueRef.prefix,
        waiting: counts["waiting"] ?? 0,
        active: counts["active"] ?? 0,
        delayed: counts["delayed"] ?? 0,
        completed: counts["completed"] ?? 0,
        failed: counts["failed"] ?? 0,
        paused,
      };
    } catch {
      return null;
    }
  }
}

