# Redis GUI Inspector — Project Architecture

## 1. Architecture Goals

Build a production-grade desktop Redis GUI inspector with a modular, maintainable architecture.

The application must be:

- **Desktop-first** using **Tauri**.
- **Monorepo-based** using **Turborepo**.
- **Type-safe** with strict TypeScript rules.
- **Redis-native** using **IORedis** as the Redis access layer.
- **Locally persistent** using **Prisma + SQLite**.
- **Feature-modular**, where each major product area lives in its own package.
- **Plugin-friendly**, so specialized visualizers such as BullMQ can be added or removed without coupling the entire app.
- **UI-consistent** using **shadcn/ui** with the Matrix/terminal design system defined in `DESIGN.md`.

The system should separate desktop shell concerns, UI concerns, Redis access, persistence, feature modules, and extension contracts.

---

## 2. Required Technology Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri |
| Frontend runtime | React + TypeScript |
| Build system | Turborepo |
| Package manager | Yarn or pnpm workspace |
| UI primitives | shadcn/ui + Radix UI |
| Styling | Tailwind CSS + CSS variables |
| Redis client | IORedis |
| Local database | SQLite |
| ORM | Prisma |
| Charts | Recharts or lightweight chart package wrapped internally |
| Tables | TanStack Table wrapped internally |
| State | Zustand or equivalent typed store wrapper |
| Validation | Zod |
| Forms | React Hook Form + Zod resolver |
| Testing | Vitest + Testing Library + Playwright |
| Linting | ESLint strict TypeScript config |
| Formatting | Prettier |

---

## 3. Non-Negotiable TypeScript Rules

The project must be configured so that unsafe typing is rejected during development and CI.

### Required Rules

- Never use `any`.
- Never use type assertions/typecasts such as `as SomeType`, except in tightly isolated framework interop files with documented justification.
- Never use `unknown` without narrowing.
- Never suppress TypeScript errors with `@ts-ignore`.
- Avoid `@ts-expect-error`; if absolutely necessary, it must include a comment explaining why.
- All public package APIs must export explicit types.
- All external data must be validated before use.
- All IPC payloads must be schema-validated.
- All Redis command results must be decoded through typed adapters.

### `tsconfig` Baseline

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### ESLint Type Safety Rules

```js
{
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/consistent-type-assertions": [
      "error",
      { "assertionStyle": "never" }
    ],
    "@typescript-eslint/no-unnecessary-type-assertion": "error"
  }
}
```

Framework edge cases must be handled with typed helper functions instead of spreading unsafe casts across the codebase.

---

## 4. Repository Structure

```txt
redon/
├─ apps/
│  └─ desktop/
│     ├─ src/
│     │  ├─ app/
│     │  ├─ layouts/
│     │  ├─ routes/
│     │  ├─ providers/
│     │  └─ main.tsx
│     ├─ src-tauri/
│     │  ├─ src/
│     │  │  ├─ main.rs
│     │  │  ├─ commands/
│     │  │  ├─ state/
│     │  │  └─ security/
│     │  ├─ tauri.conf.json
│     │  └─ Cargo.toml
│     ├─ index.html
│     ├─ package.json
│     └─ README.md
│
├─ packages/
│  ├─ config-typescript/
│  ├─ config-eslint/
│  ├─ config-tailwind/
│  ├─ design-system/
│  ├─ ui/
│  ├─ shell/
│  ├─ ipc-contracts/
│  ├─ local-db/
│  ├─ redis-core/
│  ├─ redis-connections/
│  ├─ redis-explorer/
│  ├─ redis-types/
│  ├─ redis-metrics/
│  ├─ redis-streams/
│  ├─ redis-pubsub/
│  ├─ redis-lua/
│  ├─ bullmq-visualizer/
│  ├─ charts/
│  ├─ tables/
│  ├─ logger/
│  ├─ errors/
│  ├─ utils/
│  └─ plugin-contracts/
│
├─ tooling/
│  ├─ scripts/
│  └─ generators/
│
├─ docs/
│  ├─ REDIS_COMMANDS.md
│  ├─ PLUGINS.md
│  └─ SECURITY.md
│
├─ package.json
├─ turbo.json
├─ tsconfig.base.json
├─ ARCHITECTURE.md
├─ AGENTS.md (as index only)
├─ DESIGN.md
├─ eslint.config.js
└─ README.md
```

---

