# Redis Metrics

## Purpose

Own Redis health and activity metric module contracts.

## Responsibilities

- Define metric sample shape.
- Register Metrics navigation and commands.

## Public API

Exports `RedisMetricSample` and `redisMetricsModule`.

## Dependencies

Allowed: charts, IPC contracts, plugin contracts.

Forbidden: direct UI shell wiring and direct Prisma access.

## Usage

Register in the desktop module registry.

## Design Rules

Metric polling should be throttled and bounded.

## Testing

Run `pnpm --filter @redon/redis-metrics typecheck`.
