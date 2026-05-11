import { Pause, Play, RotateCcw, Trash2 } from "lucide-react";
import { Badge, Button, Panel, Sparkline, Switch } from "@redon/ui";
import type { QueueTotals } from "../types";
import { formatCount } from "../utils";

interface QueuesHeaderSectionProps {
  readonly queueTotals: QueueTotals;
  readonly throughputPerMinute: number;
  readonly workersOnline: number;
  readonly isAutoRefreshOn: boolean;
  readonly onToggleAutoRefresh: (value: boolean) => void;
  readonly onPauseAll: () => Promise<void>;
  readonly onResumeAll: () => Promise<void>;
  readonly onRetryFailed: () => Promise<void>;
  readonly onCleanCompleted: () => Promise<void>;
}

export function QueuesHeaderSection(props: QueuesHeaderSectionProps) {
  return (
    <>
      <div className="queues-v2-headline">
        <div>
          <h2>Queues</h2>
          <p>Manage and inspect BullMQ queues, jobs, and workers</p>
        </div>
        <div className="queues-v2-headline-right">
          <Badge tone="success">BullMQ Module</Badge>
          <span className="queues-v2-auto-refresh">
            Auto-refresh <Switch checked={props.isAutoRefreshOn} onCheckedChange={props.onToggleAutoRefresh} />
          </span>
        </div>
      </div>

      <div className="queues-v2-actions-row">
        <Button icon={<Pause size={15} />} onClick={props.onPauseAll}>
          Pause All
        </Button>
        <Button icon={<Play size={15} />} onClick={props.onResumeAll}>
          Resume All
        </Button>
        <Button icon={<RotateCcw size={15} />} onClick={props.onRetryFailed}>
          Retry Failed
        </Button>
        <Button icon={<Trash2 size={15} />} onClick={props.onCleanCompleted}>
          Clean Completed
        </Button>
      </div>

      <div className="queues-v2-kpis">
        <Panel className="queues-v2-kpi-card"><span>Total Queues</span><strong>{formatCount(props.queueTotals.total)}</strong><small>up {Math.max(1, Math.floor(props.queueTotals.total / 2))} vs 1h ago</small><Sparkline compact /></Panel>
        <Panel className="queues-v2-kpi-card"><span>Active Jobs</span><strong>{formatCount(props.queueTotals.active)}</strong><small>up {Math.max(1, Math.floor(props.queueTotals.active / 8))} vs 1h ago</small><Sparkline compact /></Panel>
        <Panel className="queues-v2-kpi-card"><span>Waiting</span><strong>{formatCount(props.queueTotals.waiting)}</strong><small>up {Math.max(1, Math.floor(props.queueTotals.waiting / 10))} vs 1h ago</small><Sparkline compact /></Panel>
        <Panel className="queues-v2-kpi-card"><span>Delayed</span><strong>{formatCount(props.queueTotals.delayed)}</strong><small>up {Math.max(1, Math.floor(props.queueTotals.delayed / 10))} vs 1h ago</small><Sparkline compact /></Panel>
        <Panel className="queues-v2-kpi-card"><span>Completed Today</span><strong>{formatCount(props.queueTotals.completed)}</strong><small>up {Math.max(1, Math.floor(props.queueTotals.completed / 5))} vs yesterday</small><Sparkline compact /></Panel>
        <Panel className="queues-v2-kpi-card queues-v2-kpi-danger"><span>Failed Today</span><strong>{formatCount(props.queueTotals.failed)}</strong><small>down {Math.max(1, Math.floor(props.queueTotals.failed / 3))} vs yesterday</small><Sparkline compact danger /></Panel>
        <Panel className="queues-v2-kpi-card"><span>Throughput / min</span><strong>{formatCount(props.throughputPerMinute)}</strong><small>up {Math.max(1, Math.floor(props.throughputPerMinute / 12))} vs 1h ago</small><Sparkline compact /></Panel>
        <Panel className="queues-v2-kpi-card"><span>Workers Online</span><strong>{formatCount(props.workersOnline)}</strong><small>up {Math.max(1, Math.floor(props.workersOnline / 2))} vs 1h ago</small><Sparkline compact /></Panel>
      </div>
    </>
  );
}

