# Redis Streams

## Purpose

Own Redis Streams module contracts.

## Responsibilities

- Register stream navigation and commands.
- Define the boundary for entries, consumers, and pending views.

## Public API

Exports `redisStreamsModule`.

## Dependencies

Allowed: UI, tables, IPC contracts, plugin contracts.

## Usage

Register the module in the desktop registry when stream views are implemented.

## Design Rules

Live stream views must support pause and bounded pagination.

## Testing

Run `pnpm --filter @redon/redis-streams typecheck`.
