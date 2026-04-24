import {
  Activity,
  BarChart3,
  Braces,
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
  Menu,
  MoreVertical,
  Network,
  PauseCircle,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShieldCheck,
  SquareCode,
  Trash2,
  TriangleAlert,
  Workflow,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { useRedis } from "../hooks/useRedis";
import { invokeIpc } from "../ipc-client";
import { createProfileCommand } from "@redon/ipc-contracts";

import {
  Badge,
  Button,
  CommandInput,
  MetricCard,
  Panel,
  Sparkline,
  StatusDot
} from "@redon/ui";

const navItems = [
  { label: "Overview", icon: Grid2X2, active: true },
  { label: "Connections", icon: Link2, active: false },
  { label: "Explorer", icon: Folder, active: false },
  { label: "Keys", icon: KeyRound, active: false },
  { label: "Types", icon: Layers3, active: false },
  { label: "Metrics", icon: BarChart3, active: false },
  { label: "Queues", icon: ListRestart, active: true },
  { label: "Streams", icon: Workflow, active: false },
  { label: "Pub/Sub", icon: Radio, active: false },
  { label: "Lua", icon: FileCode2, active: false },
  { label: "Settings", icon: Settings, active: false }
] as const;

const queues = [
  ["email.send", "Default queue", "128/m", "2.1%", true],
  ["webhook.retry", "Retry webhooks", "86/m", "0.8%", false],
  ["sync.contacts", "Sync contacts", "64/m", "1.3%", false],
  ["image.process", "Image processing", "42/m", "3.7%", false]
] as const;

const jobs = [
  ["e3f8a1c2", "Send Welcome Email", "email.send", "Completed", "1/3", "245 ms", "24 May 11:25:13", "24 May 11:25:13"],
  ["a7b9d3e4", "Send Password Reset", "email.send", "Active", "2/3", "1.24 s", "24 May 11:25:12", "-"],
  ["c8d1f5b7", "Retry Failed Webhook", "webhook.retry", "Delayed", "1/5", "-", "24 May 11:24:58", "-"],
  ["d0a2c9b1", "Sync Contact Batch", "sync.contacts", "Completed", "1/2", "532 ms", "24 May 11:24:47", "24 May 11:24:47"],
  ["b4e7f2a6", "Process Image", "image.process", "Failed", "3/5", "2.14 s", "24 May 11:24:31", "24 May 11:24:33"]
] as const;

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
  if (status === "Active") return "info";
  if (status === "Delayed") return "warning";
  if (status === "Failed") return "danger";
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

  useEffect(() => {
    if (activeProfileId) {
        const interval = setInterval(() => {
            fetchMetrics(activeProfileId);
            fetchQueues(activeProfileId);
            fetchTelemetry(activeProfileId);
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [activeProfileId]);

  const handleCreateConnection = async () => {

    try {
      await invokeIpc(createProfileCommand, {
        id: crypto.randomUUID(),
        name: "Local Redis",
        host: "127.0.0.1",
        port: 6379,
        username: null,
        database: 0,
        tlsEnabled: false,
        credentialRef: null,
        color: null,
        tags: []
      });
      fetchProfiles();
    } catch (e) {
      console.error(e);
    }
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

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
            <button className={item.active ? "nav-item nav-item-active" : "nav-item"} key={item.label} type="button">
              <item.icon aria-hidden size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {activeProfile && (
            <Panel className="connection-card">
            <div className="connection-name">{activeProfile.name}</div>
            <dl>
                <dt>Host</dt>
                <dd>{activeProfile.host}:{activeProfile.port}</dd>
                <dt>Mode</dt>
                <dd>Standalone</dd>
            </dl>
            <StatusDot label="Connected" tone="success" />
            </Panel>
        )}
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="connection-select">
            <span>Connection</span>
            <select 
                value={activeProfileId || ""} 
                onChange={(e) => openConnection(e.target.value)}
                style={{ padding: "0 10px" }}
            >
                <option value="" disabled>Select Connection</option>
                {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </div>
          <Badge tone={activeProfileId ? "success" : "muted"}>
            {activeProfileId ? "Connected" : "Disconnected"}
          </Badge>
          <div className="latency">Latency: <strong>0.00 ms</strong></div>
          <CommandInput icon={<Command size={15} />} placeholder="Quick command or search...  Ctrl K" />
          <Button icon={<RefreshCw size={16} />} ariaLabel="Refresh">Refresh</Button>
          <div onClick={handleCreateConnection}>
             <Button icon={<Plus size={16} />}>New Connection</Button>
          </div>
          <Button icon={<MoreVertical size={16} />}>Actions</Button>
        </header>

        {activeProfileId && (
            <div className="breadcrumb">redis://{activeProfile?.host}:{activeProfile?.port}/{activeProfile?.database} &gt; queues &gt; overview</div>
        )}

        <section className="workspace">
          <div className="metric-grid">
            <MetricCard icon={<Database size={23} />} label="Memory Usage" value={metrics?.memoryUsage || "0 B"} detail="-" trend="up" />
            <MetricCard sparkline sparklineData={telemetry.map((t: any) => t.opsPerSecond)} label="Ops / sec" value={metrics?.opsPerSec?.toString() || "0"} detail="-" trend="up" />
            <MetricCard sparkline sparklineData={telemetry.map((t: any) => t.hitRate)} label="Hit Rate" value={metrics?.hitRate || "0%"} detail="-" trend="up" />
            <MetricCard icon={<Server size={23} />} label="Connected Clients" value={metrics?.connectedClients?.toString() || "0"} detail="-" trend="up" />
            <MetricCard icon={<Clock3 size={23} />} sparkline label="Expired Keys" value={metrics?.expiredKeys?.toString() || "0"} detail="-" trend="up" />
            <MetricCard icon={<Database size={23} />} sparkline label="Total Keys" value={metrics?.totalKeys?.toString() || "0"} detail="-" trend="up" />
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
                <Sparkline variant="area" data={telemetry.map((t: any) => t.opsPerSecond)} />
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
                  <div><i style={{ width: pct }} /></div>
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
                        fetchKeyData(activeProfileId!, row.key, row.type);
                    }}
                    type="button"
                  >
                    <span>{row.type === "none" ? "▸" : ""} {row.key}</span>
                    <em>{row.type}</em>
                    <strong>{row.memoryBytes ? row.memoryBytes + " B" : ""}</strong>
                  </button>
                ))}
              </div>
              <div className="panel-footer">{keys.length} keys <RefreshCw size={13} onClick={() => fetchKeys(activeProfileId!)} style={{cursor: 'pointer'}} /></div>
            </Panel>

            <Panel className="value-panel">
              <div className="panel-header">
                <h2>Value Inspector</h2>
                <div className="type-tabs">
                  {["String", "Hash", "List", "Set", "ZSet", "Stream", "JSON"].map((tab) => (
                    <button className={keys.find(k => k.key === selectedKey)?.type?.toLowerCase() === tab.toLowerCase() ? "active" : ""} key={tab} type="button">{tab}</button>
                  ))}
                </div>
                <div className="header-actions">
                  <span>TTL: <strong>{keys.find(k => k.key === selectedKey)?.ttlSeconds ?? -1}</strong></span>
                  <Copy size={15} />
                  <Trash2 size={15} />
                </div>
              </div>
              <div className="metadata-grid">
                <span>Key<strong>{selectedKey || "-"}</strong></span>
                <span>Type<strong>{keys.find(k => k.key === selectedKey)?.type || "-"}</strong></span>
                <span>Size<strong>{keys.find(k => k.key === selectedKey)?.memoryBytes || 0} B</strong></span>
                <span>Encoding<strong>-</strong></span>
              </div>
              {keys.find(k => k.key === selectedKey)?.type === "hash" && (
                  <table>
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Type</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(selectedKeyData) ? selectedKeyData.map(([field, value]) => (
                        <tr key={field}>
                          <td>{field}</td>
                          <td>string</td>
                          <td>{value}</td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
              )}
            </Panel>

            <Panel className="raw-panel">
              <div className="type-tabs">
                <button className="active" type="button">Raw</button>
                <button type="button">JSON</button>
              </div>
              <pre>{
                  keys.find(k => k.key === selectedKey)?.type === "string" ? selectedKeyData :
                  keys.find(k => k.key === selectedKey)?.type === "hash" && Array.isArray(selectedKeyData) ? selectedKeyData.map((e: any, i: number) => `${i+1}) "${e[0]}"\n${i+2}) "${e[1]}"`).join("\n") : ""
              }</pre>
              <div className="panel-footer"> <Button icon={<Copy size={14} />}>Copy</Button></div>
            </Panel>
          </div>

          <div className="queue-grid">
            <Panel className="queue-list-panel">
              <div className="panel-header">
                <h2>BullMQ Queues</h2>
                <Button ariaLabel="Add queue" icon={<Plus size={15} />} />
              </div>
              {queues.map((q) => (
                <button 
                  className={selectedQueue === q.name ? "queue-row active" : "queue-row"} 
                  key={q.name} 
                  type="button"
                  onClick={() => {
                      setSelectedQueue(q.name);
                      fetchJobs(activeProfileId!, q.name, q.prefix);
                  }}
                >
                  <span><strong>{q.name}</strong><small>{q.prefix}</small></span>
                  <em>{q.active + q.waiting}</em>
                  <em>{q.failed}</em>
                  <Sparkline compact />
                </button>
              ))}
              <div className="panel-footer">{queues.length} queues <a href="/">View all queues -&gt;</a></div>
            </Panel>

            <div className="jobs-region">
              <div className="job-metrics">
                <MetricCard icon={<TriangleAlert size={22} />} label="Waiting" value="1,248" detail="128" />
                <MetricCard icon={<Play size={22} />} label="Active" value="82" detail="6" />
                <MetricCard icon={<Clock3 size={22} />} label="Delayed" value="231" detail="12" />
                <MetricCard icon={<CheckCircle2 size={22} />} label="Completed" value="12,845" detail="7024" />
                <MetricCard icon={<PauseCircle size={22} />} label="Failed" value="143" detail="7" danger />
              </div>
              <Panel className="jobs-table">
                <div className="panel-header">
                  <h2>Jobs</h2>
                  <CommandInput icon={<Search size={15} />} placeholder="Search jobs..." />
                  <select aria-label="Queue filter">
                    <option>All Queues</option>
                  </select>
                  <span className="auto-refresh">Auto-refresh <StatusDot label="" tone="success" /></span>
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
                        <td><Badge tone={statusTone(job.status)}>{job.status}</Badge></td>
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
                  <option>email.send</option>
                </select>
              </div>
              {queueMetricRows.map(({ label, value, Icon }) => (
                <div className="queue-metric" key={label}>
                  <span><Icon size={15} /> {label}</span>
                  <strong>{value}</strong>
                  <Sparkline compact danger={label === "Failure Rate"} />
                </div>
              ))}
              <div className="panel-footer">Last 5 minutes</div>
            </Panel>
          </div>
        </section>
      </main>
    </div>
  );
}
