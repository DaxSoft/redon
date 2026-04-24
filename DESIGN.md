# Redis GUI Inspector — Design Specification

## 1. Product Direction

### Purpose

Create a production-grade desktop application for inspecting, visualizing, and managing Redis databases. The interface must support general Redis operations and provide specialized, high-quality modules for operational workflows such as BullMQ queue monitoring.

The product should feel like a professional developer/operator tool: dense, fast, precise, modular, and visually distinctive.

### Core Experience Goals

- Connect to one or more Redis instances.
- Inspect keys, values, TTLs, encodings, memory usage, and metadata.
- Visualize Redis health and activity through dashboards, charts, and tables.
- Support all major Redis data types with tailored inspectors.
- Provide first-class BullMQ queue visualization similar in quality to modern workflow dashboards.
- Keep the UI modular so new Redis modules, plugins, or domain-specific visualizers can be added without redesigning the app.

### Visual Direction

The application uses a refined Matrix/terminal-inspired theme. It should look premium and modern, not gimmicky or retro.

The visual language should combine:

- Dark terminal-like surfaces.
- Neon green accent highlights.
- Monospace typography.
- Subtle translucent panels.
- Dense but readable operator dashboards.
- Clean data tables and charts.
- Soft glow effects used sparingly.

---

## 2. Theme Tokens

### Color Palette

```css
:root {
  --color-accent: #1eff5a;
  --color-background: #040805;
  --color-foreground: #b8ffca;

  --color-surface-0: #040805;
  --color-surface-1: #07120a;
  --color-surface-2: #0a1a0f;
  --color-surface-3: #0d2414;

  --color-border-subtle: rgba(30, 255, 90, 0.16);
  --color-border-default: rgba(30, 255, 90, 0.28);
  --color-border-strong: rgba(30, 255, 90, 0.48);

  --color-text-primary: #b8ffca;
  --color-text-secondary: rgba(184, 255, 202, 0.72);
  --color-text-muted: rgba(184, 255, 202, 0.48);
  --color-text-disabled: rgba(184, 255, 202, 0.28);

  --color-success: #1eff5a;
  --color-warning: #ffe66d;
  --color-danger: #ff5f57;
  --color-info: #65d6ff;
  --color-purple: #b47cff;

  --color-glow-accent: rgba(30, 255, 90, 0.28);
  --color-glow-danger: rgba(255, 95, 87, 0.24);
}
```

### Required Theme Values

| Token | Value |
|---|---|
| Accent color | `#1eff5a` |
| Background | `#040805` |
| Foreground | `#b8ffca` |
| UI font | `ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` |

### Color Usage Rules

- Use the accent color only for active states, key metrics, graph lines, primary buttons, focus rings, and important status indicators.
- Use foreground text for important labels and values.
- Use muted foreground for metadata, timestamps, secondary labels, and disabled controls.
- Use red only for destructive actions, failed jobs, failed connections, or critical errors.
- Use yellow only for delayed, warning, pending, retrying, or degraded states.
- Use blue only for active/running states.
- Avoid large solid neon areas. Prefer outlines, glows, small fills, and graph strokes.

---

## 3. Typography

### Font Family

