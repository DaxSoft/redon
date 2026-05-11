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
  getTelemetryCommand,
  ConnectionProfile,
  RedisKeySummary
} from "@redon/ipc-contracts";

export function useRedis() {
  const [profiles, setProfiles] = useState<readonly ConnectionProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [keys, setKeys] = useState<RedisKeySummary[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedKeyData, setSelectedKeyData] = useState<any>(null);

  const [queues, setQueues] = useState<any[]>([]);
  const [selectedQueue, setSelectedQueue] = useState<any | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any[]>([]);

  const fetchProfiles = async () => {
    try {
      const p = await invokeIpc(listProfilesCommand, undefined);
      setProfiles(p);
    } catch (err) {
      console.error(err);
    }
  };

  const openConnection = async (id: string, password?: string | null) => {
    try {
      await invokeIpc(openConnectionCommand, { connectionId: id, password: password ?? null });
      setActiveProfileId(id);
      fetchMetrics(id);
      fetchKeys(id);
      fetchQueues(id);
      fetchTelemetry(id);
    } catch (err) {
      console.error(err);
    }
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
      } catch (err) {
          console.error(err);
      }
  };

  const fetchJobs = async (id: string, queueName: string, prefix: string) => {
      try {
          const res = await invokeIpc(listJobsCommand, { connectionId: id, queueName, prefix });
          setJobs(res);
      } catch (err) {
          console.error(err);
      }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return {
    profiles,
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
    telemetry,
    fetchTelemetry
  };
}
