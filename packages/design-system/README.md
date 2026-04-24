# Design System

## Purpose

Own Matrix/terminal design tokens and global theme CSS.

## Responsibilities

- Export core theme values.
- Provide CSS variables used by all UI packages.
- Keep the app dark-only and consistent with `DESIGN.md`.

## Public API

- `redonTheme`
- `@redon/design-system/styles.css`

## Dependencies

No runtime package dependencies.

## Usage

Import `@redon/design-system/styles.css` once in the desktop entrypoint.

## Design Rules

Use accent green for active states and key metrics. Avoid large solid neon fills.

## Testing

Run `pnpm --filter @redon/design-system typecheck`.