```css
font-family: ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

### Type Scale

| Role | Size | Weight | Usage |
|---|---:|---:|---|
| App title | 16px | 600 | Sidebar app name |
| Page title | 18px–22px | 600 | Main section headings |
| Panel title | 13px–14px | 600 | Card and module headers |
| Body | 12px–13px | 400 | Tables, labels, controls |
| Metadata | 11px–12px | 400 | Timestamps, counts, helper text |
| Metric value | 24px–32px | 500–600 | Dashboard KPI values |
| Code/raw data | 12px–13px | 400 | Redis values, JSON, RESP, logs |

### Typography Rules

- Use tabular numbers for metrics, counts, memory values, and timestamps.
- Keep headings compact and direct.
- Do not use decorative fonts.
- Avoid large marketing-style typography. This is an operator tool.
- Use letter spacing subtly for tiny labels only.

```css
.metric-value,
.table-cell-number,
.timestamp {
  font-variant-numeric: tabular-nums;
}
```

---

## 4. Layout System

### Desktop Window

The app is designed primarily for desktop usage.

Recommended minimum viewport:

```txt
1440 × 900
```

Preferred dashboard viewport:

```txt
1600 × 1000 or wider
```

### Global App Structure

```txt
┌───────────────────────────────────────────────────────────────┐
│ Top Header                                                     │
├───────────────┬───────────────────────────────────────────────┤
│ Sidebar       │ Main Workspace                                │
│               │                                               │
│               │ Dashboard / Explorer / Queue Modules          │
│               │                                               │
└───────────────┴───────────────────────────────────────────────┘
```

### Recommended Dimensions

| Region | Size |
|---|---:|
| Sidebar width | 220px–260px |
| Header height | 64px–76px |
| Main content padding | 16px |
| Card gap | 10px–14px |
| Panel border radius | 8px–12px |
| Table row height | 34px–42px |
| Compact table row height | 28px–32px |

### Grid Rules

- Use a 12-column layout for dashboard areas.
- KPI cards should usually span 2 columns each on wide screens.
- Large charts should span 7–8 columns.
- Supporting breakdown panels should span 4–5 columns.
- Inspector layouts should use resizable split panes.
- Queue dashboards should use a mix of cards, tables, and detail side panels.

---

## 5. Surface and Panel Styling

### Base Surface

```css
.app-root {
  background:
    radial-gradient(circle at 20% 0%, rgba(30, 255, 90, 0.08), transparent 28%),
    radial-gradient(circle at 80% 20%, rgba(30, 255, 90, 0.04), transparent 32%),
    var(--color-background);
  color: var(--color-foreground);
}
```

### Panel Style

```css
.panel {
  background: rgba(7, 18, 10, 0.82);
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  box-shadow:
    0 0 0 1px rgba(30, 255, 90, 0.03),
    0 12px 32px rgba(0, 0, 0, 0.36);
}
```

### Active Panel Style

```css
.panel-active {
  border-color: var(--color-border-strong);
  box-shadow:
    0 0 0 1px rgba(30, 255, 90, 0.16),
    0 0 24px rgba(30, 255, 90, 0.08),
    0 12px 32px rgba(0, 0, 0, 0.42);
}
```

### Glow Rules

- Glow should be subtle and functional.
- Do not apply strong glow to every component.
- Use glow mainly for selected navigation, connected status, active queue, focused input, and critical metric changes.

---

## 6. Sidebar

### Purpose

The sidebar provides primary navigation and connection context.

### Visual Requirements

- Must be translucent/glass-like.
- Must remain readable over the dark background.
- Should use a faint green gradient or blur.
- Active item should glow softly.

```css
.sidebar {
  background: linear-gradient(
    180deg,
    rgba(8, 31, 16, 0.72),
    rgba(4, 8, 5, 0.88)
  );
  backdrop-filter: blur(18px);
  border-right: 1px solid var(--color-border-subtle);
}
```

### Navigation Items

Required navigation entries:

- Overview
- Connections
- Explorer
- Keys
- Types
- Metrics
- Queues
- Streams
- Pub/Sub
- Lua
- Settings

### Sidebar Footer

The sidebar footer should show compact connection metadata:

- Connection name.
- Redis version.
- Uptime.
- Mode.
- Max memory.
- Used memory.
- Connection status.

Example:

```txt
prod-cache-eu
Redis 7.2.4
Uptime 12d 04:21:18
Mode Standalone
Memory 16.0 GB
Used 5.62 GB (35.1%)
● Connected
```

---

## 7. Header Bar

### Required Elements

The top header must include:

- Connection selector.
- Database selector.
- Connection status badge.
- Latency indicator.
- Quick command/search input.
- Refresh button.
- New connection button.
- Actions menu.

### Recommended Structure

```txt
[Connection dropdown] [Status] [Latency] [Command/search] [Refresh] [New Connection] [Actions]
```

### Command Input

The command input should support:

- Redis command execution.
- Key search.
- Navigation commands.
- Command palette shortcut.

Placeholder example:

```txt
> Quick command or search... ⌘K
```

### Breadcrumb / Context Line

Use a terminal-like breadcrumb below or within the header:

```txt
redis://prod-cache-eu:6379/0 > queues > overview
```

---

## 8. Dashboard Overview

### Required KPI Cards

The overview dashboard should include metric cards for:

- Memory Usage.
- Ops/sec.
- Hit Rate.
- Connected Clients.
- Expired Keys.
- Total Keys.

Each KPI card should include:

- Label.
- Main value.
- Delta compared with previous period.
- Optional icon.
- Optional sparkline.
- Optional progress bar.

Example metric card:

```txt
Memory Usage
5.62 GB
35.1% of 16.0 GB
[progress bar]
```

### Dashboard Rules

- Metrics should be glanceable within 1 second.
- Do not overload KPI cards with long descriptions.
- Use sparklines only when trend matters.
- Use consistent units and precision.
- Use tabular numbers.

---

## 9. Data Visualization

### Chart Style

Charts should use:

- Dark grid backgrounds.
- Thin neon green strokes.
- Low-opacity green fills.
- Muted axis labels.
- Tooltips with high contrast.
- Time range controls.

### Redis Activity Chart

Required modes:

- Ops/sec.
- Commands/sec.
- Memory usage.
- Hit rate.
- Network in/out.
- Clients.
- Expired keys.
- Evicted keys.

Recommended time ranges:

```txt
1m | 5m | 15m | 1h | 6h | 24h
```

### Chart Interaction Rules

- Hover should show exact timestamp and value.
- Click and drag may zoom or select a range.
- Double-click may reset zoom.
- Tooltips should not obscure critical data.
- Charts should support paused/live modes.

---

## 10. Redis Data Type Visualization

The app must support specialized views for all major Redis data types.

### Supported Types

| Type | Required Visualization |
|---|---|
| String | Raw value, text, binary-safe view, JSON detection |
| Hash | Field table, search fields, inline edit |
| List | Indexed rows, push/pop controls, pagination |
| Set | Member table, search, add/remove member |
| Sorted Set | Member-score table, rank view, score distribution |
| Stream | Entry timeline, consumer groups, pending entries |
| JSON | Tree view, path inspector, formatted/raw modes |
| Bitmap | Bit inspector, range view, count operations |
| HyperLogLog | Cardinality view, raw metadata |
| Geospatial | Coordinate table, map-ready abstraction, radius query UI |

### Type Distribution Panel

The dashboard should include a compact key type distribution panel.

Required fields:

- Type name.
- Count.
- Percentage.
- Horizontal proportion bar.
- Optional icon.

Example:

```txt
String      1,245,852    50.2%  ████████████
Hash          532,180    21.5%  █████
List          287,640    11.6%  ███
Set           146,251     5.9%  ██
Sorted Set    118,764     4.8%  █
Stream         82,393     3.3%  █
JSON           64,567     2.6%  █
```

---

## 11. Key Browser

### Purpose

The key browser allows users to search, filter, group, inspect, and manage Redis keys.

### Required Features

- Search by pattern.
- Namespace/tree grouping by separator.
- Type badges.
- Key size metadata.
- TTL metadata.
- Memory metadata.
- Pagination or virtual scrolling.
- Refresh current namespace.
- Bulk select.
- Delete selected keys.
- Export selected keys.

### Example Keys

```txt
bull:email
bull:webhook
bull:sync
bull:image
session:user:42
cache:products
stream:orders
rate_limit:api
hash:user:1001
```

### Search Input Placeholder

```txt
Filter keys by pattern...
```

### Key Browser Rules

- Never render extremely large key lists without virtualization.
- Make destructive actions explicit and reversible when possible.
- Use lazy loading for namespace groups.
- Show approximate counts when exact counts are expensive.
- Avoid blocking the UI during scans.

---

## 12. Value Inspector

### Purpose

The value inspector shows the selected key in the best format for its Redis type.

### Required Header Metadata

For every selected key, show:

- Key name.
- Type.
- TTL.
- Size.
- Encoding.
- Last access, when available.
- Memory usage, when available.

### Required Actions

- Edit.
- Copy key.
- Copy value.
- Rename key.
- Delete key.
- Set TTL.
- Persist key.
- Export value.
- Refresh value.

### Required View Modes

- Structured view.
- Raw view.
- JSON view when valid.
- Binary-safe view when needed.

### Hash Inspector Example

```txt
Key: hash:user:1001
Type: Hash
Size: 6 fields
Encoding: ziplist
TTL: -1
Last Access: 2s ago

