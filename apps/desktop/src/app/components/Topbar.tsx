import { Command, Plus, RefreshCw } from "lucide-react";
import { Badge, Button, CommandInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redon/ui";

interface TopbarProps {
  readonly profiles: ReadonlyArray<{ id: string; name: string }>;
  readonly activeProfileId: string | null;
  readonly onSelectConnection: (id: string) => void;
  readonly onSetConnectionError: () => void;
  readonly onNewConnection: () => void;
}

export function Topbar({ profiles, activeProfileId, onSelectConnection, onSetConnectionError, onNewConnection }: TopbarProps) {
  const selectProps = activeProfileId ? { value: activeProfileId } : {};

  return (
    <header className="topbar">
      <div className="connection-select">
        <span>Connection</span>
        <Select
          {...selectProps}
          onValueChange={(nextId) => {
            onSetConnectionError();
            onSelectConnection(nextId);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Connection" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Badge tone={activeProfileId ? "success" : "muted"}>{activeProfileId ? "Connected" : "Disconnected"}</Badge>
      <div className="latency">
        Latency: <strong>0.00 ms</strong>
      </div>
      <CommandInput icon={<Command size={15} />} placeholder="Quick command or search... Ctrl K" />
      <Button icon={<RefreshCw size={16} />} ariaLabel="Refresh">
        Refresh
      </Button>
      <Button icon={<Plus size={16} />} onClick={onNewConnection}>
        New Connection
      </Button>
    </header>
  );
}
