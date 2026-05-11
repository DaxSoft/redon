import { Plus, RefreshCw } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button, Panel, StatusDot } from "@redon/ui";

interface ConnectionFormState {
  readonly redisUrl: string;
  readonly name: string;
  readonly host: string;
  readonly port: string;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly tlsEnabled: boolean;
  readonly tlsAllowSelfSigned: boolean;
}

interface ConnectionsViewProps {
  readonly connectionForm: ConnectionFormState;
  readonly setConnectionForm: Dispatch<SetStateAction<ConnectionFormState>>;
  readonly connectionStatus: string | null;
  readonly connectionError: string | null;
  readonly isSavingConnection: boolean;
  readonly isTestingConnection: boolean;
  readonly profiles: ReadonlyArray<{ id: string; name: string; host: string; port: number; database: number }>;
  readonly activeProfileId: string | null;
  readonly applyRedisUrl: (url: string) => void;
  readonly handleTestConnection: () => Promise<void>;
  readonly handleCreateConnection: () => Promise<void>;
  readonly onOpenProfile: (id: string) => void;
  readonly onClearError: () => void;
}

export function ConnectionsView({
  connectionForm,
  setConnectionForm,
  connectionStatus,
  connectionError,
  isSavingConnection,
  isTestingConnection,
  profiles,
  activeProfileId,
  applyRedisUrl,
  handleTestConnection,
  handleCreateConnection,
  onOpenProfile,
  onClearError
}: ConnectionsViewProps) {
  return (
    <section className="workspace">
      <div className="connections-layout">
        <Panel className="connection-form-panel">
          <div className="panel-header"><h2>New Connection</h2></div>
          <div className="connection-form-grid">
            <label className="connection-url-field">Redis URL
              <input value={connectionForm.redisUrl} onChange={(event) => applyRedisUrl(event.target.value)} placeholder="redis://user:pass@127.0.0.1:6379/0" />
            </label>
            <label>Name<input value={connectionForm.name} onChange={(event) => setConnectionForm((s) => ({ ...s, name: event.target.value }))} /></label>
            <label>Host<input value={connectionForm.host} onChange={(event) => setConnectionForm((s) => ({ ...s, host: event.target.value }))} /></label>
            <label>Port<input type="number" min={1} max={65535} value={connectionForm.port} onChange={(event) => setConnectionForm((s) => ({ ...s, port: event.target.value }))} /></label>
            <label>Database<input type="number" min={0} value={connectionForm.database} onChange={(event) => setConnectionForm((s) => ({ ...s, database: event.target.value }))} /></label>
            <label>Username<input value={connectionForm.username} onChange={(event) => setConnectionForm((s) => ({ ...s, username: event.target.value }))} /></label>
            <label>Password<input type="password" value={connectionForm.password} onChange={(event) => setConnectionForm((s) => ({ ...s, password: event.target.value }))} /></label>
            <label className="connection-checkbox"><input type="checkbox" checked={connectionForm.tlsEnabled} onChange={(event) => setConnectionForm((s) => ({ ...s, tlsEnabled: event.target.checked }))} />TLS Enabled</label>
            <label className="connection-checkbox"><input type="checkbox" checked={connectionForm.tlsAllowSelfSigned} onChange={(event) => setConnectionForm((s) => ({ ...s, tlsAllowSelfSigned: event.target.checked }))} disabled={!connectionForm.tlsEnabled} />Allow Self-Signed Cert</label>
          </div>
          <div className="connection-actions">
            <Button onClick={handleTestConnection} icon={<RefreshCw size={15} />} ariaLabel="Test connection">{isTestingConnection ? "Testing..." : "Test"}</Button>
            <Button onClick={handleCreateConnection} icon={<Plus size={15} />} ariaLabel="Save connection">{isSavingConnection ? "Saving..." : "Save + Connect"}</Button>
          </div>
          {connectionStatus ? <p className="connection-status">{connectionStatus}</p> : null}
          {connectionError ? <p className="connection-error">{connectionError}</p> : null}
        </Panel>

        <Panel className="saved-connections-panel">
          <div className="panel-header"><h2>Saved Connections</h2></div>
          <div className="saved-connections-list">
            {profiles.length === 0 ? <p className="empty-copy">No saved connections yet.</p> : profiles.map((profile) => (
              <button
                className={activeProfileId === profile.id ? "saved-connection-row active" : "saved-connection-row"}
                key={profile.id}
                type="button"
                onClick={() => {
                  onClearError();
                  onOpenProfile(profile.id);
                }}
              >
                <span>
                  <strong>{profile.name}</strong>
                  <small>{profile.host}:{profile.port}/{profile.database}</small>
                </span>
                <StatusDot label={activeProfileId === profile.id ? "Connected" : "Saved"} tone={activeProfileId === profile.id ? "success" : "muted"} />
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}
