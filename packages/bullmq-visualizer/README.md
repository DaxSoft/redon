# BullMQ Visualizer

## Purpose

Own BullMQ queue visualization module contracts.

## Responsibilities

- Define queue and job summary models.
- Register BullMQ navigation, routes, and commands.

## Public API

Exports `bullMqModule`, `BullMqQueueSummary`, and `BullMqJobSummary`.

## Dependencies

Allowed: Redis service contracts, UI, charts, tables, and plugin contracts.

Forbidden: core Redis browser ownership.

## Usage

Register in `apps/desktop/src/app/module-registry.ts`.

## Design Rules

Destructive queue actions require confirmation.

## Testing

Run `pnpm --filter @redon/bullmq-visualizer typecheck`.
