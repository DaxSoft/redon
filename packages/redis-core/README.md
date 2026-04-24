# Redis Core

## Purpose

Own low-level Redis access through IORedis.

## Responsibilities

- Create IORedis clients.
- Read typed key metadata.
- Provide bounded scan helpers.

## Public API

Exports Redis connection options, client factory, type decoder, and key summary helpers.

## Dependencies

Allowed: IORedis and IPC contract types.

Forbidden: UI, Prisma, and feature modules.

## Usage

Use from service packages or a Node sidecar, not directly from browser UI.

## Design Rules

Use `SCAN`, not `KEYS`, for browsing.

## Testing

Run `pnpm --filter @redon/redis-core typecheck`.
