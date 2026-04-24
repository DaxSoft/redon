# Errors

## Purpose

Own user-safe Redon error shapes.

## Responsibilities

- Define normalized error envelopes.
- Keep retryability and severity explicit.

## Public API

Exports `RedonErrorEnvelope` and `createRedonError`.

## Dependencies

No runtime dependencies.

## Usage

Return `RedonErrorEnvelope` through IPC failures.

## Design Rules

Messages must avoid credentials and private Redis values.

## Testing

Run `pnpm --filter @redon/errors typecheck`.
