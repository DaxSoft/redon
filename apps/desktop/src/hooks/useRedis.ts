import { useState, useEffect } from "react";
import { invokeIpc } from "../ipc-client";
import { 
  listProfilesCommand, 
  openConnectionCommand, 
  getMetricsCommand,
  scanKeysCommand,
  getHashCommand,
  getStringCommand,
  listQueuesCommand,
  listJobsCommand,
  pauseQueueCommand,
  resumeQueueCommand,
  retryFailedJobsCommand,
  cleanCompletedJobsCommand,
  retryJobCommand,
  promoteJobCommand,
  removeJobCommand,
  getTelemetryCommand,
  ConnectionProfile,
  RedisKeySummary,
  BullQueueSummary,
  BullQueueJob
} from "@redon/ipc-contracts";

export function useRedis() {
  const [profiles, setProfiles] = useState<readonly ConnectionProfile[]>([]);
  const [isProfilesLoaded, setIsProfilesLoaded] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [keys, setKeys] = useState<RedisKeySummary[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedKeyData, setSelectedKeyData] = useState<unknown>(null);

  const [queues, setQueues] = useState<BullQueueSummary[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [jobs, setJobs] = useState<BullQueueJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<
    Array<{
      timestampIso: string;
      opsPerSecond: number | null;
      usedMemoryBytes: number | null;
      connectedClients: number | null;
      hitRate: number | null;
    }>
  >([]);

  const syncSelectedQueue = (nextQueues: BullQueueSummary[]) => {
    setSelectedQueue((current) => {
      if (nextQueues.length === 0) return null;
      if (current && nextQueues.some((queue) => queue.name === current)) return current;
      return nextQueues[0]?.name ?? null;
    });
  };

  const fetchProfiles = async () => {
    const p = await invokeIpc(listProfilesCommand, undefined);
    setProfiles(p);
    setIsProfilesLoaded(true);
  };

  const openConnection = async (id: string, password?: string | null) => {
    await invokeIpc(openConnectionCommand, { connectionId: id, password: password ?? null });
    setActiveProfileId(id);
    fetchMetrics(id);
    fetchKeys(id);
    fetchQueues(id);
    fetchTelemetry(id);
  };

  const fetchMetrics = async (id: string) => {
    try {
      const m = await invokeIpc(getMetricsCommand, { connectionId: id });
      setMetrics(m);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTelemetry = async (id: string) => {
      try {
          const t = await invokeIpc(getTelemetryCommand, { connectionId: id });
          setTelemetry(t);
      } catch (err) {
          console.error(err);
      }
  };

  const fetchKeys = async (id: string) => {
    try {
      const result = await invokeIpc(scanKeysCommand, {
        connectionId: id,
        database: 0,
        cursor: "0",
        pattern: "*",
        count: 100
      });
      setKeys(result.keys);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKeyData = async (id: string, key: string, type: string) => {
      try {
          if (type === "string") {
              const val = await invokeIpc(getStringCommand, { connectionId: id, key });
              setSelectedKeyData(val);
          } else if (type === "hash") {
              const val = await invokeIpc(getHashCommand, { connectionId: id, key });
              setSelectedKeyData(val);
          }
      } catch (err) {
          console.error(err);
      }
  };

  const fetchQueues = async (id: string) => {
      try {
          const res = await invokeIpc(listQueuesCommand, { connectionId: id });
          setQueues(res);
          syncSelectedQueue(res);
          return res;
      } catch (err) {
          console.error(err);
          return [];
      }
  };

  const fetchJobs = async (id: string, queueName: string, prefix: string) => {
      try {
          const res = await invokeIpc(listJobsCommand, { connectionId: id, queueName, prefix });
          setJobs(res);
          setSelectedJobId((current) => {
            if (res.length === 0) return null;
            if (current && res.some((job) => job.id === current)) return current;
            return res[0]?.id ?? null;
          });
          return res;
      } catch (err) {
          console.error(err);
          return [];
      }
  };

  const pauseQueue = async (id: string, queueName: string, prefix: string) => {
    await invokeIpc(pauseQueueCommand, { connectionId: id, queueName, prefix });
  };

  const resumeQueue = async (id: string, queueName: string, prefix: string) => {
    await invokeIpc(resumeQueueCommand, { connectionId: id, queueName, prefix });
  };

  const retryFailedJobs = async (id: string, queueName: string, prefix: string) => {
    await invokeIpc(retryFailedJobsCommand, { connectionId: id, queueName, prefix });
  };

  const cleanCompletedJobs = async (id: string, queueName: string, prefix: string) => {
    await invokeIpc(cleanCompletedJobsCommand, { connectionId: id, queueName, prefix });
  };

  const retryJob = async (id: string, queueName: string, prefix: string, jobId: string) => {
    await invokeIpc(retryJobCommand, { connectionId: id, queueName, prefix, jobId });
  };

  const promoteJob = async (id: string, queueName: string, prefix: string, jobId: string) => {
    await invokeIpc(promoteJobCommand, { connectionId: id, queueName, prefix, jobId });
  };

  const removeJob = async (id: string, queueName: string, prefix: string, jobId: string) => {
    await invokeIpc(removeJobCommand, { connectionId: id, queueName, prefix, jobId });
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return {
    profiles,
    isProfilesLoaded,
    fetchProfiles,
    activeProfileId,
    openConnection,
    metrics,
    fetchMetrics,
    keys,
    fetchKeys,
    selectedKey,
    setSelectedKey,
    selectedKeyData,
    fetchKeyData,
    queues,
    fetchQueues,
    selectedQueue,
    setSelectedQueue,
    jobs,
    fetchJobs,
    selectedJobId,
    setSelectedJobId,
    pauseQueue,
    resumeQueue,
    retryFailedJobs,
    cleanCompletedJobs,
    retryJob,
    promoteJob,
    removeJob,
    telemetry,
    fetchTelemetry
  };
}