## 5. Application Boundaries

The project must avoid a single large frontend application that directly talks to Redis everywhere. Instead, each concern has a clear boundary.

```txt
┌──────────────────────────────────────────────────────────────┐
│ apps/desktop                                                  │
│ Tauri desktop shell + route composition                       │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ UI feature packages                                           │
│ redis-explorer, redis-types, redis-metrics, bullmq-visualizer │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ Client contracts                                              │
│ ipc-contracts, plugin-contracts, typed models, Zod schemas    │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ Backend service layer                                         │
│ redis-core, redis-connections, local-db                       │
└───────────────┬──────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│ Infrastructure                                                │
│ IORedis, Prisma, SQLite, Tauri commands                       │
└──────────────────────────────────────────────────────────────┘
```

### Core Rule

Feature packages should not know how Redis connections are physically created, persisted, encrypted, or transported through Tauri. They should call typed service contracts only.

---

## 6. Tauri Desktop Architecture

### Responsibilities of `apps/desktop`

The desktop app owns:

- Tauri app bootstrap.
- Native window configuration.
- Route registration.
- Global providers.
- Theme initialization.
- Command palette registration.
- Keyboard shortcuts.
- Layout composition.
- Native menu integration.
- Tauri command wiring.

It must not contain feature business logic.

### Frontend Composition

```txt
apps/desktop/src/
├─ app/
│  ├─ App.tsx
│  ├─ routes.tsx
│  └─ module-registry.ts
├─ layouts/
│  ├─ DesktopShellLayout.tsx
│  ├─ Sidebar.tsx
│  ├─ TopCommandBar.tsx
│  └─ Workspace.tsx
├─ providers/
│  ├─ ThemeProvider.tsx
│  ├─ QueryProvider.tsx
│  ├─ IpcProvider.tsx
│  └─ ModuleProvider.tsx
└─ main.tsx
```

### Tauri Command Layer

Rust commands should be thin and stable. Complex Redis behavior should live in Node/TypeScript packages if using the Tauri sidecar pattern, or in Rust only if intentionally implemented there.

Recommended approach:

- Keep the UI in React/TypeScript.
- Keep Redis business logic in TypeScript packages.
- Use Tauri for desktop capabilities, secure storage, file system, app lifecycle, and IPC.
- Use a local Node sidecar only if direct Node packages such as IORedis cannot run in the chosen frontend/runtime context.

### Redis Runtime Placement

Because IORedis is a Node.js package, Redis connectivity must not be attempted directly in the browser-like frontend context unless the build/runtime explicitly supports it.

Recommended production architecture:

```txt
React UI
  ↓ typed IPC
Tauri command bridge
  ↓ controlled process boundary
Node service sidecar
  ↓
IORedis
  ↓
Redis server
```

The sidecar owns Redis network operations and exposes typed commands to the frontend through Tauri IPC.

---

## 7. Package Responsibility Map

### `packages/design-system`

Owns design tokens and theme CSS.

Responsibilities:

- Matrix/terminal theme tokens.
- CSS variables.
- Tailwind theme extension.
- Typography rules.
- Surface, glow, border, and state tokens.
- Dark-only theme defaults.

Must include `README.md` explaining:

- Theme token usage.
- How to create themed surfaces.
- How to use accent colors.
- How to keep visual consistency with `DESIGN.md`.

---

### `packages/ui`

Owns reusable UI components built on shadcn/ui.

Responsibilities:

- Buttons.
- Inputs.
- Selects.
- Dialogs.
- Dropdowns.
- Cards.
- Badges.
- Tabs.
- Split panes.
- Empty states.
- Error states.
- Loading skeletons.
- Terminal-style command input.
- App shell primitives.

Rules:

- Components must be generic and feature-agnostic.
- No Redis-specific logic.
- No IORedis imports.
- No Prisma imports.
- No Tauri-specific imports unless isolated in shell primitives.

---

### `packages/shell`

Owns desktop shell UI composition primitives.

Responsibilities:

- Sidebar model.
- Top command bar model.
- Breadcrumbs.
- Workspace panels.
- Module slots.
- Navigation metadata.
- Keyboard shortcut registration interface.

---

### `packages/ipc-contracts`

Owns all typed IPC contracts between UI and backend services.

Responsibilities:

- Request schemas.
- Response schemas.
- Error schemas.
- Command names.
- Event names.
- Zod validators.
- Type-safe IPC client helpers.

