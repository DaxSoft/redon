# Redis Explorer

## Purpose

Own Redis key browsing and key management UI module contracts.

## Responsibilities

- Register Explorer and Keys navigation.
- Define the module boundary for SCAN-based browsing.

## Public API

Exports `redisExplorerModule`.

## Dependencies

Allowed: UI, tables, IPC contracts, plugin contracts.

Forbidden: direct IORedis client creation and Prisma access.

## Usage

Register in `apps/desktop/src/app/module-registry.ts`.

## Design Rules

Use bounded SCAN and virtualized key lists.

## Testing

Run `pnpm --filter @redon/redis-explorer typecheck`.
