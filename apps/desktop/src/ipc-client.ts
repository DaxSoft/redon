import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { IpcCommandDefinition } from "@redon/ipc-contracts";

interface IpcResponseEnvelope {
  readonly success: boolean;
  readonly data?: unknown;
  readonly error?: string;
}

async function invokeViaSidecarHttp(command: string, payload: unknown): Promise<IpcResponseEnvelope> {
  const urls = [`http://127.0.0.1:1421/ipc/${command}`, `http://localhost:1421/ipc/${command}`];
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const json: unknown = await response.json();
      if (typeof json !== "object" || json === null) {
        throw new Error("Invalid sidecar response.");
      }

      return json as IpcResponseEnvelope;
    } catch (error) {
      lastError = error;
    }
  }

  const reason = lastError instanceof Error ? lastError.message : "Unknown network error";
  throw new Error(`Sidecar unavailable on port 1421. Start @redon/sidecar dev server. Details: ${reason}`);
}

export async function invokeIpc<TRequest, TResponse>(
  command: IpcCommandDefinition<TRequest, TResponse>,
  payload: TRequest
): Promise<TResponse> {
  let result: IpcResponseEnvelope;

  try {
    const tauriResult = (await tauriInvoke("invoke_sidecar", {
      command: command.name,
      payload
    })) as unknown;
    if (typeof tauriResult !== "object" || tauriResult === null) {
      throw new Error("Invalid Tauri response.");
    }
    result = tauriResult as IpcResponseEnvelope;
  } catch {
    result = await invokeViaSidecarHttp(command.name, payload);
  }

  if (!result.success) {
    throw new Error(result.error || "Unknown IPC error");
  }

  return command.responseSchema.parse(result.data);
}
