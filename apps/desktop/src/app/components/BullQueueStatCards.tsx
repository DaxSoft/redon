import { AlertCircle, CheckCircle2, Clock3, PauseCircle, Play } from "lucide-react";

interface BullQueueStatCardsProps {
  readonly waiting: number;
  readonly active: number;
  readonly delayed: number;
  readonly completed: number;
  readonly failed: number;
  readonly compact?: boolean;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function BullQueueStatCards({ waiting, active, delayed, completed, failed, compact = true }: BullQueueStatCardsProps) {
  const metrics = [
    { key: "waiting", label: "Waiting", value: waiting, Icon: PauseCircle, tone: "warning" },
    { key: "active", label: "Active", value: active, Icon: Play, tone: "info" },
    { key: "delayed", label: "Delayed", value: delayed, Icon: Clock3, tone: "warning" },
    { key: "completed", label: "Completed", value: completed, Icon: CheckCircle2, tone: "success" },
    { key: "failed", label: "Failed", value: failed, Icon: AlertCircle, tone: "danger" },
  ] as const;

  return (
    <div className={compact ? "bullmq-stat-cards bullmq-stat-cards-compact" : "bullmq-stat-cards"}>
      {metrics.map(({ key, label, value, Icon, tone }) => (
        <div className={`bullmq-stat-card bullmq-stat-card-${tone}`} key={key}>
          <span>{label}</span>
          <strong>{formatCount(value)}</strong>
          <Icon aria-hidden size={compact ? 14 : 16} />
        </div>
      ))}
    </div>
  );
}

