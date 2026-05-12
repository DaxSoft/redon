import { useEffect, useMemo, useState } from "react";
import type { BullQueueJob, BullQueueSummary } from "@redon/ipc-contracts";
import { Panel, Button } from "@redon/ui";
import { QueuesHeaderSection } from "./queues/components/QueuesHeaderSection";
import { QueuesTopPanels } from "./queues/components/QueuesTopPanels";
import { QueuesBottomPanels } from "./queues/components/QueuesBottomPanels";
import type { JobStatusFilter, PayloadMode, QueuesViewProps } from "./queues/types";

export function QueuesView(props: QueuesViewProps) {
  const [queueSearch, setQueueSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatusFilter>("all");
  const [workerFilter, setWorkerFilter] = useState<string>("all");
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [payloadMode, setPayloadMode] = useState<PayloadMode>("json");
  const [isAutoRefreshOn, setIsAutoRefreshOn] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState("5m");
  const [pinnedQueueName, setPinnedQueueName] = useState<string | null>(null);
  const connectionId = props.activeProfileId ?? "";

  const effectiveSelectedQueue = props.selectedQueue ?? pinnedQueueName;

  useEffect(() => {
    if (!props.activeProfileId || !isAutoRefreshOn) return;
    const timer = window.setInterval(() => {
      props.refreshAll().catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [props.activeProfileId, isAutoRefreshOn, props.refreshAll]);

  const queueTotals = useMemo(
    () =>
      props.queues.reduce(
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
      ),
    [props.queues]
  );

  const selectedQueueData = props.queues.find((queue) => queue.name === effectiveSelectedQueue) ?? props.queues[0] ?? null;
  const workers = useMemo(
    () =>
      Array.from(
        new Set(
          props.jobs
            .map((job) => (typeof job.processedBy === "string" && job.processedBy.trim().length > 0 ? job.processedBy : null))
            .filter((value): value is string => value !== null)
        )
      ).sort((left, right) => left.localeCompare(right)),
    [props.jobs]
  );

  const normalizedQueueSearch = queueSearch.trim().toLowerCase();
  const visibleQueues =
    normalizedQueueSearch.length === 0 ? props.queues : props.queues.filter((queue) => queue.name.toLowerCase().includes(normalizedQueueSearch));

  const filteredJobs = useMemo(() => {
    const normalizedJobSearch = jobSearch.trim().toLowerCase();
    return props.jobs.filter((job) => {
      if (statusFilter !== "all" && job.status !== statusFilter) return false;
      if (workerFilter !== "all" && (job.processedBy ?? "-") !== workerFilter) return false;
      if (normalizedJobSearch.length === 0) return true;
      return job.id.toLowerCase().includes(normalizedJobSearch) || job.name.toLowerCase().includes(normalizedJobSearch);
    });
  }, [props.jobs, jobSearch, statusFilter, workerFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / rowsPerPage));
  const currentPage = Math.min(page, pageCount);
  const pagedJobs = filteredJobs.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const selectedJob = props.jobs.find((job) => job.id === props.selectedJobId) ?? pagedJobs[0] ?? null;

  useEffect(() => {
    if (selectedJob && props.selectedJobId !== selectedJob.id) {
      props.setSelectedJobId(selectedJob.id);
    }
  }, [selectedJob, props.selectedJobId, props.setSelectedJobId]);

  const throughputPerMinute = Math.round((props.telemetry.at(-1)?.opsPerSecond ?? 0) * 60);
  const workersOnline = workers.length;
  const queueHealthCounts = {
    healthy: props.queues.filter((queue) => !queue.paused && queue.failed === 0).length,
    warning: props.queues.filter((queue) => !queue.paused && queue.failed > 0).length,
    paused: props.queues.filter((queue) => queue.paused).length,
    failing: props.queues.filter((queue) => queue.failed > 50).length,
  };
  const healthTotal = Math.max(1, queueHealthCounts.healthy + queueHealthCounts.warning + queueHealthCounts.paused + queueHealthCounts.failing);

  const handleQueueAction = async (action: (queue: BullQueueSummary) => Promise<void>) => {
    if (props.queues.length === 0) return;
    await Promise.all(props.queues.map((queue) => action(queue)));
    await props.refreshAll();
  };

  const handleQueueSelection = async (queue: BullQueueSummary) => {
    setPinnedQueueName(queue.name);
    props.setSelectedQueue(queue.name);
    await props.fetchJobs(connectionId, queue.name, queue.prefix);
  };

  useEffect(() => {
    if (!pinnedQueueName) return;
    if (props.selectedQueue === pinnedQueueName) return;
    if (!props.queues.some((queue) => queue.name === pinnedQueueName)) return;
    props.setSelectedQueue(pinnedQueueName);
  }, [pinnedQueueName, props.selectedQueue, props.queues, props.setSelectedQueue]);

  const queueMetricsTelemetry = props.telemetry.slice(-32).map((point) => point.opsPerSecond ?? 0);
  const payloadRaw = selectedJob ? JSON.stringify(selectedJob.data ?? {}, null, 2) : "{}";
  const payloadJson = payloadRaw;
  const nowLabel = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const retrySelectedJob = async () => {
    if (!selectedJob || !selectedQueueData) return;
    await props.retryJob(connectionId, selectedQueueData.name, selectedQueueData.prefix, selectedJob.id);
    await props.refreshAll();
  };

  const promoteSelectedJob = async () => {
    if (!selectedJob || !selectedQueueData) return;
    await props.promoteJob(connectionId, selectedQueueData.name, selectedQueueData.prefix, selectedJob.id);
    await props.refreshAll();
  };

  const removeSelectedJob = async () => {
    if (!selectedJob || !selectedQueueData) return;
    await props.removeJob(connectionId, selectedQueueData.name, selectedQueueData.prefix, selectedJob.id);
    await props.refreshAll();
  };

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
    <section className="workspace queues-v2-workspace">
      <QueuesHeaderSection
        queueTotals={queueTotals}
        throughputPerMinute={throughputPerMinute}
        workersOnline={workersOnline}
        isAutoRefreshOn={isAutoRefreshOn}
        onToggleAutoRefresh={setIsAutoRefreshOn}
        onPauseAll={() => handleQueueAction((queue) => props.pauseQueue(connectionId, queue.name, queue.prefix))}
        onResumeAll={() => handleQueueAction((queue) => props.resumeQueue(connectionId, queue.name, queue.prefix))}
        onRetryFailed={() => handleQueueAction((queue) => props.retryFailedJobs(connectionId, queue.name, queue.prefix))}
        onCleanCompleted={() => handleQueueAction((queue) => props.cleanCompletedJobs(connectionId, queue.name, queue.prefix))}
      />

      <QueuesTopPanels
        telemetry={props.telemetry}
        selectedTimeRange={selectedTimeRange}
        onSelectTimeRange={setSelectedTimeRange}
        queueTotalsTotal={queueTotals.total}
        queueHealthCounts={queueHealthCounts}
        healthTotal={healthTotal}
        nowLabel={nowLabel}
        throughputPerMinute={throughputPerMinute}
        workersOnline={workersOnline}
        queueMetricsTelemetry={queueMetricsTelemetry}
      />

      <QueuesBottomPanels
        queues={props.queues}
        selectedQueue={props.selectedQueue}
        selectedQueueData={selectedQueueData}
        queueSearch={queueSearch}
        onQueueSearchChange={setQueueSearch}
        visibleQueues={visibleQueues}
        onSelectQueue={(queue) => {
          handleQueueSelection(queue).catch(() => undefined);
        }}
        onRefreshAll={props.refreshAll}
        queueMetricsTelemetry={queueMetricsTelemetry}
        queueTotals={queueTotals}
        jobs={props.jobs}
        selectedJobId={props.selectedJobId}
        onSelectJobId={props.setSelectedJobId}
        filteredJobs={filteredJobs}
        pagedJobs={pagedJobs}
        jobSearch={jobSearch}
        onJobSearchChange={(value) => {
          setJobSearch(value);
          setPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          setPage(1);
        }}
        workerFilter={workerFilter}
        onWorkerFilterChange={(value) => {
          setWorkerFilter(value);
          setPage(1);
        }}
        workers={workers}
        currentPage={currentPage}
        pageCount={pageCount}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value);
          setPage(1);
        }}
        onPrevPage={() => setPage((value) => Math.max(1, value - 1))}
        onNextPage={() => setPage((value) => Math.min(pageCount, value + 1))}
        selectedJob={selectedJob}
        payloadMode={payloadMode}
        onSetPayloadMode={setPayloadMode}
        payloadRaw={payloadRaw}
        payloadJson={payloadJson}
        onCopyPayload={() => navigator.clipboard.writeText(payloadMode === "json" ? payloadJson : payloadRaw)}
        onRetrySelectedJob={retrySelectedJob}
        onPromoteSelectedJob={promoteSelectedJob}
        onRemoveSelectedJob={removeSelectedJob}
      />
    </section>
  );
}
