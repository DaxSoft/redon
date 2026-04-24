# Charts

## Purpose

Own chart wrapper contracts.

## Responsibilities

- Provide shared chart data types.
- Wrap chart libraries before feature packages use them.

## Public API

Exports `ChartPoint`.

## Dependencies

Allowed: chart libraries through wrapper components.

## Usage

Feature packages should import chart wrappers from here.

## Design Rules

Charts use Matrix design tokens and bounded data windows.

## Testing

Run `pnpm --filter @redon/charts typecheck`.
