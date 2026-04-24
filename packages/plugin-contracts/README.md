# Plugin Contracts

## Purpose

Own module and plugin contracts.

## Responsibilities

- Define navigation, route, command, and capability contracts.
- Keep feature registration independent from desktop wiring.

## Public API

Exports `InspectorModuleManifest` and related manifest types.

## Dependencies

No runtime dependencies.

## Usage

Feature packages export a manifest consumed by `apps/desktop`.

## Design Rules

Contracts must stay UI-framework neutral where possible.

## Testing

Run `pnpm --filter @redon/plugin-contracts typecheck`.
