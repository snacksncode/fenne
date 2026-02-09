# Design: Migration to Typography

## Context

The `<Typography />` component exists with 8 variant tiers and 4 weight options. 3 files were migrated in the initial change. 34 files remain, totaling ~79 inline Satoshi font style instances. This is a mechanical migration — the component API is stable and doesn't need changes.

## Goals / Non-Goals

**Goals:**

- Replace every remaining `fontFamily: 'Satoshi-*'` inline style with `<Typography variant="..." weight="...">`
- Resolve all non-standard font sizes to their nearest variant
- Handle the `Animated.Text` edge case in groceries.tsx
- Clean up unused StyleSheet entries after migration

**Non-Goals:**

- Changing the Typography component API
- Adding new variants or weights
- Removing the `<Text>` component (it may still be used for non-Satoshi text)
- Responsive/dynamic font scaling

## Decisions

### Decision 1: Animated.Text → Animated.createAnimatedComponent(Typography)

For `groceries.tsx` where `Animated.Text` is used with Satoshi styles and animated `textStyles`, create a local `AnimatedTypography` using `Animated.createAnimatedComponent(Typography)` and use it as a drop-in replacement.

### Decision 2: Oddball font size mapping

4 non-standard font sizes exist. Resolution:

| Current | File                     | Decision                             | Typography                             |
| ------- | ------------------------ | ------------------------------------ | -------------------------------------- |
| 10      | `ConnectionStatus.tsx`   | Keep exact size via `style` override | `body-xs` + `style={{ fontSize: 10 }}` |
| 11      | `weekly-screen.tsx` (×2) | Roll up                              | `body-xs` (12)                         |
| 13      | `TabBar.tsx`             | Roll up                              | `body-sm` (14)                         |
| 15      | `month.tsx`              | Roll up                              | `body-base` (16)                       |

### Decision 3: Layout styles via `style` prop

Properties not controlled by Typography (`textAlign`, `flex`, `textDecorationLine`, `opacity`, etc.) are passed through the `style` prop. This is the intended escape hatch — no API change needed.

### Decision 4: Line height normalization

Typography enforces heading ×1.25 and body ×1.5 multipliers. Some files use non-standard multipliers (e.g. `16 * 1.25`, `16 * 1.3`). These are accepted as intentional normalization — visual shifts are expected and will be verified during testing.

## Risks / Trade-offs

- **Visual shifts from oddball rounding** — font sizes 11→12, 13→14, 15→16 will be slightly larger. Low risk, 5 call sites total. → Verify visually during testing.
- **Line height changes** — ~6 call sites used non-standard multipliers. → Accept normalization; verify during testing.
- **fontSize 10 override** — Using `style={{ fontSize: 10 }}` on a `body-xs` (12) variant means lineHeight from the variant (12 × 1.5 = 18) may look off at size 10. → Acceptable for a tiny status label.
