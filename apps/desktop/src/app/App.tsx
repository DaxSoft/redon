import { ConnectionsView } from "./views/ConnectionsView";
import { OverviewView } from "./views/OverviewView";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { useAppController } from "./useAppController";

export function App() {
  const app = useAppController();

  return (
    <div className="app-root">
      <Sidebar view={app.view} setView={app.setView} activeProfile={app.activeProfile ? { name: app.activeProfile.name, host: app.activeProfile.host, port: app.activeProfile.port } : null} />
      <main className="main-shell">
        <Topbar
          profiles={app.redis.profiles.map((profile) => ({ id: profile.id, name: profile.name }))}
          activeProfileId={app.redis.activeProfileId}
          onSetConnectionError={() => app.setConnectionError(null)}
          onSelectConnection={(id) => {
            app.tryOpenSavedConnection(id).catch((error) => {
              app.setConnectionError(error instanceof Error ? error.message : "Could not open selected connection.");
            });
          }}
          onNewConnection={() => app.setView("connections")}
          onRefresh={() => {
            app.handleRefresh().catch((error) => {
              app.setConnectionError(error instanceof Error ? error.message : "Could not refresh data.");
            });
          }}
        />

        {app.redis.activeProfileId ? (
          <div className="breadcrumb">
            redis://{app.activeProfile?.host}:{app.activeProfile?.port}/{app.activeProfile?.database} &gt; {app.view}
          </div>
        ) : null}

        {app.view === "connections" ? (
          <ConnectionsView
            connectionForm={app.connectionForm}
            setConnectionForm={app.setConnectionForm}
            connectionStatus={app.connectionStatus}
            connectionError={app.connectionError}
            isSavingConnection={app.isSavingConnection}
            isTestingConnection={app.isTestingConnection}
            profiles={app.redis.profiles}
            activeProfileId={app.redis.activeProfileId}
            applyRedisUrl={app.applyRedisUrl}
            handleTestConnection={app.handleTestConnection}
            handleCreateConnection={app.handleCreateConnection}
            onClearError={() => app.setConnectionError(null)}
            onOpenProfile={(id) => {
              app.tryOpenSavedConnection(id).catch((error) => {
                app.setConnectionError(error instanceof Error ? error.message : "Could not open selected connection.");
              });
            }}
          />
        ) : (
          <OverviewView
            activeProfileId={app.redis.activeProfileId}
            setViewConnections={() => app.setView("connections")}
            selectedRange={app.selectedRange}
            setSelectedRange={app.setSelectedRange}
            metrics={app.redis.metrics}
            telemetry={app.redis.telemetry}
            keys={app.redis.keys}
            selectedKey={app.redis.selectedKey}
            setSelectedKey={app.redis.setSelectedKey}
            selectedKeyData={app.redis.selectedKeyData}
            fetchKeyData={app.redis.fetchKeyData}
            fetchKeys={app.redis.fetchKeys}
            queues={app.redis.queues}
            selectedQueue={app.redis.selectedQueue}
            setSelectedQueue={app.redis.setSelectedQueue}
            jobs={app.redis.jobs}
            fetchJobs={app.redis.fetchJobs}
          />
        )}
      </main>
    </div>
  );
}
