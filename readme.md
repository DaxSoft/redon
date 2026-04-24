# Redon

Redon is a desktop Redis GUI inspector built with Tauri, React, TypeScript, IORedis, Prisma, and SQLite.

## Development

```bash
pnpm install
pnpm desktop:dev
```

## Architecture

The repository follows the modular boundaries described in `ARCHITECTURE.md`:

- `apps/desktop` owns Tauri, route composition, and the app shell.
- `packages/design-system` owns Matrix/terminal design tokens.
- `packages/ui` owns reusable feature-agnostic components.
- `packages/ipc-contracts` owns typed Zod command contracts.
- `packages/local-db` owns Prisma + SQLite persistence.
- `packages/redis-core` owns IORedis access.
- Feature packages own Redis-specific product areas.