Field        Type      Value                         Size
id           string    1001                          4 B
email        string    alice@example.com             17 B
name         string    Alice Johnson                 13 B
plan         string    pro                           3 B
created_at   string    2024-05-20T10:15:30Z          20 B
last_login   string    2024-05-24T11:18:05Z          20 B
```

---

## 13. Tables

### Table Design

Tables are a primary UI element and must be dense, readable, and fast.

### Rules

- Use sticky headers where useful.
- Use virtual scrolling for large datasets.
- Use compact row height by default.
- Allow resizing columns.
- Allow sorting where applicable.
- Allow filtering in operational tables.
- Use status pills for categorical states.
- Use monospace tabular numbers for numeric cells.

### Table States

Every table must support:

- Loading.
- Empty.
- Error.
- Partial data.
- Live updating.
- Paused updates.

---

## 14. BullMQ Queue Module

### Product Goal

The BullMQ module should be one of the strongest parts of the application. It should feel like a specialized queue operations dashboard, not just a raw Redis key viewer.

It should provide a modern workflow-monitoring experience inspired by tools such as Trigger.dev while remaining implementation-agnostic.

### Required Queue Overview

The queue dashboard must include:

- Queue list.
- Selected queue detail.
- Job status summary cards.
- Jobs table.
- Worker activity.
- Throughput chart.
- Retry rate chart.
- Failure trend chart.
- Delayed jobs overview.
- Failed jobs triage.
- Job timeline or execution history.

### Queue List Example

```txt
email.send       128/m   2.1%
webhook.retry     86/m   0.8%
sync.contacts     64/m   1.3%
image.process     42/m   3.7%
```

### Required Job Status Cards

- Waiting.
- Active.
- Delayed.
- Completed.
- Failed.

Each card should show:

- Count.
- Delta.
- Small sparkline or bar chart.
- Icon.
- Status color.

Example:

```txt
Waiting
1,248
↑ 128
```

### Jobs Table Columns

Required columns:

- Job ID.
- Name.
- Queue.
- Status.
- Attempts.
- Duration.
- Created At.
- Started At.
- Finished At.
- Worker.

Optional columns:

- Priority.
- Delay.
- Return value preview.
- Error preview.
- Parent job.
- Repeat key.
- Progress.

### Job Status Colors

| Status | Color |
|---|---|
| Waiting | Accent green |
| Active | Info blue |
| Delayed | Warning yellow |
| Completed | Success green |
| Failed | Danger red |
| Retrying | Warning yellow |
| Stalled | Danger red |
| Paused | Muted foreground |

### Queue Metrics Panel

The selected queue should show:

- Throughput.
- Retry rate.
- Failure rate.
- Active workers.
- Average duration.
- P95 duration.
- Oldest waiting job.
- Stalled jobs.

Example:

```txt
Queue Metrics: email.send
Throughput      128 jobs/min
Retry Rate      2.1%
Failure Rate    0.9%
Active Workers  5
Last 5 minutes
```

### Job Detail Drawer

Selecting a job should open a drawer or split panel with:

- Job ID.
- Job name.
- Queue.
- Status.
- Attempts made.
- Max attempts.
- Created timestamp.
- Started timestamp.
- Finished timestamp.
- Duration.
- Delay.
- Priority.
- Progress.
- Payload.
- Return value.
- Stack trace.
- Logs.
- Parent/child relationship.

### BullMQ Actions

The UI should support actions such as:

- Retry failed job.
- Retry selected jobs.
- Promote delayed job.
- Remove job.
- Drain queue.
- Pause queue.
- Resume queue.
- Clean completed jobs.
- Clean failed jobs.
- Export jobs.

### Destructive Action Rules

Destructive queue actions must require confirmation.

Examples:

- Drain queue.
- Clean failed jobs.
- Remove selected jobs.
- Delete queue keys.

Confirmation dialogs should explain what will happen and how many jobs are affected.

---

## 15. Streams Module

### Required Views

- Stream entries table.
- Entry ID timeline.
- Field/value inspector.
- Consumer groups.
- Consumers.
- Pending entries.
- Acknowledge actions.
- Claim actions.

### Stream Table Columns

- Entry ID.
- Timestamp.
- Fields count.
- Consumer group.
- Consumer.
- Pending status.
- Delivery count.

---

## 16. Pub/Sub Module

### Required Features

- Subscribe to channels.
- Pattern subscriptions.
- Live message stream.
- Pause/resume live view.
- Copy/export messages.
- Publish test message.
- Channel activity chart.

### UX Rule

Live Pub/Sub panels must support pause mode to prevent the UI from becoming unreadable under high message volume.

---

## 17. Lua / Scripting Module

### Required Features

- Script editor.
- Saved scripts.
- SHA management.
- Execute script.
- Key arguments input.
- ARGV input.
- Result viewer.
- Execution history.

### Editor Style

- Dark terminal editor.
- Monospace font.
- Line numbers.
- Syntax highlighting.
- Clear output panel.

---

## 18. Connections Module

### Required Fields

A connection profile should support:

- Name.
- Host.
- Port.
- Database index.
- Username.
- Password.
- TLS.
- Sentinel.
- Cluster mode.
- SSH tunnel.
- Connection timeout.
- Command timeout.
- Read-only mode.

### Security Rules

- Never show passwords in plain text by default.
- Allow users to reveal secrets intentionally.
- Store secrets securely using the host operating system’s credential storage when available.
- Support read-only connection mode for production environments.

---

## 19. Interaction States

Every interactive component must define the following states:

- Default.
- Hover.
- Active/pressed.
- Focused.
- Disabled.
- Loading.
- Error.
- Selected.

### Focus Ring

```css
.focus-ring {
  outline: 1px solid var(--color-accent);
  box-shadow: 0 0 0 3px rgba(30, 255, 90, 0.16);
}
```

### Button Rules

- Primary buttons use accent borders and subtle accent fill.
- Secondary buttons use transparent dark surfaces.
- Destructive buttons use danger red only when the action is destructive.
- Icon-only buttons must have accessible labels.

---

## 20. Status System

### Connection Statuses

| Status | Visual |
|---|---|
| Connected | Green dot + badge |
| Connecting | Animated pulse |
| Disconnected | Muted badge |
| Error | Red badge |
| Read-only | Blue or muted badge |
| Degraded | Yellow badge |

### Operational Statuses

Use consistent status pills across queues, jobs, streams, and connections.

```txt
● Connected
● Active
● Waiting
● Delayed
● Completed
● Failed
● Retrying
● Paused
```

---

## 21. Empty, Loading, and Error States

### Empty State Rules

Empty states should be helpful and specific.

Bad:

```txt
No data.
```

Good:

```txt
No keys found for this pattern.
Try a broader search or scan the selected database again.
```

### Loading State Rules

- Use skeleton rows for tables.
- Use shimmer sparingly.
- Preserve layout while loading.
- Do not flash empty states before loading completes.

### Error State Rules

Errors should include:

- What failed.
- Why it might have failed.
- Suggested action.
- Retry control.
- Technical details expandable section.

Example:

```txt
Could not scan keys.
The connection timed out after 10s.

