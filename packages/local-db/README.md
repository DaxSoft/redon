# Local DB

## Purpose

Own Prisma + SQLite local persistence.

## Responsibilities

- Store connection metadata.
- Store UI preferences, recent keys, filters, and module settings.
- Keep Redis values and secrets out of SQLite by default.

## Public API

Exports database configuration helpers. Prisma schema lives in `prisma/schema.prisma`.

## Dependencies

Allowed: Prisma and `@prisma/client`.

Forbidden: Redis networking and UI packages.

## Usage

Set `REDON_DATABASE_URL=file:./redon.db`, then run migrations from this package.

## Design Rules

Only store credential references, not plaintext secrets.

## Testing

Run `pnpm --filter @redon/local-db typecheck`.
