import { useEffect, useMemo, useState } from "react";
import { createProfileCommand, testConnectionCommand } from "@redon/ipc-contracts";
import { invokeIpc } from "../ipc-client";
import { useRedis } from "../hooks/useRedis";
import { ACTIVE_CONNECTION_STORAGE_KEY, CONNECTION_PASSWORD_STORAGE_KEY, NavView, RangeKey } from "./constants";

export function useAppController() {
  const redis = useRedis();
  const [view, setView] = useState<NavView>("overview");
  const [connectionForm, setConnectionForm] = useState({
    redisUrl: "",
    name: "",
    host: "127.0.0.1",
    port: "6379",
    database: "0",
    username: "",
    password: "",
    tlsEnabled: false,
    tlsAllowSelfSigned: false
  });
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isSavingConnection, setIsSavingConnection] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [selectedRange, setSelectedRange] = useState<RangeKey>("5m");

  const activeProfile = useMemo(
    () => redis.profiles.find((profile) => profile.id === redis.activeProfileId),
    [redis.profiles, redis.activeProfileId]
  );

  useEffect(() => {
    if (redis.isProfilesLoaded && redis.profiles.length === 0) {
      setView("connections");
    }
  }, [redis.isProfilesLoaded, redis.profiles.length]);

  useEffect(() => {
    if (!redis.isProfilesLoaded || redis.activeProfileId !== null || redis.profiles.length === 0) return;
    const savedConnectionId = localStorage.getItem(ACTIVE_CONNECTION_STORAGE_KEY);
    if (!savedConnectionId) return;
    if (!redis.profiles.some((profile) => profile.id === savedConnectionId)) return;
    tryOpenSavedConnection(savedConnectionId).catch((error) => {
      setConnectionError(error instanceof Error ? error.message : "Could not open saved connection.");
    });
  }, [redis.isProfilesLoaded, redis.activeProfileId, redis.profiles]);

  useEffect(() => {
    if (redis.activeProfileId !== null) {
      localStorage.setItem(ACTIVE_CONNECTION_STORAGE_KEY, redis.activeProfileId);
    }
  }, [redis.activeProfileId]);

  useEffect(() => {
    if (redis.activeProfileId) {
      const interval = setInterval(() => {
        redis.fetchMetrics(redis.activeProfileId!);
        redis.fetchQueues(redis.activeProfileId!);
        redis.fetchTelemetry(redis.activeProfileId!);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [redis.activeProfileId, redis.fetchMetrics, redis.fetchQueues, redis.fetchTelemetry]);

  const applyRedisUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    setConnectionForm((state) => ({ ...state, redisUrl: rawUrl }));
    if (trimmed.length === 0) return;

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
        throw new Error("Invalid Redis URL protocol.");
      }

      const parsedHost = parsed.hostname || "127.0.0.1";
      const parsedPort = parsed.port || "6379";
      const parsedDbFromPath = parsed.pathname.replace("/", "");
      const parsedDbFromQuery = parsed.searchParams.get("db");
      const parsedDb = parsedDbFromQuery ?? parsedDbFromPath;
      const db = parsedDb.length > 0 && Number.isFinite(Number(parsedDb)) ? String(Number(parsedDb)) : "0";

      setConnectionForm((state) => ({
        ...state,
        redisUrl: rawUrl,
        host: parsedHost,
        port: parsedPort,
        database: db,
        username: parsed.username || "",
        password: parsed.password ? decodeURIComponent(parsed.password) : "",
        tlsEnabled: parsed.protocol === "rediss:",
        tlsAllowSelfSigned: state.tlsAllowSelfSigned,
        name: state.name.trim().length > 0 ? state.name : `${parsedHost}:${parsedPort}`
      }));
      setConnectionError(null);
    } catch {
      setConnectionError("Invalid Redis URL. Use redis:// or rediss://");
    }
  };

  const tryOpenSavedConnection = async (connectionId: string) => {
    const passwordMap = JSON.parse(localStorage.getItem(CONNECTION_PASSWORD_STORAGE_KEY) ?? "{}") as Record<string, string>;
    const savedPassword = passwordMap[connectionId] ?? null;

    try {
      await redis.openConnection(connectionId, savedPassword);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not open selected connection.";
      if (!message.includes("WRONGPASS")) throw error;
      const typedPassword = window.prompt("Password required for this Redis connection. Enter password:");
      if (typedPassword === null) throw error;
      passwordMap[connectionId] = typedPassword;
      localStorage.setItem(CONNECTION_PASSWORD_STORAGE_KEY, JSON.stringify(passwordMap));
      await redis.openConnection(connectionId, typedPassword);
    }
  };

  const handleCreateConnection = async () => {
    setConnectionError(null);
    setConnectionStatus(null);
    setIsSavingConnection(true);
    try {
      const payload = {
        id: crypto.randomUUID(),
        name: connectionForm.name.trim() || `${connectionForm.host}:${connectionForm.port}`,
        host: connectionForm.host.trim(),
        port: Number(connectionForm.port),
        username: connectionForm.username.trim() || null,
        database: Number(connectionForm.database),
        tlsEnabled: connectionForm.tlsEnabled,
        tlsAllowSelfSigned: connectionForm.tlsAllowSelfSigned,
        credentialRef: null,
        color: null,
        tags: []
      };
      const created = await invokeIpc(createProfileCommand, payload);
      const passwordMap = JSON.parse(localStorage.getItem(CONNECTION_PASSWORD_STORAGE_KEY) ?? "{}") as Record<string, string>;
      passwordMap[created.id] = connectionForm.password;
      localStorage.setItem(CONNECTION_PASSWORD_STORAGE_KEY, JSON.stringify(passwordMap));
      await redis.fetchProfiles();
      await redis.openConnection(created.id, connectionForm.password.trim() || null);
      setView("overview");
      setConnectionStatus(`Saved and connected to ${created.host}:${created.port}/${created.database}.`);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Could not create connection profile.");
    } finally {
      setIsSavingConnection(false);
    }
  };

  const handleTestConnection = async () => {
    setConnectionError(null);
    setConnectionStatus(null);
    setIsTestingConnection(true);
    try {
      const result = await invokeIpc(testConnectionCommand, {
        profile: {
          id: crypto.randomUUID(),
          name: connectionForm.name.trim() || "Test Connection",
          host: connectionForm.host.trim(),
          port: Number(connectionForm.port),
          username: connectionForm.username.trim() || null,
          database: Number(connectionForm.database),
          tlsEnabled: connectionForm.tlsEnabled,
          tlsAllowSelfSigned: connectionForm.tlsAllowSelfSigned,
          credentialRef: null,
          color: null,
          tags: []
        },
        password: connectionForm.password.trim() || null
      });
      if (!result.ok) {
        setConnectionError(result.message);
        return;
      }
      const latency = result.latencyMs === null ? "n/a" : `${result.latencyMs} ms`;
      setConnectionStatus(`Connection test passed (${latency}).`);
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : "Connection test failed.");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleRefresh = async () => {
    if (!redis.activeProfileId) return;
    const connectionId = redis.activeProfileId;
    await Promise.all([
      redis.fetchMetrics(connectionId),
      redis.fetchKeys(connectionId),
      redis.fetchQueues(connectionId),
      redis.fetchTelemetry(connectionId)
    ]);
    if (redis.selectedQueue) {
      const queue = redis.queues.find((item) => item.name === redis.selectedQueue);
      if (queue) {
        await redis.fetchJobs(connectionId, queue.name, queue.prefix);
      }
    }
  };

  return {
    redis,
    view,
    setView,
    connectionForm,
    setConnectionForm,
    connectionStatus,
    connectionError,
    setConnectionError,
    isSavingConnection,
    isTestingConnection,
    selectedRange,
    setSelectedRange,
    activeProfile,
    applyRedisUrl,
    tryOpenSavedConnection,
    handleCreateConnection,
    handleTestConnection,
    handleRefresh
  };
}
