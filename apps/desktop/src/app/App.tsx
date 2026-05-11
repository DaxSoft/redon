import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  Command,
  Copy,
  Database,
  FileCode2,
  Folder,
  Gauge,
  Grid2X2,
  KeyRound,
  Layers3,
  Link2,
  ListRestart,
  PauseCircle,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Workflow,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRedis } from "../hooks/useRedis";
import { invokeIpc } from "../ipc-client";
import { createProfileCommand, testConnectionCommand } from "@redon/ipc-contracts";
import { Badge, Button, CommandInput, MetricCard, Panel, Sparkline, StatusDot } from "@redon/ui";

type NavView = "overview" | "connections";

const navItems: ReadonlyArray<{ label: string; view?: NavView; icon: LucideIcon }> = [
  { label: "Overview", view: "overview", icon: Grid2X2 },
  { label: "Connections", view: "connections", icon: Link2 },
  { label: "Explorer", icon: Folder },
  { label: "Keys", icon: KeyRound },
  { label: "Types", icon: Layers3 },
  { label: "Metrics", icon: BarChart3 },
  { label: "Queues", icon: ListRestart },
  { label: "Streams", icon: Workflow },
  { label: "Pub/Sub", icon: Radio },
  { label: "Lua", icon: FileCode2 },
  { label: "Settings", icon: Settings }
];

interface QueueMetricRow {
  readonly label: string;
  readonly value: string;
  readonly Icon: LucideIcon;
}

const queueMetricRows: readonly QueueMetricRow[] = [
  { label: "Throughput", value: "128 jobs/min", Icon: Activity },
  { label: "Retry Rate", value: "2.1%", Icon: Zap },
  { label: "Failure Rate", value: "0.9%", Icon: ShieldCheck },
  { label: "Active Workers", value: "5", Icon: Gauge }
];

function statusTone(status: string): "success" | "info" | "warning" | "danger" {
  if (status === "active") return "info";
  if (status === "delayed" || status === "retrying") return "warning";
  if (status === "failed" || status === "stalled") return "danger";
  return "success";
}

