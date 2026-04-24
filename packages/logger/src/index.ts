export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Record<string, string | number | boolean | null>;
}

export interface RedonLogger {
  readonly log: (entry: LogEntry) => void;
}

export const noopLogger: RedonLogger = {
  log: () => undefined
};
