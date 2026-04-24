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

interface KeyRow {
  readonly key: string;
  readonly type: "namespace" | "string" | "stream" | "hash";
  readonly count: string;
  readonly selected?: boolean;
}

const keyRows: readonly KeyRow[] = [
  { key: "bull:email", type: "namespace", count: "1,204" },
  { key: "bull:webhook", type: "namespace", count: "1,102" },
  { key: "bull:sync", type: "namespace", count: "982" },
  { key: "bull:image", type: "namespace", count: "768" },
  { key: "session:user:42", type: "string", count: "1" },
  { key: "cache:products", type: "string", count: "1" },
  { key: "stream:orders", type: "stream", count: "1,842" },
  { key: "rate_limit:api", type: "string", count: "1" },
  { key: "hash:user:1001", type: "hash", count: "1", selected: true }
] as const;

const hashFields = [
  ["id", "string", "1001", "4 B"],
  ["email", "string", "alice@example.com", "17 B"],
  ["name", "string", "Alice Johnson", "13 B"],
  ["plan", "string", "pro", "3 B"],
  ["created_at", "string", "2024-05-20T10:15:30Z", "20 B"],
  ["last_login", "string", "2024-05-24T11:18:05Z", "20 B"]
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

        <Panel className="connection-card">
          <div className="connection-name">prod-cache-eu</div>
          <dl>
            <dt>Redis</dt>
            <dd>7.2.4</dd>
            <dt>Uptime</dt>
            <dd>12d 04:21:18</dd>
            <dt>Mode</dt>
            <dd>Standalone</dd>
            <dt>Memory</dt>
            <dd>16.0 GB</dd>
            <dt>Used</dt>
            <dd>5.62 GB (35.1%)</dd>
          </dl>
          <StatusDot label="Connected" tone="success" />
        </Panel>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <div className="connection-select">
            <span>Connection</span>
            <button type="button">
              <Database size={16} />
              prod-cache-eu / db0
              <Menu size={14} />
            </button>
          </div>
          <Badge tone="success">Connected</Badge>
          <div className="latency">Latency: <strong>0.41 ms</strong></div>
          <CommandInput icon={<Command size={15} />} placeholder="Quick command or search...  Ctrl K" />
          <Button icon={<RefreshCw size={16} />}>Refresh</Button>
          <Button icon={<Plus size={16} />}>New Connection</Button>
          <Button icon={<MoreVertical size={16} />}>Actions</Button>
        </header>

        <div className="breadcrumb">redis://prod-cache-eu:6379/0 &gt; queues &gt; overview</div>

        <section className="workspace">
          <div className="metric-grid">
            <MetricCard icon={<Database size={23} />} label="Memory Usage" value="5.62 GB" detail="35.1% of 16.0 GB" trend="up" />
            <MetricCard sparkline label="Ops / sec" value="128.6K" detail="12.4% vs 1m ago" trend="up" />
            <MetricCard sparkline label="Hit Rate" value="98.74%" detail="0.21% vs 1m ago" trend="up" />
            <MetricCard icon={<Server size={23} />} label="Connected Clients" value="52" detail="3 vs 1m ago" trend="up" />
            <MetricCard icon={<Clock3 size={23} />} sparkline label="Expired Keys" value="21.4K" detail="8.1% vs 1m ago" trend="up" />
            <MetricCard icon={<Database size={23} />} sparkline label="Total Keys" value="2.48M" detail="1.6% vs 1m ago" trend="up" />
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
                <Sparkline variant="area" />
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
                ["String", "1,245,852", "50.2%"],
                ["Hash", "532,180", "21.5%"],
                ["List", "287,640", "11.6%"],
                ["Set", "146,251", "5.9%"],
                ["Sorted Set", "118,764", "4.8%"],
                ["Stream", "82,393", "3.3%"],
                ["JSON", "64,567", "2.6%"]
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
                <strong>2,477,647</strong>
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
                {keyRows.map((row) => (
                  <button className={row.selected ? "key-row selected" : "key-row"} key={row.key} type="button">
                    <span>{row.type === "namespace" ? "▸" : ""} {row.key}</span>
                    <em>{row.type}</em>
                    <strong>{row.count}</strong>
                  </button>
                ))}
              </div>
              <div className="panel-footer">9 keys <RefreshCw size={13} /></div>
            </Panel>

            <Panel className="value-panel">
              <div className="panel-header">
                <h2>Value Inspector</h2>
                <div className="type-tabs">
                  {["String", "Hash", "List", "Set", "ZSet", "Stream", "JSON"].map((tab) => (
                    <button className={tab === "Hash" ? "active" : ""} key={tab} type="button">{tab}</button>
                  ))}
                </div>
                <div className="header-actions">
                  <span>TTL: <strong>-1</strong></span>
                  <Copy size={15} />
                  <Trash2 size={15} />
                </div>
              </div>
              <div className="metadata-grid">
                <span>Key<strong>hash:user:1001</strong></span>
                <span>Type<strong>Hash</strong></span>
                <span>Size<strong>6 fields</strong></span>
                <span>Encoding<strong>ziplist</strong></span>
                <span>Last Access<strong>2s ago</strong></span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Size</th>
                  </tr>
                </thead>
                <tbody>
                  {hashFields.map(([field, type, value, size]) => (
                    <tr key={field}>
                      <td>{field}</td>
                      <td>{type}</td>
                      <td>{value}</td>
                      <td>{size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <Panel className="raw-panel">
              <div className="type-tabs">
                <button className="active" type="button">Raw</button>
                <button type="button">JSON</button>
              </div>
              <pre>{`1) "id"
2) "1001"
3) "email"
4) "alice@example.com"
5) "name"
6) "Alice Johnson"
7) "plan"
8) "pro"
9) "created_at"
10) "2024-05-20T10:15:30Z"
11) "last_login"
12) "2024-05-24T11:18:05Z"`}</pre>
              <div className="panel-footer">Size: 148 B <Button icon={<Copy size={14} />}>Copy</Button></div>
            </Panel>
          </div>

          <div className="queue-grid">
            <Panel className="queue-list-panel">
              <div className="panel-header">
                <h2>BullMQ Queues</h2>
                <Button ariaLabel="Add queue" icon={<Plus size={15} />} />
              </div>
              {queues.map(([name, description, rate, failure, active]) => (
                <button className={active ? "queue-row active" : "queue-row"} key={name} type="button">
                  <span><strong>{name}</strong><small>{description}</small></span>
                  <em>{rate}</em>
                  <em>{failure}</em>
                  <Sparkline compact />
                </button>
              ))}
              <div className="panel-footer">4 queues <a href="/">View all queues -&gt;</a></div>
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
                    {jobs.map(([id, name, queue, status, attempts, duration, created, finished]) => (
                      <tr key={id}>
                        <td>{id}</td>
                        <td>{name}</td>
                        <td>{queue}</td>
                        <td><Badge tone={statusTone(status)}>{status}</Badge></td>
                        <td>{attempts}</td>
                        <td>{duration}</td>
                        <td>{created}</td>
                        <td>{finished}</td>
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