export function App() {
  const {
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
  } = useRedis();
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

  const applyRedisUrl = (rawUrl: string) => {
    const trimmed = rawUrl.trim();
    setConnectionForm((state) => ({ ...state, redisUrl: rawUrl }));
    if (trimmed.length === 0) {
      return;
    }

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

  useEffect(() => {
    if (profiles.length === 0) {
      setView("connections");
    }
  }, [profiles.length]);

  useEffect(() => {
    if (activeProfileId) {
      const interval = setInterval(() => {
        fetchMetrics(activeProfileId);
        fetchQueues(activeProfileId);
        fetchTelemetry(activeProfileId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeProfileId, fetchMetrics, fetchQueues, fetchTelemetry]);

  const activeProfile = useMemo(() => profiles.find((profile) => profile.id === activeProfileId), [profiles, activeProfileId]);

  const handleCreateConnection = async () => {
    setConnectionError(null);
    setConnectionStatus(null);
    setIsSavingConnection(true);

    try {
      const port = Number(connectionForm.port);
      const database = Number(connectionForm.database);
      const name = connectionForm.name.trim() || `${connectionForm.host}:${connectionForm.port}`;
      const payload = {
        id: crypto.randomUUID(),
        name,
        host: connectionForm.host.trim(),
        port,
        username: connectionForm.username.trim() || null,
        database,
        tlsEnabled: connectionForm.tlsEnabled,
        tlsAllowSelfSigned: connectionForm.tlsAllowSelfSigned,
        credentialRef: null,
        color: null,
        tags: []
      };

      const created = await invokeIpc(createProfileCommand, payload);
      await fetchProfiles();
      await openConnection(created.id, connectionForm.password.trim() || null);
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

  const renderConnectionsView = () => (
    <section className="workspace">
      <div className="connections-layout">
        <Panel className="connection-form-panel">
          <div className="panel-header">
            <h2>New Connection</h2>
          </div>
          <div className="connection-form-grid">
            <label className="connection-url-field">
              Redis URL
              <input
                value={connectionForm.redisUrl}
                onChange={(event) => applyRedisUrl(event.target.value)}
                placeholder="redis://user:pass@127.0.0.1:6379/0"
              />
            </label>
            <label>
              Name
              <input value={connectionForm.name} onChange={(event) => setConnectionForm((state) => ({ ...state, name: event.target.value }))} />
            </label>
            <label>
              Host
              <input value={connectionForm.host} onChange={(event) => setConnectionForm((state) => ({ ...state, host: event.target.value }))} />
            </label>
            <label>
              Port
              <input type="number" min={1} max={65535} value={connectionForm.port} onChange={(event) => setConnectionForm((state) => ({ ...state, port: event.target.value }))} />
            </label>
            <label>
              Database
              <input type="number" min={0} value={connectionForm.database} onChange={(event) => setConnectionForm((state) => ({ ...state, database: event.target.value }))} />
            </label>
            <label>
              Username
              <input value={connectionForm.username} onChange={(event) => setConnectionForm((state) => ({ ...state, username: event.target.value }))} />
            </label>
            <label>
              Password
              <input type="password" value={connectionForm.password} onChange={(event) => setConnectionForm((state) => ({ ...state, password: event.target.value }))} />
            </label>
            <label className="connection-checkbox">
              <input type="checkbox" checked={connectionForm.tlsEnabled} onChange={(event) => setConnectionForm((state) => ({ ...state, tlsEnabled: event.target.checked }))} />
              TLS Enabled
            </label>
            <label className="connection-checkbox">
              <input
                type="checkbox"
                checked={connectionForm.tlsAllowSelfSigned}
                onChange={(event) => setConnectionForm((state) => ({ ...state, tlsAllowSelfSigned: event.target.checked }))}
                disabled={!connectionForm.tlsEnabled}
              />
              Allow Self-Signed Cert
            </label>
          </div>
          <div className="connection-actions">
            <Button onClick={handleTestConnection} icon={<RefreshCw size={15} />} ariaLabel="Test connection">
              {isTestingConnection ? "Testing..." : "Test"}
            </Button>
            <Button onClick={handleCreateConnection} icon={<Plus size={15} />} ariaLabel="Save connection">
              {isSavingConnection ? "Saving..." : "Save + Connect"}
            </Button>
          </div>
          {connectionStatus ? <p className="connection-status">{connectionStatus}</p> : null}
          {connectionError ? <p className="connection-error">{connectionError}</p> : null}
        </Panel>

        <Panel className="saved-connections-panel">
          <div className="panel-header">
            <h2>Saved Connections</h2>
          </div>
          <div className="saved-connections-list">
            {profiles.length === 0 ? (
              <p className="empty-copy">No saved connections yet.</p>
            ) : (
              profiles.map((profile) => (
                <button
                  className={activeProfileId === profile.id ? "saved-connection-row active" : "saved-connection-row"}
                  key={profile.id}
                  type="button"
                  onClick={() => openConnection(profile.id)}
                >
                  <span>
                    <strong>{profile.name}</strong>
                    <small>
                      {profile.host}:{profile.port}/{profile.database}
                    </small>
                  </span>
                  <StatusDot label={activeProfileId === profile.id ? "Connected" : "Saved"} tone={activeProfileId === profile.id ? "success" : "muted"} />
                </button>
              ))
            )}
          </div>
        </Panel>
      </div>
    </section>
  );

  const renderOverviewView = () => {
    if (!activeProfileId) {
      return (
        <section className="workspace">
          <Panel className="empty-connection-panel">
            <h2>No Active Connection</h2>
            <p>Create or open a Redis connection before using the overview.</p>
            <Button onClick={() => setView("connections")} icon={<Link2 size={16} />}>
              Open Connections
            </Button>
          </Panel>
        </section>
      );
    }
    const connectionId = activeProfileId;

    return (
      <section className="workspace">
        <div className="metric-grid">
          <MetricCard icon={<Database size={23} />} label="Memory Usage" value={metrics?.memoryUsage || "0 B"} detail="-" trend="up" />
          <MetricCard sparkline sparklineData={telemetry.map((point) => point.opsPerSecond)} label="Ops / sec" value={metrics?.opsPerSec?.toString() || "0"} detail="-" trend="up" />
          <MetricCard sparkline sparklineData={telemetry.map((point) => point.hitRate)} label="Hit Rate" value={metrics?.hitRate || "0%"} detail="-" trend="up" />
          <MetricCard icon={<Server size={23} />} label="Connected Clients" value={metrics?.connectedClients?.toString() || "0"} detail="-" trend="up" />
          <MetricCard icon={<Clock3 size={23} />} label="Expired Keys" value={metrics?.expiredKeys?.toString() || "0"} detail="-" trend="up" />
          <MetricCard icon={<Database size={23} />} label="Total Keys" value={metrics?.totalKeys?.toString() || "0"} detail="-" trend="up" />
        </div>

        <div className="dashboard-grid">
          <Panel className="activity-panel">
            <div className="panel-header">
              <h2>Redis Activity</h2>
              <select aria-label="Activity metric">
                <option>Ops/sec</option>
              </select>
              <div className="range-tabs">
                <button type="button">1m</button>
                <button className="active" type="button">5m</button>
                <button type="button">15m</button>
                <button type="button">1h</button>
                <button type="button">6h</button>
                <button type="button">24h</button>
              </div>
            </div>
            <div className="chart-surface">
              <Sparkline variant="area" data={telemetry.map((point) => point.opsPerSecond)} />
            </div>
          </Panel>

          <Panel className="type-panel">
            <div className="panel-header">
              <h2>Key Types</h2>
              <select aria-label="Key type sort">
                <option>By Count</option>
              </select>
            </div>
            {[
              ["String", "0", "0%"],
              ["Hash", "0", "0%"],
              ["List", "0", "0%"],
              ["Set", "0", "0%"],
              ["Sorted Set", "0", "0%"],
              ["Stream", "0", "0%"],
              ["JSON", "0", "0%"]
            ].map(([type, count, pct]) => (
              <div className="type-row" key={type}>
                <span>{type}</span>
                <strong>{count}</strong>
                <div>
                  <i style={{ width: pct }} />
                </div>
                <em>{pct}</em>
              </div>
            ))}
            <div className="type-total">
              <span>Total Keys</span>
              <strong>{metrics?.totalKeys || 0}</strong>
            </div>
          </Panel>
        </div>

        <div className="inspector-grid">
          <Panel className="key-browser">
            <div className="panel-header">
              <h2>Key Browser</h2>
              <Button ariaLabel="Filter keys" icon={<Search size={15} />} />
            </div>
            <CommandInput icon={<Search size={15} />} placeholder="Filter keys by pattern..." />
            <div className="key-list">
              {keys.map((row) => (
                <button
                  className={selectedKey === row.key ? "key-row selected" : "key-row"}
                  key={row.key}
                  onClick={() => {
                    setSelectedKey(row.key);
                    fetchKeyData(connectionId, row.key, row.type);
                  }}
                  type="button"
                >
                  <span>
                    {row.type === "none" ? "?" : ""} {row.key}
                  </span>
                  <em>{row.type}</em>
                  <strong>{row.memoryBytes ? `${row.memoryBytes} B` : ""}</strong>
                </button>
              ))}
            </div>
            <div className="panel-footer">
              {keys.length} keys{" "}
              <RefreshCw
                size={13}
                onClick={() => fetchKeys(connectionId)}
                style={{ cursor: "pointer" }}
              />
            </div>
          </Panel>

          <Panel className="value-panel">
            <div className="panel-header">
              <h2>Value Inspector</h2>
              <div className="type-tabs">
                {["String", "Hash", "List", "Set", "ZSet", "Stream", "JSON"].map((tab) => (
                  <button className={keys.find((key) => key.key === selectedKey)?.type?.toLowerCase() === tab.toLowerCase() ? "active" : ""} key={tab} type="button">
                    {tab}
                  </button>
                ))}
              </div>
              <div className="header-actions">
                <span>
                  TTL: <strong>{keys.find((key) => key.key === selectedKey)?.ttlSeconds ?? -1}</strong>
                </span>
                <Copy size={15} />
                <Trash2 size={15} />
              </div>
            </div>
            <div className="metadata-grid">
              <span>
                Key<strong>{selectedKey || "-"}</strong>
              </span>
              <span>
                Type<strong>{keys.find((key) => key.key === selectedKey)?.type || "-"}</strong>
              </span>
              <span>
                Size<strong>{keys.find((key) => key.key === selectedKey)?.memoryBytes || 0} B</strong>
              </span>
              <span>
                Encoding<strong>-</strong>
              </span>
            </div>
            {keys.find((key) => key.key === selectedKey)?.type === "hash" ? (
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(selectedKeyData)
                    ? selectedKeyData.map(([field, value]) => (
                        <tr key={field}>
                          <td>{field}</td>
                          <td>string</td>
                          <td>{value}</td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            ) : null}
          </Panel>

          <Panel className="raw-panel">
            <div className="type-tabs">
              <button className="active" type="button">
                Raw
              </button>
              <button type="button">JSON</button>
            </div>
            <pre>
              {keys.find((key) => key.key === selectedKey)?.type === "string"
                ? selectedKeyData
                : keys.find((key) => key.key === selectedKey)?.type === "hash" && Array.isArray(selectedKeyData)
                  ? selectedKeyData.map((entry, index) => `${index + 1}) "${entry[0]}"\n${index + 2}) "${entry[1]}"`).join("\n")
                  : ""}
            </pre>
            <div className="panel-footer">
              <Button icon={<Copy size={14} />}>Copy</Button>
            </div>
          </Panel>
        </div>

        <div className="queue-grid">
          <Panel className="queue-list-panel">
            <div className="panel-header">
              <h2>BullMQ Queues</h2>
              <Button ariaLabel="Add queue" icon={<Plus size={15} />} />
            </div>
            {queues.map((queue) => (
              <button
                className={selectedQueue === queue.name ? "queue-row active" : "queue-row"}
                key={queue.name}
                type="button"
                onClick={() => {
                  setSelectedQueue(queue.name);
                  fetchJobs(connectionId, queue.name, queue.prefix);
                }}
              >
                <span>
                  <strong>{queue.name}</strong>
                  <small>{queue.prefix}</small>
                </span>
                <em>{queue.active + queue.waiting}</em>
                <em>{queue.failed}</em>
                <Sparkline compact />
              </button>
            ))}
            <div className="panel-footer">{queues.length} queues</div>
          </Panel>

          <div className="jobs-region">
            <div className="job-metrics">
              <MetricCard icon={<TriangleAlert size={22} />} label="Waiting" value={(queues.reduce((sum, queue) => sum + queue.waiting, 0)).toString()} detail="-" />
              <MetricCard icon={<Play size={22} />} label="Active" value={(queues.reduce((sum, queue) => sum + queue.active, 0)).toString()} detail="-" />
              <MetricCard icon={<Clock3 size={22} />} label="Delayed" value={(queues.reduce((sum, queue) => sum + queue.delayed, 0)).toString()} detail="-" />
              <MetricCard icon={<CheckCircle2 size={22} />} label="Completed" value={(queues.reduce((sum, queue) => sum + queue.completed, 0)).toString()} detail="-" />
              <MetricCard icon={<PauseCircle size={22} />} label="Failed" value={(queues.reduce((sum, queue) => sum + queue.failed, 0)).toString()} detail="-" danger />
            </div>
            <Panel className="jobs-table">
              <div className="panel-header">
                <h2>Jobs</h2>
                <CommandInput icon={<Search size={15} />} placeholder="Search jobs..." />
                <select aria-label="Queue filter">
                  <option>All Queues</option>
                </select>
                <span className="auto-refresh">
                  Auto-refresh <StatusDot label="" tone="success" />
                </span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Name</th>
                    <th>Queue</th>
                    <th>Status</th>
                    <th>Attempts</th>
                    <th>Duration</th>
                    <th>Created At</th>
                    <th>Finished At</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>{job.id}</td>
                      <td>{job.name}</td>
                      <td>{job.queueName}</td>
                      <td>
                        <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                      </td>
                      <td>{job.attemptsMade}</td>
                      <td>{job.durationMs ? `${job.durationMs}ms` : "-"}</td>
                      <td>{job.createdAt ? new Date(job.createdAt).toLocaleString() : "-"}</td>
                      <td>{job.finishedAt ? new Date(job.finishedAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>

          <Panel className="queue-metrics-panel">
            <div className="panel-header">
              <h2>Queue Metrics</h2>
              <select aria-label="Selected queue">
                <option>{selectedQueue || "Select queue"}</option>
              </select>
            </div>
            {queueMetricRows.map(({ label, value, Icon }) => (
              <div className="queue-metric" key={label}>
                <span>
                  <Icon size={15} /> {label}
                </span>
                <strong>{value}</strong>
                <Sparkline compact danger={label === "Failure Rate"} />
              </div>
            ))}
            <div className="panel-footer">Last 5 minutes</div>
          </Panel>
        </div>
      </section>
    );
  };

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="brand">
          <img src="/logo.svg" alt="Redon" />
          <div>
            <strong>Redon</strong>
            <span>v0.1.0</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => (
            <button
              className={item.view !== undefined && item.view === view ? "nav-item nav-item-active" : "nav-item"}
              key={item.label}
              onClick={() => {
                if (item.view) setView(item.view);
              }}
              type="button"
            >
              <item.icon aria-hidden size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {activeProfile ? (
          <Panel className="connection-card">
            <div className="connection-name">{activeProfile.name}</div>
            <dl>
              <dt>Host</dt>
              <dd>
                {activeProfile.host}:{activeProfile.port}
              </dd>
              <dt>Mode</dt>
              <dd>Standalone</dd>
            </dl>
            <StatusDot label="Connected" tone="success" />
          </Panel>
        ) : null}
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="connection-select">
            <span>Connection</span>
            <select
              value={activeProfileId || ""}
              onChange={(event) => openConnection(event.target.value)}
              style={{ padding: "0 10px" }}
            >
              <option value="" disabled>
                Select Connection
              </option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
          <Badge tone={activeProfileId ? "success" : "muted"}>{activeProfileId ? "Connected" : "Disconnected"}</Badge>
          <div className="latency">
            Latency: <strong>0.00 ms</strong>
          </div>
          <CommandInput icon={<Command size={15} />} placeholder="Quick command or search... Ctrl K" />
          <Button icon={<RefreshCw size={16} />} ariaLabel="Refresh">
            Refresh
          </Button>
          <Button icon={<Plus size={16} />} onClick={() => setView("connections")}>
            New Connection
          </Button>
        </header>

        {activeProfileId ? (
          <div className="breadcrumb">
            redis://{activeProfile?.host}:{activeProfile?.port}/{activeProfile?.database} &gt; {view}
          </div>
        ) : null}

        {view === "connections" ? renderConnectionsView() : renderOverviewView()}
      </main>
    </div>
  );
}