Example structure:

```txt
packages/ipc-contracts/src/
├─ commands/
│  ├─ redis-connection.commands.ts
│  ├─ redis-key.commands.ts
│  ├─ redis-metrics.commands.ts
│  └─ bullmq.commands.ts
├─ events/
├─ schemas/
└─ index.ts
```

All IPC payloads must be validated at runtime.

---

### `packages/local-db`

Owns Prisma + SQLite local persistence.

Responsibilities:

- Prisma schema.
- Database migrations.
- Local connection profiles.
- Encrypted credential references.
- UI preferences.
- Recent keys.
- Saved filters.
- Dashboard layouts.
- Plugin/module settings.
- Query history.

Must not contain Redis networking logic.

Recommended Prisma entities:

```prisma
model ConnectionProfile {
  id              String   @id
  name            String
  host            String
  port            Int
  username        String?
  database        Int      @default(0)
  tlsEnabled      Boolean  @default(false)
  credentialRef   String?
  color           String?
  tags            String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AppPreference {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}

model RecentKey {
  id           String   @id
  connectionId String
  database     Int
  keyName      String
  keyType      String?
  openedAt     DateTime @default(now())
}

model SavedFilter {
  id           String   @id
  connectionId String?
  module       String
  name         String
  pattern      String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model ModuleSetting {
  id        String   @id
  moduleId  String
  key       String
  value     String
  updatedAt DateTime @updatedAt
}
```

Sensitive secrets should not be stored as plaintext in SQLite.

---

### `packages/redis-core`

Owns low-level Redis access through IORedis.

Responsibilities:

- IORedis client factory.
- Connection lifecycle.
- Command execution.
- Pipelining helpers.
- Scan helpers.
- Key metadata readers.
- Type detection.
- TTL operations.
- Memory usage operations.
- Safe command result decoding.
- Redis capability detection.
- Cluster/sentinel abstraction if added later.

Public API examples:

```ts
export interface RedisClientHandle {
  readonly connectionId: string;
  readonly database: number;
}

export interface RedisKeySummary {
  readonly key: string;
  readonly type: RedisDataType;
  readonly ttlSeconds: number | null;
  readonly memoryBytes: number | null;
  readonly encoding: string | null;
}
```

The package must wrap raw IORedis responses into typed domain models.

No UI imports are allowed.

---

### `packages/redis-connections`

Owns user-facing connection management.

Responsibilities:

- Create connection profile.
- Edit connection profile.
- Delete connection profile.
- Test connection.
- Open connection.
- Close connection.
- Reconnect.
- Track latency.
- Track connection status.
- Manage selected database.
- Manage connection tags/colors.

Depends on:

- `redis-core`
- `local-db`
- `ipc-contracts`
- `errors`
- `logger`

---

### `packages/redis-explorer`

Owns Redis key browsing and key management UI.

Responsibilities:

- Key tree/list browser.
- Pattern filter.
- SCAN pagination.
- Key search.
- Key metadata panel.
- Rename key.
- Delete key.
- Copy key.
- Set TTL.
- Persist recent keys.

Must support large databases without blocking UI.

Design rules:

- Use virtualized lists for key browsing.
- Never load all keys eagerly.
- Use cursor-based scanning.
- Show progress and partial results.
- Allow stopping long scans.

---

### `packages/redis-types`

Owns Redis data type visualizers/editors.

Supported base types:

- String
- Hash
- List
- Set
- Sorted Set
- Stream
- JSON, if RedisJSON is available

Responsibilities:

- Type-specific inspectors.
- Type-specific editors.
- Raw RESP/JSON preview.
- Field-level table views.
- Pagination for large values.
- Inline copy actions.
- Safe editing flows.
- Validation before write operations.

Suggested internal structure:

```txt
packages/redis-types/src/
├─ string/
├─ hash/
├─ list/
├─ set/
├─ zset/
├─ stream/
├─ json/
├─ shared/
└─ index.ts
```

Each type module should expose a typed inspector registration object.

---

### `packages/redis-metrics`

Owns Redis observability.

Responsibilities:

- INFO command parsing.
- Memory metrics.
- Ops/sec metrics.
- Hit rate metrics.
- Connected clients.
- Expired keys.
- Total keys.
- Command stats.
- Slowlog display.
- Time-series sampling.
- Dashboard KPI cards.

