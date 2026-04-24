# ESLint Config

## Purpose

Own shared ESLint config entrypoints.

## Responsibilities

- Re-export the root strict ESLint config.

## Public API

Exports the shared ESLint config.

## Dependencies

No runtime dependencies.

## Usage

Packages can import this config when isolated.

## Design Rules

Unsafe TypeScript rules stay enabled.

## Testing

Run `pnpm lint`.
