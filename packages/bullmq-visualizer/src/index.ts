import type { InspectorModuleManifest } from "@redon/plugin-contracts";

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
