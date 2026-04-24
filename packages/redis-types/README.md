# Redis Types

## Purpose

Own Redis data type inspector definitions.

## Responsibilities

- Define supported Redis type inspectors.
- Keep type-specific detail UI modular.

## Public API

Exports `redisTypeInspectors` and `redisTypesModule`.

## Dependencies

Allowed: IPC contracts and plugin contracts.

Forbidden: direct Redis client access.

## Usage

Feature UI chooses an inspector definition based on key type.

## Design Rules

Large values must be paginated or streamed.

## Testing

Run `pnpm --filter @redon/redis-types typecheck`.
