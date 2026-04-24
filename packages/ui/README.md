# UI

## Purpose

Own generic reusable components for Redon.

## Responsibilities

- Provide feature-agnostic primitives.
- Keep Redis, Prisma, and Tauri out of shared UI.
- Wrap future shadcn/Radix components behind stable exports.

## Public API

Exports `Button`, `Panel`, `Badge`, `StatusDot`, `CommandInput`, `MetricCard`, and `Sparkline`.

## Dependencies

Allowed: React and UI primitive libraries.

Forbidden: Redis, Prisma, feature packages, and direct persistence code.

## Usage

```tsx
<Panel>
  <Button>Refresh</Button>
</Panel>
```

## Design Rules

Components must use the tokens from `@redon/design-system`.

## Testing

Run `pnpm --filter @redon/ui typecheck`.
