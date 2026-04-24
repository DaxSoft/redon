# Redis Connections

## Purpose

Own user-facing Redis connection lifecycle services.

## Responsibilities

- Test connection profiles.
- Create runtime Redis clients through `redis-core`.
- Track connection state contracts.

## Public API

Exports `testConnection`, `createRuntimeClient`, and runtime connection types.

## Dependencies

Allowed: redis-core, local-db, ipc-contracts, errors, and logger.

Forbidden: UI packages.

## Usage

Use from a sidecar or Tauri service bridge when opening a connection.

## Design Rules

Secrets are supplied at runtime and should not be persisted here.

## Testing

Run `pnpm --filter @redon/redis-connections typecheck`.