Metrics should be sampled through a controlled polling service and exposed through typed stores/events.

---

### `packages/redis-streams`

Owns stream-specific operations.

Responsibilities:

- Stream entry browser.
- Consumer group list.
- Pending entries list.
- Acknowledge entries.
- Claim entries.
- Add stream entry.
- Delete stream entry.
- Stream lag metrics.

---

### `packages/redis-pubsub`

Owns Pub/Sub inspection.

Responsibilities:

- Subscribe to channels.
- Pattern subscribe.
- Message console.
- Publish test messages.
- Channel metrics.
- Safe unsubscribe lifecycle.

---

### `packages/redis-lua`

Owns Lua script tools.

Responsibilities:

- Script editor.
- Script history.
- SHA cache.
- EVAL/EVALSHA execution.
- Parameter input.
- Result preview.
- Safety warnings.

---

### `packages/bullmq-visualizer`

Owns BullMQ visualization as a connected feature package.

This package must be modular and removable. The main app should register it as a feature module, not hardcode BullMQ behavior into the core Redis explorer.

Responsibilities:

- Discover BullMQ queues.
- Show queue list.
- Show waiting, active, delayed, completed, and failed counts.
- Show jobs table.
- Show job detail drawer.
- Show attempts, timestamps, duration, progress, logs, stack traces, return value, and failed reason.
- Show worker activity.
- Show throughput.
- Show retry rate.
- Show failure trend.
- Support queue pause/resume.
- Support retry job.
- Support promote delayed job.
- Support clean jobs by status.
- Support obliterate queue only behind explicit destructive confirmation.

The UI should be visually inspired by modern workflow tools such as Trigger.dev: clear runs/jobs, strong status pills, timelines, retry visibility, and operational controls.

Suggested structure:

```txt
packages/bullmq-visualizer/src/
├─ module.ts
├─ routes.tsx
├─ components/
│  ├─ BullMqDashboard.tsx
│  ├─ QueueList.tsx
│  ├─ QueueStatusCards.tsx
│  ├─ JobsTable.tsx
│  ├─ JobDetailDrawer.tsx
│  ├─ QueueMetricsPanel.tsx
│  └─ WorkerActivityChart.tsx
├─ services/
│  ├─ bullmq-discovery.service.ts
│  ├─ bullmq-jobs.service.ts
│  └─ bullmq-metrics.service.ts
├─ schemas/
├─ stores/
└─ README.md
```

BullMQ operations should use Redis primitives through `redis-core` or an isolated BullMQ adapter layer. The feature package must not create unrelated connection systems.

---

### `packages/plugin-contracts`

Owns feature module registration contracts.

Responsibilities:

- Module manifest type.
- Navigation item type.
- Route contribution type.
- Command palette contribution type.
- Dashboard widget contribution type.
- Inspector contribution type.
- Settings contribution type.
- Permission/capability declaration.

Example:

```ts
export interface InspectorModuleManifest {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly navigation?: readonly NavigationContribution[];
  readonly routes?: readonly RouteContribution[];
  readonly commands?: readonly CommandContribution[];
  readonly widgets?: readonly DashboardWidgetContribution[];
  readonly requiredCapabilities?: readonly RedisCapability[];
}
```

This contract is what enables BullMQ and future modules to connect cleanly into the app.

---

### `packages/charts`

Owns chart wrappers.

Responsibilities:

- Matrix-themed line chart.
- Area chart.
- Sparkline.
- Bar chart.
- Timeline chart.
- Status distribution chart.
- Empty chart state.

No feature package should import a charting library directly. They should import chart wrappers from this package.

---

### `packages/tables`

Owns table wrappers.

Responsibilities:

- Data table shell.
- Virtualized table.
- Column visibility.
- Sorting.
- Filtering.
- Resizable columns.
- Sticky headers.
- Status cells.
- Copyable cells.

No feature package should implement table infrastructure from scratch.

---

### `packages/errors`

Owns domain error types.

Responsibilities:

- Redis connection errors.
- Redis command errors.
- Local database errors.
- IPC validation errors.
- Module errors.
- User-safe error messages.
- Error classification.

---

### `packages/logger`

Owns structured logging.

Responsibilities:

- UI logs.
- Backend service logs.
- Redis command timing logs.
- Error logs.
- Optional local debug file logs.

Logs must avoid writing credentials or Redis values unless explicitly allowed in debug mode.

