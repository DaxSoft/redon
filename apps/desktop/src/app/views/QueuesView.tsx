import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Copy,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import type { BullQueueJob, BullQueueSummary } from "@redon/ipc-contracts";
import { Badge, Button, CommandInput, Panel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, StatusDot, Switch } from "@redon/ui";

type JobStatusFilter = "all" | "waiting" | "active" | "delayed" | "completed" | "failed";

interface QueuesViewProps {
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

function toneFromJobStatus(status: BullQueueJob["status"]): "success" | "info" | "warning" | "danger" | "muted" {
  if (status === "completed") return "success";
  if (status === "active" || status === "prioritized") return "info";
  if (status === "delayed" || status === "waiting" || status === "waiting-children") return "warning";
  if (status === "failed" || status === "stalled") return "danger";
  return "muted";
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatWhen(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function QueuesView(props: QueuesViewProps) {
  const [queueSearch, setQueueSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [payloadMode, setPayloadMode] = useState<"raw" | "json">("json");
  const [isAutoRefreshOn, setIsAutoRefreshOn] = useState(true);

  const connectionId = props.activeProfileId ?? "";

  useEffect(() => {
    if (!props.activeProfileId || !isAutoRefreshOn) return;
    const timer = window.setInterval(() => {
      props.refreshAll().catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [props.activeProfileId, isAutoRefreshOn, props.refreshAll]);

  const selectedQueueData = props.queues.find((queue) => queue.name === props.selectedQueue) ?? props.queues[0] ?? null;
  const normalizedQueueSearch = queueSearch.trim().toLowerCase();
  const visibleQueues = normalizedQueueSearch.length === 0
    ? props.queues
    : props.queues.filter((queue) => queue.name.toLowerCase().includes(normalizedQueueSearch));

  const filteredJobs = useMemo(() => {
    const normalizedJobSearch = jobSearch.trim().toLowerCase();
    return props.jobs.filter((job) => {
      const statusMatches = statusFilter === "all" || job.status === statusFilter;
      if (!statusMatches) return false;
      if (normalizedJobSearch.length === 0) return true;
      return (
        job.id.toLowerCase().includes(normalizedJobSearch) ||
        job.name.toLowerCase().includes(normalizedJobSearch) ||
        job.status.toLowerCase().includes(normalizedJobSearch)
      );
    });
  }, [props.jobs, jobSearch, statusFilter]);

  const statusCounters = useMemo(
    () => ({
      waiting: props.jobs.filter((job) => job.status === "waiting").length,
      active: props.jobs.filter((job) => job.status === "active").length,
      delayed: props.jobs.filter((job) => job.status === "delayed").length,
      completed: props.jobs.filter((job) => job.status === "completed").length,
      failed: props.jobs.filter((job) => job.status === "failed").length,
    }),
    [props.jobs]
  );

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pagedJobs = filteredJobs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const selectedJob = props.jobs.find((job) => job.id === props.selectedJobId) ?? pagedJobs[0] ?? null;

  const throughputChartOption: EChartsOption = {
    animation: true,
    grid: { top: 12, right: 10, left: 34, bottom: 24 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#030d06",
      borderColor: "#1eff5a",
      textStyle: { color: "#d4ffe3" },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: props.telemetry.map((point) => {
        const date = new Date(point.timestampIso);
        return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      }),
      axisLine: { lineStyle: { color: "rgba(30,255,90,0.22)" } },
      axisLabel: { color: "#74b892", fontSize: 11 },
      splitLine: { show: true, lineStyle: { color: "rgba(30,255,90,0.08)" } },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisLabel: { color: "#74b892", fontSize: 11 },
      splitLine: { lineStyle: { color: "rgba(30,255,90,0.08)" } },
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "none",
        data: props.telemetry.map((point) => point.opsPerSecond ?? 0),
        lineStyle: { color: "#1eff5a", width: 2.5 },
        areaStyle: { color: "rgba(30,255,90,0.18)" },
      },
    ],
  };

  const queueTotals = props.queues.reduce(
    (acc, queue) => {
      acc.total += 1;
      acc.waiting += queue.waiting;
      acc.active += queue.active;
      acc.delayed += queue.delayed;
      acc.completed += queue.completed;
      acc.failed += queue.failed;
      return acc;
    },
    { total: 0, waiting: 0, active: 0, delayed: 0, completed: 0, failed: 0 }
  );

  const handleQueueAction = async (action: (queue: BullQueueSummary) => Promise<void>) => {
    if (props.queues.length === 0) return;
    await Promise.all(props.queues.map((queue) => action(queue)));
    await props.refreshAll();
  };

  const handleQueueSelection = async (queue: BullQueueSummary) => {
    props.setSelectedQueue(queue.name);
    await props.fetchJobs(connectionId, queue.name, queue.prefix);
  };

  const payloadRaw = selectedJob ? JSON.stringify(selectedJob.data ?? {}, null, 2) : "{}";
  const payloadJson = payloadRaw;

  if (!props.activeProfileId) {
    return (
      <section className="workspace">
        <Panel className="empty-connection-panel">
          <h2>No Active Connection</h2>
          <p>Create or open a Redis connection before using queues.</p>
          <Button onClick={props.setViewConnections}>Open Connections</Button>
        </Panel>
      </section>
    );
  }

  return (
    <section className="workspace queues-workspace">
      <div className="queues-actions-bar">
        <Button icon={<Pause size={15} />} onClick={() => handleQueueAction((queue) => props.pauseQueue(connectionId, queue.name, queue.prefix))}>
          Pause All
        </Button>
        <Button icon={<Play size={15} />} onClick={() => handleQueueAction((queue) => props.resumeQueue(connectionId, queue.name, queue.prefix))}>
          Resume All
        </Button>
        <Button icon={<RotateCcw size={15} />} onClick={() => handleQueueAction((queue) => props.retryFailedJobs(connectionId, queue.name, queue.prefix))}>
          Retry Failed
        </Button>
        <Button icon={<Trash2 size={15} />} onClick={() => handleQueueAction((queue) => props.cleanCompletedJobs(connectionId, queue.name, queue.prefix))}>
          Clean Completed
        </Button>
        <div className="queues-auto-refresh">
          <span>Auto-refresh</span>
          <Switch checked={isAutoRefreshOn} onCheckedChange={setIsAutoRefreshOn} />
        </div>
      </div>

      <div className="queues-summary-grid">
        <Panel className="queues-summary-card"><span>Total Queues</span><strong>{formatCount(queueTotals.total)}</strong></Panel>
        <Panel className="queues-summary-card"><span>Active Jobs</span><strong>{formatCount(queueTotals.active)}</strong></Panel>
        <Panel className="queues-summary-card"><span>Waiting</span><strong>{formatCount(queueTotals.waiting)}</strong></Panel>
        <Panel className="queues-summary-card"><span>Delayed</span><strong>{formatCount(queueTotals.delayed)}</strong></Panel>
        <Panel className="queues-summary-card"><span>Completed</span><strong>{formatCount(queueTotals.completed)}</strong></Panel>
        <Panel className="queues-summary-card queues-summary-danger"><span>Failed</span><strong>{formatCount(queueTotals.failed)}</strong></Panel>
      </div>

      <div className="queues-top-grid">
        <Panel className="queues-throughput-panel">
          <div className="panel-header">
            <h2>Queue Throughput</h2>
            <Button icon={<RefreshCw size={14} />} onClick={props.refreshAll}>Refresh</Button>
          </div>
          <div className="chart-surface">
            <ReactECharts option={throughputChartOption} notMerge style={{ width: "100%", height: "100%" }} />
          </div>
        </Panel>
        <Panel className="queues-health-panel">
          <div className="panel-header"><h2>Queue Health</h2></div>
          <div className="queue-health-rows">
            <div><span>Healthy</span><strong>{props.queues.filter((queue) => queue.failed === 0).length}</strong></div>
            <div><span>Warning</span><strong>{props.queues.filter((queue) => queue.failed > 0 || queue.delayed > 0).length}</strong></div>
            <div><span>Paused</span><strong>{props.queues.filter((queue) => queue.paused).length}</strong></div>
          </div>
        </Panel>
      </div>

      <div className="queues-main-grid">
        <Panel className="queues-list-panel">
          <div className="panel-header">
            <h2>Queues</h2>
          </div>
          <CommandInput icon={<Search size={14} />} placeholder="Filter queues..." value={queueSearch} onChange={(event) => setQueueSearch(event.target.value)} />
          <div className="queues-list">
            {visibleQueues.map((queue) => (
              <button
                key={`${queue.prefix}:${queue.name}`}
                type="button"
                className={props.selectedQueue === queue.name ? "queue-row active" : "queue-row"}
                onClick={() => {
                  handleQueueSelection(queue).catch(console.error);
                }}
              >
                <span>
                  <strong>{queue.name}</strong>
                  <small>{queue.waiting} waiting</small>
                </span>
                <em>{queue.active} active</em>
                <StatusDot label="" tone={queue.paused ? "warning" : "success"} />
              </button>
            ))}
          </div>
          <div className="panel-footer">{visibleQueues.length} queues</div>
        </Panel>

        <div className="queues-center-column">
          <Panel className="queues-selected-panel">
            <div className="panel-header">
              <h2>{selectedQueueData?.name ?? "Select Queue"}</h2>
              {selectedQueueData ? <Badge tone={selectedQueueData.paused ? "warning" : "success"}>{selectedQueueData.paused ? "Paused" : "Active"}</Badge> : null}
            </div>
            {selectedQueueData ? (
              <div className="queues-selected-metrics">
                <div><span>Waiting</span><strong>{formatCount(selectedQueueData.waiting)}</strong></div>
                <div><span>Active</span><strong>{formatCount(selectedQueueData.active)}</strong></div>
                <div><span>Delayed</span><strong>{formatCount(selectedQueueData.delayed)}</strong></div>
                <div><span>Completed</span><strong>{formatCount(selectedQueueData.completed)}</strong></div>
                <div><span>Failed</span><strong>{formatCount(selectedQueueData.failed)}</strong></div>
              </div>
            ) : (
              <div className="panel-footer">No queue found.</div>
            )}
          </Panel>

          <Panel className="queues-jobs-table-panel">
            <div className="panel-header">
              <h2>Jobs</h2>
              <CommandInput icon={<Search size={14} />} placeholder="Search jobs..." value={jobSearch} onChange={(event) => { setJobSearch(event.target.value); setPage(1); }} />
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as JobStatusFilter); setPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Attempts</th>
                  <th>Progress</th>
                  <th>Duration</th>
                  <th>Created</th>
                  <th>Finished</th>
                </tr>
              </thead>
              <tbody>
                {pagedJobs.map((job) => (
                  <tr
                    key={job.id}
                    className={props.selectedJobId === job.id ? "queue-job-selected-row" : ""}
                    onClick={() => props.setSelectedJobId(job.id)}
                  >
                    <td>{job.id}</td>
                    <td>{job.name}</td>
                    <td><Badge tone={toneFromJobStatus(job.status)}>{job.status}</Badge></td>
                    <td>{job.attemptsMade}/{job.attemptsLimit ?? "-"}</td>
                    <td>{job.progress ?? "-"}</td>
                    <td>{job.durationMs ? `${job.durationMs} ms` : "-"}</td>
                    <td>{formatWhen(job.createdAt)}</td>
                    <td>{formatWhen(job.finishedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="panel-footer">
              <span>{filteredJobs.length} jobs</span>
              <div className="queues-pagination">
                <Select value={String(rowsPerPage)} onValueChange={(value) => { setRowsPerPage(Number(value)); setPage(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <Button disabled={currentPage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Prev</Button>
                <span>{currentPage}/{pageCount}</span>
                <Button disabled={currentPage >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</Button>
              </div>
            </div>
          </Panel>
        </div>

        <Panel className="queues-job-details-panel">
          <div className="panel-header">
            <h2>Job {selectedJob?.id ?? "-"}</h2>
            {selectedJob ? <Badge tone={toneFromJobStatus(selectedJob.status)}>{selectedJob.status}</Badge> : null}
          </div>
          <div className="queues-job-actions">
            <Button
              icon={<RotateCcw size={14} />}
              disabled={!selectedJob || !selectedQueueData}
              onClick={async () => {
                if (!selectedJob || !selectedQueueData) return;
                await props.retryJob(connectionId, selectedQueueData.name, selectedQueueData.prefix, selectedJob.id);
                await props.refreshAll();
              }}
            >
              Retry
            </Button>
            <Button
              icon={<Play size={14} />}
              disabled={!selectedJob || !selectedQueueData}
              onClick={async () => {
                if (!selectedJob || !selectedQueueData) return;
                await props.promoteJob(connectionId, selectedQueueData.name, selectedQueueData.prefix, selectedJob.id);
                await props.refreshAll();
              }}
            >
              Promote
            </Button>
            <Button
              icon={<Trash2 size={14} />}
              disabled={!selectedJob || !selectedQueueData}
              onClick={async () => {
                if (!selectedJob || !selectedQueueData) return;
                await props.removeJob(connectionId, selectedQueueData.name, selectedQueueData.prefix, selectedJob.id);
                await props.refreshAll();
              }}
            >
              Remove
            </Button>
          </div>
          <div className="queues-job-details-meta">
            <div><span>Attempts</span><strong>{selectedJob ? `${selectedJob.attemptsMade}/${selectedJob.attemptsLimit ?? "-"}` : "-"}</strong></div>
            <div><span>Worker</span><strong>{selectedJob?.processedBy ?? "-"}</strong></div>
            <div><span>Failed Reason</span><strong>{selectedJob?.failedReason ?? "-"}</strong></div>
            <div><span>Logs</span><strong>{selectedJob?.logsCount ?? 0}</strong></div>
          </div>
          <div className="type-tabs">
            <button className={payloadMode === "raw" ? "active" : ""} type="button" onClick={() => setPayloadMode("raw")}>Raw</button>
            <button className={payloadMode === "json" ? "active" : ""} type="button" onClick={() => setPayloadMode("json")}>JSON</button>
            <Button
              icon={<Copy size={14} />}
              onClick={async () => {
                const content = payloadMode === "json" ? payloadJson : payloadRaw;
                await navigator.clipboard.writeText(content);
              }}
            >
              Copy
            </Button>
          </div>
          <div className="queues-job-payload">
            {payloadMode === "json" ? (
              <Editor
                height="100%"
                defaultLanguage="json"
                language="json"
                theme="vs-dark"
                value={payloadJson}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            ) : (
              <pre>{payloadRaw}</pre>
            )}
          </div>
        </Panel>
      </div>

      <div className="queues-status-strip">
        <Badge tone="warning">Waiting {formatCount(statusCounters.waiting)}</Badge>
        <Badge tone="info">Active {formatCount(statusCounters.active)}</Badge>
        <Badge tone="warning">Delayed {formatCount(statusCounters.delayed)}</Badge>
        <Badge tone="success">Completed {formatCount(statusCounters.completed)}</Badge>
        <Badge tone="danger">Failed {formatCount(statusCounters.failed)}</Badge>
        {selectedJob?.failedReason ? <span className="queues-failed-reason"><AlertCircle size={14} /> {selectedJob.failedReason}</span> : null}
      </div>
    </section>
  );
}
