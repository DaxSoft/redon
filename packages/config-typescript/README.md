# TypeScript Config

## Purpose

Own shared TypeScript configuration entrypoints.

## Responsibilities

- Re-export the root strict TypeScript baseline.

## Public API

Exports `@redon/config-typescript/base`.

## Dependencies

No runtime dependencies.

## Usage

Packages can extend this config when published outside the repo root.

## Design Rules

Keep strict type safety enabled.

## Testing

Configuration is verified through package typechecks.
