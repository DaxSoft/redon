import {
  Activity,
  CheckCircle2,
  Clock3,
  Copy,
  Database,
  Gauge,
  Link2,
  PauseCircle,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Zap,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import Editor from "@monaco-editor/react";
import { useState } from "react";
import {
  Badge,
  Button,
  CommandInput,
  MetricCard,
  Panel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sparkline,
  StatusDot,
} from "@redon/ui";
import { RANGE_TO_MINUTES, RangeKey, TIME_RANGES } from "../constants";

function statusTone(status: string): "success" | "info" | "warning" | "danger" {
  if (status === "active") return "info";
  if (status === "delayed" || status === "retrying") return "warning";
  if (status === "failed" || status === "stalled") return "danger";
  return "success";
}

interface OverviewViewProps {
  readonly activeProfileId: string | null;
  readonly setViewConnections: () => void;
  readonly selectedRange: RangeKey;
  readonly setSelectedRange: (value: RangeKey) => void;
  readonly metrics: any;
  readonly telemetry: any[];
  readonly keys: any[];
  readonly selectedKey: string | null;
  readonly setSelectedKey: (key: string | null) => void;
  readonly selectedKeyData: any;
  readonly fetchKeyData: (id: string, key: string, type: string) => void;
  readonly fetchKeys: (id: string) => void;
  readonly queues: any[];
  readonly selectedQueue: string | null;
  readonly setSelectedQueue: (name: string | null) => void;
  readonly jobs: any[];
  readonly fetchJobs: (id: string, queueName: string, prefix: string) => Promise<readonly any[]>;
}

export function OverviewView(props: OverviewViewProps) {
  const [valueViewMode, setValueViewMode] = useState<"raw" | "json">("raw");
  const [keySearch, setKeySearch] = useState("");
  const [keysPage, setKeysPage] = useState(1);

  if (!props.activeProfileId) {
    return (
      <section className="workspace">
        <Panel className="empty-connection-panel">
          <h2>No Active Connection</h2>
          <p>Create or open a Redis connection before using the overview.</p>
          <Button onClick={props.setViewConnections} icon={<Link2 size={16} />}>
            Open Connections
          </Button>
        </Panel>
      </section>
    );
  }

  const connectionId = props.activeProfileId;
  const rangeMinutes = RANGE_TO_MINUTES[props.selectedRange];
  const rangeStartMs = Date.now() - rangeMinutes * 60 * 1000;
  const visibleTelemetry = props.telemetry.filter((point) => {
    const ts = Date.parse(point.timestampIso);
    return Number.isFinite(ts) && ts >= rangeStartMs;
  });
  const data = visibleTelemetry.length > 0 ? visibleTelemetry : props.telemetry;
  const queueSelectProps = props.selectedQueue
    ? { value: props.selectedQueue }
    : {};
  const keyTypeRows = [
    { label: "String", key: "string" },
    { label: "Hash", key: "hash" },
    { label: "List", key: "list" },
    { label: "Set", key: "set" },
    { label: "Sorted Set", key: "zset" },
    { label: "Stream", key: "stream" },
    { label: "JSON", key: "json" },
  ] as const;
  const typeCountMap = props.keys.reduce<Record<string, number>>((acc, row) => {
    acc[row.type] = (acc[row.type] ?? 0) + 1;
    return acc;
  }, {});
  const countedKeysTotal = keyTypeRows.reduce(
    (sum, row) => sum + (typeCountMap[row.key] ?? 0),
    0,
  );
  const typePercentBase = countedKeysTotal > 0 ? countedKeysTotal : 1;
  const normalizedSearch = keySearch.trim().toLowerCase();
  const filteredKeys =
    normalizedSearch.length > 0
      ? props.keys.filter(
          (row) =>
            row.key.toLowerCase().includes(normalizedSearch) ||
            row.type.toLowerCase().includes(normalizedSearch),
        )
      : props.keys;
  const sortedFilteredKeys = [...filteredKeys].sort(
    (a, b) => (b.memoryBytes ?? 0) - (a.memoryBytes ?? 0),
  );
  const keysPerPage = 20;
  const keysPageCount = Math.max(
    1,
    Math.ceil(sortedFilteredKeys.length / keysPerPage),
  );
  const clampedPage = Math.min(keysPage, keysPageCount);
  const pagedKeys = sortedFilteredKeys.slice(
    (clampedPage - 1) * keysPerPage,
    clampedPage * keysPerPage,
  );
  const selectedKeyEntry = props.keys.find(
    (key) => key.key === props.selectedKey,
  );
  const selectedQueueEntry = props.queues.find((queue) => queue.name === props.selectedQueue) ?? null;
  const activeJobs = props.jobs.filter((job) => job.status === "active").length;
  const failedJobs = props.jobs.filter((job) => job.status === "failed").length;
  const retryingJobs = props.jobs.filter((job) => job.attemptsMade > 0).length;
  const activeWorkers = new Set(
    props.jobs.map((job) => (typeof job.processedBy === "string" ? job.processedBy : null)).filter(Boolean),
  ).size;
  const queueThroughput =
    props.telemetry.length > 1
      ? Math.round(
          props.telemetry
            .slice(-12)
            .reduce((sum, point) => sum + (point.opsPerSecond ?? 0), 0) / Math.max(1, Math.min(props.telemetry.length, 12)),
        )
      : 0;
  const queueFailureRateBase = Math.max(1, (selectedQueueEntry?.completed ?? 0) + (selectedQueueEntry?.failed ?? 0));
  const queueFailureRate = `${(((selectedQueueEntry?.failed ?? failedJobs) / queueFailureRateBase) * 100).toFixed(1)}%`;
  const queueRetryRate = `${((retryingJobs / Math.max(1, props.jobs.length)) * 100).toFixed(1)}%`;
  const computedQueueMetricRows = [
    { label: "Throughput", value: `${queueThroughput} jobs/min`, Icon: Activity },
    { label: "Retry Rate", value: queueRetryRate, Icon: Zap },
    { label: "Failure Rate", value: queueFailureRate, Icon: ShieldCheck },
    { label: "Active Workers", value: activeWorkers.toString(), Icon: Gauge },
  ] as const;
  const rawValueText =
    selectedKeyEntry?.type === "string"
      ? (props.selectedKeyData ?? "")
      : selectedKeyEntry?.type === "hash" &&
          Array.isArray(props.selectedKeyData)
        ? props.selectedKeyData
            .map(
              (entry, index) =>
                `${index + 1}) "${entry[0]}"\n${index + 2}) "${entry[1]}"`,
            )
            .join("\n")
        : "";
  const jsonValueText = (() => {
    if (selectedKeyEntry?.type === "string") {
      try {
        const parsed = JSON.parse(props.selectedKeyData ?? "");
        return JSON.stringify(parsed, null, 2);
      } catch {
        return JSON.stringify({ value: props.selectedKeyData ?? "" }, null, 2);
      }
    }
    if (
      selectedKeyEntry?.type === "hash" &&
      Array.isArray(props.selectedKeyData)
    ) {
      const asObj = Object.fromEntries(props.selectedKeyData);
      return JSON.stringify(asObj, null, 2);
    }
    return "{}";
  })();

  const handleCopyValue = async () => {
    const content = valueViewMode === "json" ? jsonValueText : rawValueText;
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // no-op
    }
  };
  const chartOption: EChartsOption = {
    animation: true,
    grid: { top: 12, right: 16, bottom: 22, left: 34 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#041107",
      borderColor: "#0f8c4a",
      textStyle: { color: "#d7ffe7" },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: data.map((point) => {
        const date = new Date(point.timestampIso);
        return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      }),
      axisLabel: { color: "#7cbf96", fontSize: 11 },
      axisLine: { lineStyle: { color: "rgba(30,255,90,0.16)" } },
      splitLine: { show: true, lineStyle: { color: "rgba(30,255,90,0.08)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#7cbf96", fontSize: 11 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "rgba(30,255,90,0.08)" } },
    },
    series: [
      {
        name: "Ops/sec",
        type: "line",
        smooth: true,
        symbol: "none",
        data: data.map((point) => point.opsPerSecond ?? 0),
        lineStyle: { width: 3, color: "#1eff5a" },
        areaStyle: { color: "rgba(30,255,90,0.18)" },
      },
    ],
  };

  return (
    <section className="workspace">
      <div className="metric-grid">
        <MetricCard
          icon={<Database size={23} />}
          label="Memory Usage"
          value={props.metrics?.memoryUsage || "0 B"}
          detail="-"
          trend="up"
        />
        <MetricCard
          sparkline
          sparklineData={props.telemetry.map((point) => point.opsPerSecond)}
          label="Ops / sec"
          value={props.metrics?.opsPerSec?.toString() || "0"}
          detail="-"
          trend="up"
        />
        <MetricCard
          sparkline
          sparklineData={props.telemetry.map((point) => point.hitRate)}
          label="Hit Rate"
          value={props.metrics?.hitRate || "0%"}
          detail="-"
          trend="up"
        />
        <MetricCard
          icon={<Server size={23} />}
          label="Connected Clients"
          value={props.metrics?.connectedClients?.toString() || "0"}
          detail="-"
          trend="up"
        />
        <MetricCard
          icon={<Clock3 size={23} />}
          label="Expired Keys"
          value={props.metrics?.expiredKeys?.toString() || "0"}
          detail="-"
          trend="up"
        />
        <MetricCard
          icon={<Database size={23} />}
          label="Total Keys"
          value={props.metrics?.totalKeys?.toString() || "0"}
          detail="-"
          trend="up"
        />
      </div>

      <div className="dashboard-grid">
        <Panel className="activity-panel">
          <div className="panel-header">
            <h2>Redis Activity</h2>
            <Select defaultValue="ops-per-sec">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ops-per-sec">Ops/sec</SelectItem>
              </SelectContent>
            </Select>
            <div className="range-tabs">
              {TIME_RANGES.map((range) => (
                <button
                  className={props.selectedRange === range ? "active" : ""}
                  key={range}
                  onClick={() => props.setSelectedRange(range)}
                  type="button"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-surface">
            <ReactECharts
              option={chartOption}
              notMerge
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </Panel>

        <Panel className="type-panel">
          <div className="panel-header">
            <h2>Key Types</h2>
            <Badge tone="info">By Count</Badge>
          </div>
          {keyTypeRows.map((row) => {
            const count = typeCountMap[row.key] ?? 0;
            const pct = `${((count / typePercentBase) * 100).toFixed(0)}%`;
            return (
              <div className="type-row" key={row.label}>
                <span>{row.label}</span>
                <strong>{count}</strong>
                <div>
                  <i style={{ width: pct }} />
                </div>
                <em>{pct}</em>
              </div>
            );
          })}
          <div className="type-total">
            <span>Total Keys</span>
            <strong>{props.metrics?.totalKeys || 0}</strong>
          </div>
        </Panel>
      </div>

      <div className="inspector-grid">
        <Panel className="key-browser">
          <div className="panel-header">
            <h2>Key Browser</h2>
            <Button ariaLabel="Filter keys" icon={<Search size={15} />} />
          </div>
          <CommandInput
            icon={<Search size={15} />}
            placeholder="Filter keys by pattern..."
            value={keySearch}
            onChange={(event) => {
              setKeySearch(event.target.value);
              setKeysPage(1);
            }}
          />
          <div className="key-list">
            {pagedKeys.map((row) => (
              <button
                className={
                  props.selectedKey === row.key ? "key-row selected" : "key-row"
                }
                key={row.key}
                onClick={() => {
                  props.setSelectedKey(row.key);
                  props.fetchKeyData(connectionId, row.key, row.type);
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
            <span>{sortedFilteredKeys.length} keys</span>
            <div
              style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <Button
                type="button"
                onClick={() => setKeysPage((page) => Math.max(1, page - 1))}
                disabled={clampedPage <= 1}
              >
                Prev
              </Button>
              <span>
                {clampedPage}/{keysPageCount}
              </span>
              <Button
                type="button"
                onClick={() =>
                  setKeysPage((page) => Math.min(keysPageCount, page + 1))
                }
                disabled={clampedPage >= keysPageCount}
              >
                Next
              </Button>
              <RefreshCw
                size={13}
                onClick={() => props.fetchKeys(connectionId)}
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>
        </Panel>

        <Panel className="value-panel">
          <div className="panel-header">
            <h2>Value Inspector</h2>
            <div className="type-tabs">
              {["String", "Hash", "List", "Set", "ZSet", "Stream", "JSON"].map(
                (tab) => (
                  <button
                    className={
                      props.keys
                        .find((key) => key.key === props.selectedKey)
                        ?.type?.toLowerCase() === tab.toLowerCase()
                        ? "active"
                        : ""
                    }
                    key={tab}
                    type="button"
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>
            <div className="header-actions">
              <span>
                TTL: <strong>{selectedKeyEntry?.ttlSeconds ?? -1}</strong>
              </span>
              <Copy size={15} />
              <Trash2 size={15} />
            </div>
          </div>
          <div className="metadata-grid">
            <span>
              Key<strong>{props.selectedKey || "-"}</strong>
            </span>
            <span>
              Type<strong>{selectedKeyEntry?.type || "-"}</strong>
            </span>
            <span>
              Size<strong>{selectedKeyEntry?.memoryBytes || 0} B</strong>
            </span>
            <span>
              Encoding<strong>-</strong>
            </span>
          </div>
          {selectedKeyEntry?.type === "hash" ? (
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(props.selectedKeyData)
                  ? props.selectedKeyData.map(([field, value]) => (
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
            <button
              className={valueViewMode === "raw" ? "active" : ""}
              onClick={() => setValueViewMode("raw")}
              type="button"
            >
              Raw
            </button>
            <button
              className={valueViewMode === "json" ? "active" : ""}
              onClick={() => setValueViewMode("json")}
              type="button"
            >
              JSON
            </button>
            <div className="panel-footer">
              <Button icon={<Copy size={14} />} onClick={handleCopyValue}>
                Copy
              </Button>
            </div>
          </div>
          {valueViewMode === "json" ? (
            <div className="json-editor-surface">
              <Editor
                height="600px"
                defaultLanguage="json"
                language="json"
                theme="vs-dark"
                value={jsonValueText}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </div>
          ) : (
            <pre style={{ maxHeight: "600px" }}>{rawValueText}</pre>
          )}
        </Panel>
      </div>

      <div className="queue-grid">
        <Panel className="queue-list-panel">
          <div className="panel-header">
            <h2>BullMQ Queues</h2>
            <Button ariaLabel="Add queue" icon={<Plus size={15} />} />
          </div>
          {props.queues.map((queue) => (
            <button
              className={
                props.selectedQueue === queue.name
                  ? "queue-row active"
                  : "queue-row"
              }
              key={queue.name}
              type="button"
              onClick={() => {
                props.setSelectedQueue(queue.name);
                props.fetchJobs(connectionId, queue.name, queue.prefix).catch(() => undefined);
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
          <div className="panel-footer">{props.queues.length} queues</div>
        </Panel>
        <div className="jobs-region">
          <div className="job-metrics">
            <MetricCard
              icon={<TriangleAlert size={22} />}
              label="Waiting"
              value={props.queues
                .reduce((sum, queue) => sum + queue.waiting, 0)
                .toString()}
              detail="-"
            />
            <MetricCard
              icon={<Play size={22} />}
              label="Active"
              value={props.queues
                .reduce((sum, queue) => sum + queue.active, 0)
                .toString()}
              detail="-"
            />
            <MetricCard
              icon={<Clock3 size={22} />}
              label="Delayed"
              value={props.queues
                .reduce((sum, queue) => sum + queue.delayed, 0)
                .toString()}
              detail="-"
            />
            <MetricCard
              icon={<CheckCircle2 size={22} />}
              label="Completed"
              value={props.queues
                .reduce((sum, queue) => sum + queue.completed, 0)
                .toString()}
              detail="-"
            />
            <MetricCard
              icon={<PauseCircle size={22} />}
              label="Failed"
              value={props.queues
                .reduce((sum, queue) => sum + queue.failed, 0)
                .toString()}
              detail="-"
              danger
            />
          </div>
          <Panel className="jobs-table">
            <div className="panel-header">
              <h2>Jobs</h2>
              <CommandInput
                icon={<Search size={15} />}
                placeholder="Search jobs..."
              />
              <Select defaultValue="all-queues">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-queues">All Queues</SelectItem>
                </SelectContent>
              </Select>
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
                {props.jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.id}</td>
                    <td>{job.name}</td>
                    <td>{job.queueName}</td>
                    <td>
                      <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                    </td>
                    <td>{job.attemptsMade}</td>
                    <td>{job.durationMs ? `${job.durationMs}ms` : "-"}</td>
                    <td>
                      {job.createdAt
                        ? new Date(job.createdAt).toLocaleString()
                        : "-"}
                    </td>
                    <td>
                      {job.finishedAt
                        ? new Date(job.finishedAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
        <Panel className="queue-metrics-panel">
          <div className="panel-header">
            <h2>Queue Metrics</h2>
            <Select
              {...queueSelectProps}
              onValueChange={(queueName) => {
                const queue = props.queues.find((item) => item.name === queueName);
                if (!queue) return;
                props.setSelectedQueue(queue.name);
                props.fetchJobs(connectionId, queue.name, queue.prefix).catch(() => undefined);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select queue" />
              </SelectTrigger>
              <SelectContent>
                {props.queues.map((queue) => (
                  <SelectItem key={queue.name} value={queue.name}>
                    {queue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {computedQueueMetricRows.map(({ label, value, Icon }) => (
            <div className="queue-metric" key={label}>
              <span>
                <Icon size={15} /> {label}
              </span>
              <strong>{value}</strong>
              <Sparkline
                compact
                danger={label === "Failure Rate"}
                data={label === "Failure Rate" ? [failedJobs, selectedQueueEntry?.failed ?? failedJobs] : [activeJobs, selectedQueueEntry?.active ?? activeJobs]}
              />
            </div>
          ))}
          <div className="panel-footer">Last 5 minutes</div>
        </Panel>
      </div>
    </section>
  );
}
