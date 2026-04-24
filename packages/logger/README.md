# Logger

## Purpose

Own structured logging contracts.

## Responsibilities

- Define log entry shape.
- Avoid leaking secrets through logs.

## Public API

Exports `RedonLogger`, `LogEntry`, and `noopLogger`.

## Dependencies

No runtime dependencies.

## Usage

Inject a `RedonLogger` into service packages.

## Design Rules

Do not log Redis credentials or values by default.

## Testing

Run `pnpm --filter @redon/logger typecheck`.