---

## 8. Package README Requirement

Every package must include a `README.md` with this structure:

```md
# Package Name

## Purpose

What this package owns.

## Responsibilities

- Responsibility 1
- Responsibility 2

## Public API

Document exported functions, components, types, and contracts.

## Dependencies

Allowed package dependencies and forbidden dependencies.

## Usage

Example usage from another package.

## Design Rules

Rules specific to this package.

## Testing

How to test the package.
```

A package should be small enough that its README can clearly describe its entire responsibility.

---

## 9. Module Registration System

Feature packages should register themselves using a module manifest.

Example:

```ts
export const bullMqModule: InspectorModuleManifest = {
  id: "bullmq-visualizer",
  name: "BullMQ Visualizer",
  version: "1.0.0",
  navigation: [
    {
      id: "queues",
      label: "Queues",
      icon: "ListTree",
      route: "/queues"
    }
  ],
  routes: [
    {
      path: "/queues",
      componentId: "bullmq.dashboard"
    }
  ],
  commands: [
    {
      id: "bullmq.refresh",
      title: "Refresh BullMQ queues"
    }
  ]
};
```

The desktop app composes modules from a central registry:

```txt
apps/desktop/src/app/module-registry.ts
```

The registry should be the only place where feature modules are wired into the shell.

---

## 10. Data Flow

### UI Read Flow

```txt
Component
  ↓
Feature hook/store
  ↓
Typed IPC client
  ↓
Tauri command bridge
  ↓
Redis service package
  ↓
IORedis
  ↓
Redis server
```

### UI Write Flow

```txt
User action
  ↓
Confirmation/validation when required
  ↓
Zod request schema
  ↓
Typed IPC command
  ↓
Service method
  ↓
IORedis command/pipeline
  ↓
Typed result decoder
  ↓
UI cache/store invalidation
  ↓
Toast/activity log update
```

### Local Persistence Flow

```txt
UI preference/action
  ↓
Typed IPC command
  ↓
local-db service
  ↓
Prisma
  ↓
SQLite database
```

---

## 11. Redis Connection Model

### Connection Profile

A connection profile is local metadata used to open a Redis connection.

```ts
export interface ConnectionProfile {
  readonly id: string;
  readonly name: string;
  readonly host: string;
  readonly port: number;
  readonly username: string | null;
  readonly database: number;
  readonly tlsEnabled: boolean;
  readonly credentialRef: string | null;
  readonly color: string | null;
  readonly tags: readonly string[];
}
```

### Runtime Connection

A runtime connection is an active process-level resource.

```ts
export interface RuntimeRedisConnection {
  readonly id: string;
  readonly profileId: string;
  readonly database: number;
  readonly status: RedisConnectionStatus;
  readonly latencyMs: number | null;
  readonly openedAt: Date;
}
```

### Connection States

```txt
idle
connecting
connected
degraded
reconnecting
disconnected
failed
```

### Rules

- UI should never receive raw Redis client instances.
- Feature modules identify the current Redis connection by connection ID.
- Multiple Redis connections must be supported.
- Future support for cluster and sentinel should not require rewriting feature modules.

---

## 12. Redis Command Strategy

### General Rules

- Prefer safe, bounded operations.
- Never call `KEYS *` on production databases.
- Use `SCAN` for key browsing.
- Use pagination for large collections.
- Use pipelining only when bounded.
- Provide cancellation for long-running scans.
- Show warnings for destructive operations.
- Classify commands by risk level.

### Command Risk Levels

```txt
safe-read       INFO, TYPE, TTL, MEMORY USAGE, HGETALL with limit strategy
bounded-read    SCAN, XRANGE, LRANGE, ZRANGE with explicit limits
write           SET, HSET, DEL, EXPIRE, XADD
admin           FLUSHDB, FLUSHALL, CONFIG, CLIENT KILL
unsafe          KEYS, EVAL without guardrails, unbounded reads
```

Admin and unsafe commands should be disabled by default unless explicitly enabled in settings.

---

## 13. Redis Data Type Inspectors

Each Redis data type must be implemented as a module inside `redis-types`.

### Inspector Contract

```ts
export interface RedisTypeInspectorDefinition {
  readonly type: RedisDataType;
  readonly label: string;
  readonly supportsPagination: boolean;
  readonly supportsInlineEdit: boolean;
  readonly componentId: string;
}
```

