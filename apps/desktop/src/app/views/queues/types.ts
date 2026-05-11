import type { BullQueueJob, BullQueueSummary } from "@redon/ipc-contracts";

export type JobStatusFilter = "all" | "waiting" | "active" | "delayed" | "completed" | "failed";
export type PayloadMode = "raw" | "json";

export interface QueueTotals {
  total: number;
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
}

export interface QueueHealthCounts {
  healthy: number;
  warning: number;
  paused: number;
  failing: number;
}

export interface QueuesViewProps {
  readonly activeProfileId: string | null;
  readonly queues: BullQueueSummary[];
  readonly selectedQueue: string | null;
  readonly setSelectedQueue: (name: string | null) => void;
  readonly jobs: BullQueueJob[];
  readonly selectedJobId: string | null;
  readonly setSelectedJobId: (jobId: string | null) => void;
  readonly telemetry: Array<{
    timestampIso: string;
    opsPerSecond: number | null;
  }>;
  readonly fetchJobs: (id: string, queueName: string, prefix: string) => Promise<readonly BullQueueJob[]>;
  readonly refreshAll: () => Promise<void>;
  readonly pauseQueue: (id: string, queueName: string, prefix: string) => Promise<void>;
  readonly resumeQueue: (id: string, queueName: string, prefix: string) => Promise<void>;
  readonly retryFailedJobs: (id: string, queueName: string, prefix: string) => Promise<void>;
  readonly cleanCompletedJobs: (id: string, queueName: string, prefix: string) => Promise<void>;
  readonly retryJob: (id: string, queueName: string, prefix: string, jobId: string) => Promise<void>;
  readonly promoteJob: (id: string, queueName: string, prefix: string, jobId: string) => Promise<void>;
  readonly removeJob: (id: string, queueName: string, prefix: string, jobId: string) => Promise<void>;
  readonly setViewConnections: () => void;
}

