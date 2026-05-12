import Editor from "@monaco-editor/react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Copy,
  MoreHorizontal,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import type { BullQueueJob, BullQueueSummary } from "@redon/ipc-contracts";
import {
  Badge,
  Button,
  CommandInput,
  Panel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sparkline,
  StatusDot,
} from "@redon/ui";
import { BullQueueStatCards } from "../../../components/BullQueueStatCards";
import type { JobStatusFilter, QueueTotals } from "../types";
import {
  formatCount,
  formatWhen,
  safeProgress,
  toneFromJobStatus,
} from "../utils";

interface QueuesBottomPanelsProps {
  readonly queues: BullQueueSummary[];
  readonly selectedQueue: string | null;
  readonly selectedQueueData: BullQueueSummary | null;
  readonly queueSearch: string;
  readonly onQueueSearchChange: (value: string) => void;
  readonly visibleQueues: BullQueueSummary[];
  readonly onSelectQueue: (queue: BullQueueSummary) => void;
  readonly onRefreshAll: () => Promise<void>;
  readonly queueMetricsTelemetry: number[];
  readonly queueTotals: QueueTotals;
  readonly jobs: BullQueueJob[];
  readonly selectedJobId: string | null;
  readonly onSelectJobId: (id: string) => void;
  readonly filteredJobs: BullQueueJob[];
  readonly pagedJobs: BullQueueJob[];
  readonly jobSearch: string;
  readonly onJobSearchChange: (value: string) => void;
  readonly statusFilter: JobStatusFilter;
  readonly onStatusFilterChange: (value: JobStatusFilter) => void;
  readonly workerFilter: string;
  readonly onWorkerFilterChange: (value: string) => void;
  readonly workers: string[];
  readonly currentPage: number;
  readonly pageCount: number;
  readonly rowsPerPage: number;
  readonly onRowsPerPageChange: (value: number) => void;
  readonly onPrevPage: () => void;
  readonly onNextPage: () => void;
  readonly selectedJob: BullQueueJob | null;
  readonly payloadMode: "raw" | "json";
  readonly onSetPayloadMode: (value: "raw" | "json") => void;
  readonly payloadRaw: string;
  readonly payloadJson: string;
  readonly onCopyPayload: () => void;
  readonly onRetrySelectedJob: () => Promise<void>;
  readonly onPromoteSelectedJob: () => Promise<void>;
  readonly onRemoveSelectedJob: () => Promise<void>;
}