### Required Inspectors

| Type | View |
|---|---|
| String | Text/code/raw viewer with size and encoding |
| Hash | Field/value table with field search |
| List | Indexed row table with range pagination |
| Set | Member table with search and pagination |
| Sorted Set | Member/score table with sorting |
| Stream | Entry table with ID, fields, consumer group context |
| JSON | Tree viewer + raw JSON viewer |

Large values must be streamed or paginated where possible.

---

## 14. BullMQ Architecture

BullMQ support must be implemented as a connected module, not as core Redis behavior.

### BullMQ Module Boundaries

```txt
bullmq-visualizer
  ├─ UI components
  ├─ BullMQ-specific schemas
  ├─ BullMQ queue discovery
  ├─ Job querying
  ├─ Queue metrics
  └─ Queue actions

redis-core
  └─ Low-level Redis commands and connection handles
```

### BullMQ Domain Models

```ts
export interface BullMqQueueSummary {
  readonly name: string;
  readonly prefix: string;
  readonly waiting: number;
  readonly active: number;
  readonly delayed: number;
  readonly completed: number;
  readonly failed: number;
  readonly paused: boolean;
}

export interface BullMqJobSummary {
  readonly id: string;
  readonly queueName: string;
  readonly name: string;
  readonly status: BullMqJobStatus;
  readonly attemptsMade: number;
  readonly attemptsLimit: number | null;
  readonly progress: number | null;
  readonly createdAt: Date | null;
  readonly processedAt: Date | null;
  readonly finishedAt: Date | null;
  readonly durationMs: number | null;
}
```

### Required BullMQ Views

- Queue overview.
- Queue list.
- Status cards.
- Jobs table.
- Job detail drawer.
- Job timeline.
- Worker activity.
- Retry/failure metrics.
- Throughput sparkline.

### BullMQ Destructive Actions

The following require explicit confirmation:

- Delete job.
- Retry failed job.
- Clean completed/failed jobs.
- Drain queue.
- Obliterate queue.

`Obliterate queue` should require typing the queue name.

---

## 15. UI Architecture

### Layout Shell

The UI follows the design defined in `DESIGN.md`.

Primary regions:

```txt
DesktopShellLayout
├─ Sidebar
├─ TopCommandBar
└─ Workspace
   ├─ Route content
   ├─ Panels
   ├─ Drawers
   └─ Modals
```

### Sidebar

The sidebar is translucent and module-driven.

Navigation items come from:

- Core app routes.
- Registered feature modules.
- User-enabled plugins.

### Top Command Bar

The top command bar owns:

- Current connection selector.
- Connection status.
- Latency.
- Command/search input.
- Refresh action.
- New connection action.
- Context actions menu.

### Workspace

The workspace owns:

- Current route rendering.
- Dashboard panels.
- Split panes.
- Resizable areas.
- Module views.

---

## 16. State Management

State should be separated into four categories.

### 1. Server/Redis State

Use a query/cache layer for Redis reads.

Examples:

- Key summaries.
- Metrics samples.
- Queue summaries.
- Job lists.

### 2. Local Persistent State

Stored in SQLite through Prisma.

Examples:

- Saved connection profiles.
- Recent keys.
- Saved filters.
- UI preferences.
- Module settings.

### 3. UI Ephemeral State

Stored in local stores.

Examples:

- Selected tabs.
- Drawer open state.
- Current split-pane size.
- Temporary filters.
- Hovered chart point.

### 4. Runtime Service State

Owned by backend service layer.

Examples:

- Active Redis clients.
- Subscriptions.
- Running scans.
- Polling tasks.

---

## 17. IPC Contract Design

IPC commands must be explicit, versionable, and typed.

Example command shape:

```ts
export interface IpcCommandDefinition<TRequest, TResponse> {
  readonly name: string;
  readonly requestSchema: z.ZodType<TRequest>;
  readonly responseSchema: z.ZodType<TResponse>;
}
```

Example commands:

```txt
connection.listProfiles
connection.createProfile
connection.test
connection.open
connection.close
redis.scanKeys
redis.getKeySummary
redis.getValue
redis.setTtl
redis.deleteKey
metrics.getSnapshot
metrics.subscribe
bullmq.listQueues
bullmq.listJobs
bullmq.getJob
bullmq.retryJob
bullmq.pauseQueue
bullmq.resumeQueue
```

All IPC errors must use a normalized error envelope.

