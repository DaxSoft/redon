# Redis Lua

## Purpose

Own Redis Lua scripting module contracts.

## Responsibilities

- Register Lua navigation and commands.
- Define the boundary for saved scripts and execution history.

## Public API

Exports `redisLuaModule`.

## Dependencies

Allowed: UI, IPC contracts, plugin contracts.

## Usage

Register when Lua editing is implemented.

## Design Rules

Script execution must validate keys and arguments before IPC.

## Testing

Run `pnpm --filter @redon/redis-lua typecheck`.
