# Design: Typography System

## Context

The app currently uses a thin `<Text>` wrapper (strips `includeFontPadding`) with all typography defined in inline styles or `StyleSheet.create` blocks. There are 96 instances of `fontFamily: 'Satoshi-*'` across 37 files with no shared vocabulary.

## Goals / Non-Goals

**Goals:**

- Single source of truth for all typography sizes and weights
- Type-safe — invalid variant or weight values caught at compile time
- Minimal API — `variant` (size tier), `weight` (font family), `color` (optional), `style` (optional override)
- Backward-compatible — existing `<Text>` stays untouched during gradual migration

**Non-Goals:**

- Migrating all 37 files in this change (follow-up work)
- Removing the existing `<Text>` component
- Extending `TextProps` — keep the API surface small and intentional
- Responsive/dynamic font scaling

## Decisions

### Decision 1: New component, not extended Text

Create `components/Typography.tsx` separately. The existing `<Text>` stays untouched so nothing breaks. Migration happens file-by-file in subsequent changes.

**Rationale:** Avoids a risky big-bang refactor. Files can be migrated incrementally.

### Decision 2: Separate `variant` and `weight` props

`variant` selects a size tier (`heading-xl`, `body-sm`, etc.) which controls `fontSize` and `lineHeight`. `weight` selects the font family (`bold` → `Satoshi-Bold`). These are independent axes — no combinatorial explosion of 32 variant strings.

**Rationale:** 8 size tiers × 4 weights as separate props = 12 values to know. Combined as single strings = 32 variants to scan through. Separate props are easier to use, easier to autocomplete, and make it obvious what each controls.

### Decision 3: Children for content

Use React children for text content (not a `text` prop). This allows nesting `<Typography>` components for inline composition — e.g. coloring one word differently within a sentence.

### Decision 4: `color` prop

Accept an optional `color` prop (string — hex, `colors.*` constant, etc.) that sets text color. Defaults to `colors.brown[900]`. This is a first-class prop — it's the primary way to set color.

### Decision 5: Don't extend TextProps, but pass through `numberOfLines`

The component accepts `variant`, `weight`, `color`, `numberOfLines`, `style`, and `children`. It does NOT extend React Native's full `TextProps` — but `numberOfLines` is passed through because text truncation is a common need and free to support.

**Rationale:** Keeps the API surface small and intentional. Avoids exposing 50+ props that dilute the component's purpose. `numberOfLines` is the exception because it's universally useful for text components.

## Risks / Trade-offs

- **Oddball sizes (10, 11, 13, 15) don't have exact tiers** — adopt to nearest standard (`xs` = 12) during migration and eyeball the diff. Only ~6 instances total.
- **Line height normalization** — the codebase uses 5+ different multipliers for the same font size. Standardizing to heading ×1.25 / body ×1.5 will cause visible shifts at ~10 call sites.
