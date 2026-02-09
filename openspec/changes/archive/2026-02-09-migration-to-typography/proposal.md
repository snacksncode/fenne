# Proposal: Migration to Typography

## Why

The `<Typography />` component and its spec already exist, but only 3 files use it. The remaining 34 files still set `fontFamily: 'Satoshi-*'` via inline styles or StyleSheet blocks. Migrating everything in one pass lets us verify the variant/weight system works across the full app and catch any oddball sizes that don't map cleanly — faster than drip-feeding it over weeks.

## What Changes

- Migrate all 34 remaining files from `<Text style={{ fontFamily: 'Satoshi-*', ... }}>` to `<Typography variant="..." weight="...">` using the appropriate variant + weight mapping
- Handle the 1 `Animated.Text` edge case in `app/(app)/(tabs)/groceries.tsx`
- Remove unused Satoshi-related entries from `StyleSheet.create` blocks after each file is migrated
- Keep the existing `<Text>` component untouched — it may still be used for non-Satoshi text or as a base

## Capabilities

### New Capabilities

None — the `typography-system` capability already covers the `<Typography />` component and its full API.

### Modified Capabilities

None — no spec-level behavior changes. This is purely an adoption/migration change.

## Impact

- **34 files across `app/` and `components/`** — every file with inline Satoshi font styles:
  - `components/menu/weekly-screen.tsx` (9 instances)
  - `components/recipe-form.tsx` (6 instances)
  - `components/bottomSheets/select-date-range-sheet.tsx` (5 instances)
  - `app/(app)/(tabs)/groceries.tsx` (4 instances, includes Animated.Text)
  - `components/bottomSheets/edit-ingredient-sheet.tsx`, `grocery-item-sheet.tsx`, `schedule-meal-sheet.tsx`, `convert-guest-sheet.tsx` (3 each)
  - `app/(app)/(tabs)/recipes.tsx`, `components/autocomplete-input.tsx` (3 each)
  - 24 remaining files with 1-2 instances each
- **No API changes** — no props, exports, or public interfaces are affected
- **Visual risk** — line height normalization (heading x1.25, body x1.5) will shift ~6 call sites that used non-standard multipliers. These need visual verification during testing.