export function QueuesBottomPanels(props: QueuesBottomPanelsProps) {
  return (
    <>
      <div className="queues-v2-bottom-grid">
        <Panel className="queues-v2-queue-list-panel">
          <CommandInput
            icon={<Search size={14} />}
            placeholder="Filter queues..."
            value={props.queueSearch}
            onChange={(event) => props.onQueueSearchChange(event.target.value)}
          />
          <div className="queues-v2-list">
            {props.visibleQueues.map((queue) => (
              <button
                key={`${queue.prefix}:${queue.name}`}
                type="button"
                className={
                  props.selectedQueue === queue.name
                    ? "queues-v2-list-item active"
                    : "queues-v2-list-item"
                }
                onClick={() => props.onSelectQueue(queue)}
              >
                <div>
                  <strong>{queue.name}</strong>
                  <small>
                    {formatCount(queue.waiting)} waiting &nbsp;{" "}
                    {formatCount(queue.active)} active
                  </small>
                </div>
                <Sparkline
                  compact
                  data={props.queueMetricsTelemetry}
                  danger={queue.failed > 0}
                />
                <StatusDot
                  label=""
                  tone={queue.failed > 0 ? "warning" : "success"}
                />
              </button>
            ))}
          </div>
          <div className="panel-footer">
            <span>{props.visibleQueues.length} queues</span>
            <RefreshCw
              size={13}
              style={{ cursor: "pointer" }}
              onClick={() => props.onRefreshAll().catch(() => undefined)}
            />
          </div>
        </Panel>

        <div className="queues-v2-center-column">
          <Panel className="queues-v2-selected-queue-panel">
            <div className="panel-header">
              <h2>{props.selectedQueueData?.name ?? "Select queue"}</h2>
              <div style={{ display: "inline-flex", gap: 6 }}>
                {props.selectedQueueData ? (
                  <Badge
                    tone={
                      props.selectedQueueData.paused ? "warning" : "success"
                    }
                  >
                    {props.selectedQueueData.paused ? "Paused" : "Active"}
                  </Badge>
                ) : null}
                <Badge tone="info">BullMQ</Badge>
              </div>
            </div>
            <p className="queues-v2-selected-queue-description">
              Queue for processing and sending transactional and background jobs
            </p>
            <BullQueueStatCards
              waiting={props.selectedQueueData?.waiting ?? 0}
              active={props.selectedQueueData?.active ?? 0}
              delayed={props.selectedQueueData?.delayed ?? 0}
              completed={props.selectedQueueData?.completed ?? 0}
              failed={props.selectedQueueData?.failed ?? 0}
              compact
            />
          </Panel>

          <Panel className="queues-v2-jobs-table-panel">
            <div className="queues-v2-jobs-top-tabs">
              <button type="button" className="active">
                All Jobs
              </button>
              <button type="button">
                Waiting ({props.queueTotals.waiting})
              </button>
              <button type="button">Active ({props.queueTotals.active})</button>
              <button type="button">
                Delayed ({props.queueTotals.delayed})
              </button>
              <button type="button">Completed</button>
              <button type="button">Failed</button>
            </div>
            <div className="panel-header queues-v2-jobs-filters">
              <CommandInput
                icon={<Search size={14} />}
                placeholder="Search jobs..."
                value={props.jobSearch}
                onChange={(event) =>
                  props.onJobSearchChange(event.target.value)
                }
              />
              <Select
                value={props.statusFilter}
                onValueChange={(value) =>
                  props.onStatusFilterChange(value as JobStatusFilter)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status: All</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={props.workerFilter}
                onValueChange={props.onWorkerFilterChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Worker: All</SelectItem>
                  {props.workers.map((worker) => (
                    <SelectItem key={worker} value={worker}>
                      {worker}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button icon={<Columns3 size={14} />}>Columns</Button>
              <Button
                icon={<MoreHorizontal size={14} />}
                ariaLabel="Table actions"
              />
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
                  <th>Created At</th>
                  <th>Finished At</th>
                  <th>Worker</th>
                </tr>
              </thead>
              <tbody>
                {props.pagedJobs.map((job) => (
                  <tr
                    key={job.id}
                    className={
                      props.selectedJobId === job.id
                        ? "queue-job-selected-row"
                        : ""
                    }
                    onClick={() => props.onSelectJobId(job.id)}
                  >
                    <td>{job.id}</td>
                    <td>{job.name}</td>
                    <td>
                      <Badge tone={toneFromJobStatus(job.status)}>
                        {job.status}
                      </Badge>
                    </td>
                    <td>
                      {job.attemptsMade}/{job.attemptsLimit ?? "-"}
                    </td>
                    <td>
                      <div className="queues-v2-progress-cell">
                        <span>{safeProgress(job.progress)}%</span>
                        <div>
                          <i
                            style={{ width: `${safeProgress(job.progress)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>{job.durationMs ? `${job.durationMs} ms` : "-"}</td>
                    <td>{formatWhen(job.createdAt)}</td>
                    <td>{formatWhen(job.finishedAt)}</td>
                    <td>{job.processedBy ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="panel-footer">
              <div className="queues-v2-pagination">
                <span>Rows per page:</span>
                <Select
                  value={String(props.rowsPerPage)}
                  onValueChange={(value) =>
                    props.onRowsPerPageChange(Number(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="queues-v2-pagination">
                <span>
                  {(props.currentPage - 1) * props.rowsPerPage + 1}-
                  {Math.min(
                    props.currentPage * props.rowsPerPage,
                    props.filteredJobs.length,
                  )}{" "}
                  of {props.filteredJobs.length}
                </span>
                <Button
                  disabled={props.currentPage <= 1}
                  ariaLabel="Previous page"
                  icon={<ChevronLeft size={14} />}
                  onClick={props.onPrevPage}
                />
                <Badge tone="info">{props.currentPage}</Badge>
                <Button
                  disabled={props.currentPage >= props.pageCount}
                  ariaLabel="Next page"
                  icon={<ChevronRight size={14} />}
                  onClick={props.onNextPage}
                />
              </div>
            </div>
          </Panel>
        </div>

        <Panel className="queues-v2-job-inspector">
          <div className="panel-header">
            <h2>Job: {props.selectedJob?.id ?? "-"}</h2>
            {props.selectedJob ? (
              <Badge tone={toneFromJobStatus(props.selectedJob.status)}>
                {props.selectedJob.status}
              </Badge>
            ) : null}
          </div>
          <div className="queues-v2-job-inspector-actions">
            <Button
              className="queues-v2-action-btn"
              icon={<RotateCcw size={12} />}
              disabled={!props.selectedJob || !props.selectedQueueData}
              onClick={props.onRetrySelectedJob}
            ></Button>
            <Button
              className="queues-v2-action-btn"
              icon={<Play size={12} />}
              disabled={!props.selectedJob || !props.selectedQueueData}
              onClick={props.onPromoteSelectedJob}
            ></Button>
            <Button
              className="queues-v2-action-btn"
              icon={<Trash2 size={12} />}
              disabled={!props.selectedJob || !props.selectedQueueData}
              onClick={props.onRemoveSelectedJob}
            ></Button>
          </div>
          <div className="queues-v2-job-inspector-tabs">
            <button type="button" className="active">
              Details
            </button>
          </div>
          <div className="queues-v2-payload-header">
            <span>Job Payload</span>
            <Button icon={<Copy size={14} />} onClick={props.onCopyPayload}>
              Copy
            </Button>
          </div>
          <div className="queues-v2-job-payload">
            {props.payloadMode === "json" ? (
              <Editor
                height="100%"
                defaultLanguage="json"
                language="json"
                theme="vs-dark"
                value={props.payloadJson}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            ) : (
              <pre>{props.payloadRaw}</pre>
            )}
          </div>
          <div className="queues-v2-job-details-list">
            <div>
              <span>Attempts</span>
              <strong>
                {props.selectedJob
                  ? `${props.selectedJob.attemptsMade}/${props.selectedJob.attemptsLimit ?? "-"}`
                  : "-"}
              </strong>
            </div>
            <div>
              <span>Worker</span>
              <strong>{props.selectedJob?.processedBy ?? "-"}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>
                {props.selectedJob?.durationMs
                  ? `${props.selectedJob.durationMs} ms`
                  : "-"}
              </strong>
            </div>
            <div>
              <span>Failed Reason</span>
              <strong>{props.selectedJob?.failedReason ?? "-"}</strong>
            </div>
          </div>
        </Panel>
      </div>

      <div className="queues-status-strip">
        <Badge tone="warning">
          Waiting {formatCount(props.queueTotals.waiting)}
        </Badge>
        <Badge tone="info">
          Active {formatCount(props.queueTotals.active)}
        </Badge>
        <Badge tone="warning">
          Delayed {formatCount(props.queueTotals.delayed)}
        </Badge>
        <Badge tone="success">
          Completed {formatCount(props.queueTotals.completed)}
        </Badge>
        <Badge tone="danger">
          Failed {formatCount(props.queueTotals.failed)}
        </Badge>
        {props.selectedJob?.failedReason ? (
          <span className="queues-failed-reason">
            <AlertCircle size={14} /> {props.selectedJob.failedReason}
          </span>
        ) : null}
        <div className="type-tabs" style={{ marginLeft: "auto" }}>
          <button
            type="button"
            className={props.payloadMode === "raw" ? "active" : ""}
            onClick={() => props.onSetPayloadMode("raw")}
          >
            Raw
          </button>
          <button
            type="button"
            className={props.payloadMode === "json" ? "active" : ""}
            onClick={() => props.onSetPayloadMode("json")}
          >
            JSON
          </button>
        </div>
      </div>
    </>
  );
}
