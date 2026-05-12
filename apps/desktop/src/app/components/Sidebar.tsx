import { Panel, StatusDot } from "@redon/ui";
import { navItems, NavView } from "../constants";

interface SidebarProps {
  readonly view: NavView;
  readonly setView: (view: NavView) => void;
  readonly activeProfile: { name: string; host: string; port: number } | null;
}

export function Sidebar({ view, setView, activeProfile }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo.svg" alt="Redon" />
      </div>

      <nav className="nav-list" aria-label="Primary">
        {navItems.map((item) => (
          <button
            className={item.view !== undefined && item.view === view ? "nav-item nav-item-active" : "nav-item"}
            key={item.label}
            onClick={() => {
              if (item.view) setView(item.view);
            }}
            type="button"
          >
            <item.icon aria-hidden size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {activeProfile ? (
        <Panel className="connection-card">
          <div className="connection-name">{activeProfile.name}</div>
          <dl>
            <dt>Host</dt>
            <dd>
              {activeProfile.host}:{activeProfile.port}
            </dd>
            <dt>Mode</dt>
            <dd>Standalone</dd>
          </dl>
          <StatusDot label="Connected" tone="success" />
        </Panel>
      ) : null}
    </aside>
  );
}
