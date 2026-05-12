import ReactECharts from "echarts-for-react";
import { Panel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redon/ui";
import { buildHealthDonutOption, buildThroughputChartOption } from "../utils";
import { QueueMetricMiniChart } from "./QueueMetricMiniChart";

interface QueuesTopPanelsProps {
  readonly telemetry: Array<{ timestampIso: string; opsPerSecond: number | null }>;
  readonly selectedTimeRange: string;
  readonly onSelectTimeRange: (value: string) => void;
  readonly queueTotalsTotal: number;
  readonly queueHealthCounts: { healthy: number; warning: number; paused: number; failing: number };
  readonly healthTotal: number;
  readonly nowLabel: string;
  readonly throughputPerMinute: number;
  readonly workersOnline: number;
  readonly queueMetricsTelemetry: number[];
}

export function QueuesTopPanels(props: QueuesTopPanelsProps) {
  const failureChartData = props.queueMetricsTelemetry.map((value, index) => (index % 7 === 0 ? value * 0.2 : value * 0.06));
  const retryChartData = props.queueMetricsTelemetry.map((value, index) => (index % 4 === 0 ? value * 0.1 : value * 0.03));
  const latencyChartData = props.queueMetricsTelemetry.map((value, index) => (index % 5 === 0 ? value * 0.15 : value * 0.05));
  const workerChartData = props.queueMetricsTelemetry.map((_, index) => (index % 3 === 0 ? props.workersOnline : Math.max(1, props.workersOnline - 1)));
  const failureRate = ((props.queueHealthCounts.failing / Math.max(1, props.queueTotalsTotal)) * 100).toFixed(2);
  const retryRate = ((props.queueHealthCounts.warning / Math.max(1, props.queueTotalsTotal)) * 100).toFixed(2);
  const avgLatency = Math.round((props.queueMetricsTelemetry.reduce((sum, value) => sum + value, 0) / Math.max(1, props.queueMetricsTelemetry.length)) * 6);

  return (
    <div className="queues-v2-top-grid">
      <Panel className="queues-v2-throughput-panel">
        <div className="panel-header queues-v2-panel-header">
          <h2>Queue Throughput (jobs per minute)</h2>
          <div className="range-tabs">
            {["1m", "5m", "15m", "1h", "6h", "24h"].map((range) => (
              <button key={range} type="button" className={props.selectedTimeRange === range ? "active" : ""} onClick={() => props.onSelectTimeRange(range)}>
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-surface queues-v2-chart">
          <ReactECharts option={buildThroughputChartOption(props.telemetry)} notMerge style={{ width: "100%", height: "100%" }} />
        </div>
      </Panel>

      <Panel className="queues-v2-health-panel">
        <div className="panel-header">
          <h2>Queue Health</h2>
        </div>
        <div className="queues-v2-health-content">
          <div className="queues-v2-donut-wrap">
            <ReactECharts option={buildHealthDonutOption(props.queueHealthCounts)} notMerge style={{ width: "100%", height: "100%" }} />
          </div>
          <div className="queues-v2-health-rows">
            <div><span>Healthy</span><strong>{props.queueHealthCounts.healthy} ({Math.round((props.queueHealthCounts.healthy / props.healthTotal) * 100)}%)</strong></div>
            <div><span>Warning</span><strong>{props.queueHealthCounts.warning} ({Math.round((props.queueHealthCounts.warning / props.healthTotal) * 100)}%)</strong></div>
            <div><span>Paused</span><strong>{props.queueHealthCounts.paused} ({Math.round((props.queueHealthCounts.paused / props.healthTotal) * 100)}%)</strong></div>
            <div><span>Failing</span><strong>{props.queueHealthCounts.failing} ({Math.round((props.queueHealthCounts.failing / props.healthTotal) * 100)}%)</strong></div>
          </div>
        </div>
        <div className="panel-footer">
          <span>Total {props.queueTotalsTotal} queues</span>
          <span>Updated {props.nowLabel}</span>
        </div>
      </Panel>

      <Panel className="queues-v2-side-metrics-panel">
        <div className="panel-header">
          <h2>Queue Metrics</h2>
          <Select value={props.selectedTimeRange} onValueChange={props.onSelectTimeRange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1m</SelectItem>
              <SelectItem value="5m">5m</SelectItem>
              <SelectItem value="15m">15m</SelectItem>
              <SelectItem value="1h">1h</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="queues-v2-side-metric-row">
          <span>Throughput</span>
          <strong>{props.throughputPerMinute} jobs/min</strong>
          <QueueMetricMiniChart data={props.queueMetricsTelemetry} tone="success" />
        </div>
        <div className="queues-v2-side-metric-row">
          <span>Failure Rate</span>
          <strong>{failureRate}%</strong>
          <QueueMetricMiniChart data={failureChartData} tone="danger" />
        </div>
        <div className="queues-v2-side-metric-row">
          <span>Retry Rate</span>
          <strong>{retryRate}%</strong>
          <QueueMetricMiniChart data={retryChartData} tone="warning" />
        </div>
        <div className="queues-v2-side-metric-row">
          <span>Avg Latency</span>
          <strong>{avgLatency} ms</strong>
          <QueueMetricMiniChart data={latencyChartData} tone="warning" />
        </div>
        <div className="queues-v2-side-metric-row">
          <span>Active Workers</span>
          <strong>{props.workersOnline}</strong>
          <QueueMetricMiniChart data={workerChartData} tone="success" />
        </div>
        <div className="panel-footer">
          <span>Last Processed</span>
          <strong>{props.nowLabel}</strong>
        </div>
      </Panel>
    </div>
  );
}
