# IPC Contracts

## Purpose

Own typed IPC contracts between UI and backend services.

## Responsibilities

- Define command names.
- Validate request and response payloads with Zod.
- Export shared contract types.

## Public API

Exports connection, runtime connection, key summary schemas, and initial command definitions.

## Dependencies

Allowed: Zod and shared errors.

Forbidden: UI, Prisma clients, and Redis clients.

## Usage

Use schemas before crossing the Tauri IPC boundary.

## Design Rules

Every IPC payload must be schema-validated.

## Testing

Run `pnpm --filter @redon/ipc-contracts typecheck`.
