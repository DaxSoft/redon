import { invoke } from "@tauri-apps/api/core";
import { IpcCommandDefinition } from "@redon/ipc-contracts";

export async function invokeIpc<TRequest, TResponse>(
  command: IpcCommandDefinition<TRequest, TResponse>,
  payload: TRequest
): Promise<TResponse> {
  const result = await invoke<any>("invoke_sidecar", {
    command: command.name,
    payload
  });

  if (!result.success) {
    throw new Error(result.error || "Unknown IPC error");
  }

  return command.responseSchema.parse(result.data);
}