[Retry] [Show details]
```

---

## 22. Modularity and Extension Rules

### Module Definition

Each feature area should be implemented as a module with its own:

- Route or workspace entry.
- Navigation item.
- Data loader.
- State model.
- Panels.
- Actions.
- Permissions/read-only behavior.
- Error states.

### Recommended Module Categories

```txt
core/connections
core/overview
core/key-browser
core/value-inspector
modules/bullmq
modules/streams
modules/pubsub
modules/lua
modules/metrics
modules/plugins
```

### Inspector Plugin Contract

Every Redis type or plugin inspector should define:

- Type matcher.
- Display label.
- Icon.
- Preview renderer.
- Detail renderer.
- Supported actions.
- Safety level.

Example conceptual shape:

```ts
interface ValueInspectorPlugin {
  id: string;
  label: string;
  match(context: KeyContext): boolean;
  renderPreview(context: KeyContext): UIElement;
  renderDetails(context: KeyContext): UIElement;
  actions: InspectorAction[];
  readonlySafe: boolean;
}
```

---

## 23. Responsive Behavior

Although this is a desktop-first application, it should handle smaller windows gracefully.

### Width Behavior

| Width | Behavior |
|---:|---|
| `>= 1440px` | Full dashboard layout |
| `1200px–1439px` | Reduce secondary panels; keep tables readable |
| `900px–1199px` | Collapse sidebar to icons; stack charts |
| `< 900px` | Use single-column workspace; drawers instead of side panels |

### Height Behavior

- Tables should scroll internally.
- Header and sidebar should remain fixed.
- Avoid forcing the whole app into one large document scroll when possible.

---

## 24. Accessibility

### Requirements

- Maintain sufficient text contrast on dark backgrounds.
- All controls must be keyboard accessible.
- All icon-only buttons must include accessible labels.
- Focus states must be visible.
- Avoid relying only on color to communicate state.
- Tables must be screen-reader navigable where possible.
- Live regions should not spam screen readers during high-frequency updates.

### Keyboard Shortcuts

Recommended shortcuts:

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + R` | Refresh current view |
| `Cmd/Ctrl + F` | Focus search/filter |
| `Esc` | Close drawer/dialog |
| `Enter` | Open selected key/job |
| `Delete` | Delete selected item after confirmation |

