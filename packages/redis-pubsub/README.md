# Redis Pub/Sub

## Purpose

Own Redis Pub/Sub module contracts.

## Responsibilities

- Register Pub/Sub navigation.
- Define the boundary for subscriptions and live messages.

## Public API

Exports `redisPubSubModule`.

## Dependencies

Allowed: UI, charts, IPC contracts, plugin contracts.

## Usage

Register when live Pub/Sub views are implemented.

## Design Rules

High-volume message streams must support pause mode.

## Testing

Run `pnpm --filter @redon/redis-pubsub typecheck`.