```ts
export interface IpcErrorEnvelope {
  readonly code: string;
  readonly message: string;
  readonly severity: "info" | "warning" | "error" | "critical";
  readonly retryable: boolean;
}
```

---

## 18. Local Database Architecture

SQLite is used only for local application state. It is not a cache for full Redis data.

### Store Locally

- Connection profiles.
- Secure credential references.
- UI preferences.
- Saved filters.
- Recently opened keys.
- Dashboard layout preferences.
- Query/script history.
- Module settings.

### Do Not Store Locally By Default

- Full Redis key values.
- Redis secrets.
- Queue job payloads.
- Pub/Sub message bodies.
- Lua execution results.

Sensitive or potentially private Redis data must not be persisted unless the user explicitly enables it.

---

## 19. Security Architecture

### Credential Storage

Redis passwords and TLS credentials must not be stored as plaintext in SQLite.

Recommended strategy:

- Store non-sensitive connection metadata in SQLite.
- Store secrets using Tauri-compatible OS secure storage/keychain plugin.
- Store only a `credentialRef` in the Prisma database.

### Safe Defaults

- Disable dangerous commands by default.
- Warn before writes.
- Confirm destructive operations.
- Mask credentials in logs.
- Never include password fields in telemetry or debug exports.
- Do not persist Redis values unless the user explicitly chooses to.

### Command Permissions

Each feature module should declare required command capabilities.

Example:

```ts
export type RedisCommandCapability =
  | "redis.read"
  | "redis.write"
  | "redis.admin"
  | "redis.pubsub"
  | "redis.lua"
  | "bullmq.manage";
```

---

## 20. Performance Architecture

### Redis Performance Rules

- Use `SCAN`, not `KEYS`.
- Use cursor pagination.
- Use bounded ranges for lists, sorted sets, streams, and logs.
- Avoid huge `HGETALL` calls on massive hashes unless the user confirms or pagination strategy is available.
- Debounce search inputs.
- Throttle metric polling.
- Cancel stale requests when changing connection or route.

### UI Performance Rules

- Use virtualized lists and tables.
- Avoid re-rendering full dashboards on every metric tick.
- Use memoized selectors.
- Keep chart sample windows bounded.
- Render large raw values lazily.
- Split heavy feature modules where possible.

### Suggested Polling Defaults

| Data | Default Refresh |
|---|---:|
| Connection latency | 5s |
| Dashboard metrics | 2s–5s |
| BullMQ queue counts | 2s–5s |
| BullMQ jobs table | 3s–10s |
| Key browser scan | user-triggered |
| Pub/Sub messages | live subscription |

---

## 21. Testing Strategy

### Unit Tests

Required for:

- Redis response decoders.
- Prisma repositories.
- IPC schemas.
- BullMQ parsers.
- Type-specific value models.
- Utility functions.

### Component Tests

Required for:

- Key browser.
- Value inspector.
- Queue dashboard.
- Jobs table.
- Connection forms.
- Command bar.

### Integration Tests

Use Docker-based Redis for integration tests.

Test scenarios:

- Connect to Redis.
- Scan keys.
- Read each Redis data type.
- Set TTL.
- Delete test key.
- Inspect streams.
- Inspect BullMQ queues.

### E2E Tests

Use Playwright against the Tauri frontend where possible.

Critical flows:

- Create connection.
- Open connection.
- Browse keys.
- Inspect hash/list/stream.
- Open BullMQ dashboard.
- Inspect failed job.
- Retry job with confirmation.

---

## 22. Build and Workspace Configuration

### Root Scripts

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "format": "prettier --write .",
    "desktop:dev": "turbo run dev --filter=@app/desktop",
    "desktop:build": "turbo run build --filter=@app/desktop"
  }
}
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"]
    }
  }
}
```

---

## 23. Dependency Direction Rules

Allowed dependency direction:

```txt
apps/desktop
  → feature packages
  → shared UI/packages
  → contracts/utils

feature packages
  → ui
  → charts/tables
  → ipc-contracts
  → plugin-contracts

backend/service packages
  → redis-core
  → local-db
  → ipc-contracts
  → logger/errors