---

## 25. Performance Rules

### Large Data Handling

- Use Redis `SCAN`, not `KEYS`, for production key browsing.
- Use pagination or virtualization for large key lists.
- Avoid blocking UI during long operations.
- Allow cancellation of expensive operations.
- Debounce search inputs.
- Cache metadata carefully but provide manual refresh.
- Use incremental updates for live dashboards.

### Live Data Rules

- Allow users to pause live updates.
- Use stable row identities in tables.
- Avoid reordering rows unexpectedly while the user is interacting.
- Highlight changed values briefly instead of flashing entire panels.

---

## 26. Copywriting and Naming

### Voice

The product voice should be concise, technical, and direct.

Use:

```txt
Connected
Refresh
New Connection
Actions
Filter keys by pattern...
Retry job
Drain queue
Show details
```

Avoid:

```txt
Oops!
Something magical happened
Let’s get started!
Amazing performance!
```

### Labels

- Use Redis-native naming where appropriate.
- Use BullMQ-native terminology in the queue module.
- Prefer precise labels over friendly vague labels.

---

## 27. Example Main Screen Composition

```txt
Redis Inspector
├── Sidebar
│   ├── Overview
│   ├── Connections
│   ├── Explorer
│   ├── Keys
│   ├── Types
│   ├── Metrics
│   ├── Queues
│   ├── Streams
│   ├── Pub/Sub
│   ├── Lua
│   └── Settings
│
├── Header
│   ├── Connection Selector
│   ├── Connected Badge
│   ├── Latency
│   ├── Quick Command
│   ├── Refresh
│   ├── New Connection
│   └── Actions
│
└── Main Workspace
    ├── KPI Cards
    │   ├── Memory Usage
    │   ├── Ops/sec
    │   ├── Hit Rate
    │   ├── Connected Clients
    │   ├── Expired Keys
    │   └── Total Keys
    │
    ├── Charts
    │   ├── Redis Activity
    │   └── Key Types
    │
    ├── Inspector Area
    │   ├── Key Browser
    │   ├── Value Inspector
    │   └── Raw/JSON Panel
    │
    └── BullMQ Area
        ├── Queue List
        ├── Status Cards
        ├── Jobs Table
        └── Queue Metrics
```

---

## 28. Design Acceptance Checklist

A screen is considered aligned with this design system if it satisfies the following:

- Uses the exact core theme colors.
- Uses the required monospace font stack.
- Has a dark terminal-inspired visual style without sacrificing readability.
- Uses translucent sidebar treatment.
- Uses clear, production-grade spacing and hierarchy.
- Uses compact, readable tables.
- Uses consistent status pills.
- Uses subtle neon green accents, not excessive glow.
- Supports loading, empty, and error states.
- Supports keyboard focus states.
- Uses virtualization or pagination for large data.
- Keeps Redis data type inspectors modular.
- Treats BullMQ as a first-class dashboard module.
- Avoids gimmicky hacker visuals that reduce usability.

---

## 29. Non-Goals

The app should not look like:

- A toy terminal clone.
- A generic admin dashboard with random green colors.
- A marketing landing page.
- A game interface.
- A low-density consumer UI.

The app should feel like:

- A premium database inspector.
- A Redis operations cockpit.
- A developer power tool.
- A queue monitoring console.
- A modular observability surface for Redis-backed systems.
