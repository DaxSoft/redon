# Shell

## Purpose

Own desktop shell composition models.

## Responsibilities

- Define navigation grouping helpers.
- Keep route/module composition outside feature packages.

## Public API

Exports `createModuleNavigation` and shell navigation types.

## Dependencies

Allowed: plugin contracts.

Forbidden: Redis, Prisma, and feature business logic.

## Usage

Use in `apps/desktop` when composing registered modules.

## Design Rules

Shell models should remain presentation-friendly and feature-agnostic.

## Testing

Run `pnpm --filter @redon/shell typecheck`.
