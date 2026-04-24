export type RedonErrorSeverity = "info" | "warning" | "error" | "critical";

export interface RedonErrorEnvelope {
  readonly code: string;
  readonly message: string;
  readonly severity: RedonErrorSeverity;
  readonly retryable: boolean;
}

export function createRedonError(error: RedonErrorEnvelope): RedonErrorEnvelope {
  return error;
}
