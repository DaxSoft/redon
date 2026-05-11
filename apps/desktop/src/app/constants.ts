import { BarChart3, FileCode2, Folder, Grid2X2, KeyRound, Layers3, Link2, ListRestart, Radio, Settings, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavView = "overview" | "connections";
export type RangeKey = "1m" | "5m" | "15m" | "1h" | "6h" | "24h";

export const ACTIVE_CONNECTION_STORAGE_KEY = "redon.activeConnectionId";
export const CONNECTION_PASSWORD_STORAGE_KEY = "redon.connectionPasswords";
export const TIME_RANGES: readonly RangeKey[] = ["1m", "5m", "15m", "1h", "6h", "24h"];
export const RANGE_TO_MINUTES: Record<RangeKey, number> = { "1m": 1, "5m": 5, "15m": 15, "1h": 60, "6h": 360, "24h": 1440 };

export const navItems: ReadonlyArray<{ label: string; view?: NavView; icon: LucideIcon }> = [
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
