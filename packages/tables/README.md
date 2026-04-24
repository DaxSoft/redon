# Tables

## Purpose

Own table wrapper contracts.

## Responsibilities

- Define shared table models.
- Provide future TanStack Table wrappers.

## Public API

Exports `DataTableColumn`.

## Dependencies

Allowed: table and virtualization libraries.

## Usage

Feature packages use table wrappers from this package.

## Design Rules

Large tables must support virtualized or paginated rendering.

## Testing

Run `pnpm --filter @redon/tables typecheck`.