```

Forbidden:

- `redis-core` importing UI packages.
- `local-db` importing UI packages.
- `ui` importing Redis packages.
- Feature packages directly creating IORedis clients.
- Feature packages directly opening SQLite connections.
- Desktop app containing feature business logic.

---

## 24. Feature Package Template

Every new feature package should follow this template:

```txt
packages/<feature-name>/
├─ src/
│  ├─ module.ts
│  ├─ routes.tsx
│  ├─ components/
│  ├─ services/
│  ├─ schemas/
│  ├─ stores/
│  ├─ hooks/
│  ├─ types.ts
│  └─ index.ts
├─ README.md
├─ package.json
├─ tsconfig.json
└─ vitest.config.ts
```

### Required Exports

```ts
export { featureModule } from "./module";
export type { FeatureModuleOptions } from "./types";
```

---

## 25. Design System Integration

The architecture must enforce the visual system from `DESIGN.md` through shared packages instead of duplicating CSS in feature modules.

### Required Theme Tokens

```css
--color-accent: #1eff5a;
--color-background: #040805;
--color-foreground: #b8ffca;
--font-ui: ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
```

### UI Rules

- shadcn/ui components must be wrapped in `packages/ui` before broad use.
- Feature packages should use shared `Panel`, `MetricCard`, `DataTable`, `StatusBadge`, `Sparkline`, and `CommandInput` components.
- Feature packages should not define independent themes.
- Matrix/terminal styling must remain consistent across all modules.

---

## 26. Initial Implementation Phases

### Phase 1 — Foundation

- Create Turborepo workspace.
- Create Tauri desktop app.
- Add strict TypeScript config.
- Add ESLint no-unsafe rules.
- Add shadcn/ui setup.
- Add design-system package.
- Add UI package.
- Add Prisma + SQLite package.
- Add IPC contracts package.

### Phase 2 — Redis Core

- Add IORedis service layer.
- Add connection profiles.
- Add connection test/open/close.
- Add key scanning.
- Add key summary.
- Add value readers for String and Hash.

### Phase 3 — Main UI

- Build desktop shell.
- Build translucent sidebar.
- Build top command bar.
- Build overview dashboard.
- Build key browser.
- Build value inspector.

### Phase 4 — Redis Types

- Add List inspector.
- Add Set inspector.
- Add Sorted Set inspector.
- Add Stream inspector.
- Add JSON inspector.
- Add raw value preview.

### Phase 5 — Metrics

- Add INFO parser.
- Add memory/ops/hit-rate cards.
- Add Redis activity chart.
- Add key type distribution.
- Add slowlog viewer.

### Phase 6 — BullMQ Visualizer

- Add BullMQ module manifest.
- Add queue discovery.
- Add queue status cards.
- Add jobs table.
- Add job detail drawer.
- Add worker metrics.
- Add retry/pause/resume actions.

### Phase 7 — Hardening

- Add Docker Redis integration tests.
- Add E2E desktop flows.
- Add secure credential storage.
- Add command capability settings.
- Add performance profiling.
- Add packaging/signing pipeline.

---

## 27. Production Readiness Checklist

### Architecture

- [ ] Each feature is isolated in its own package.
- [ ] Every package has a README.md.
- [ ] Dependency direction rules are enforced.
- [ ] No feature package creates Redis clients directly.
- [ ] No UI package imports Redis or Prisma.

### Type Safety

- [ ] `strict` TypeScript is enabled.
- [ ] `any` is forbidden.
- [ ] Type assertions are forbidden.
- [ ] IPC payloads are schema-validated.
- [ ] Redis responses are decoded into typed models.

### Redis Safety

- [ ] `KEYS *` is not used for browsing.
- [ ] Destructive actions require confirmation.
- [ ] Admin commands are disabled by default.
- [ ] Large reads are paginated or bounded.
- [ ] Long scans can be cancelled.

### Desktop

- [ ] Tauri app builds for target platforms.
- [ ] Secure credential storage is configured.
- [ ] Local SQLite database migrates correctly.
- [ ] App state survives restart.

### UI/UX

- [ ] Theme matches `DESIGN.md`.
- [ ] Sidebar is translucent.
- [ ] shadcn/ui is used through shared wrappers.
- [ ] Charts and tables use shared packages.
- [ ] BullMQ dashboard feels first-class, not bolted on.

---

## 28. Core Principle

The app should behave like a modular Redis operating console.

Redis connectivity, local persistence, UI rendering, and feature modules must remain separated. BullMQ is the reference example for the plugin-style architecture: it should feel deeply integrated in the product while remaining technically removable from the core system.
