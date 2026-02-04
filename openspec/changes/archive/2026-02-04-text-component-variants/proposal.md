# Proposal: Typography System

## Why

Text styling is scattered across 37 files as ad-hoc inline styles — arbitrary combinations of `fontFamily`, `fontSize`, `lineHeight`, and `color`. There's no shared vocabulary for typography, which means every new piece of text invents its own combination. A `<Typography />` component with a closed set of named variants forces consistency and makes styling decisions trivial: pick from the existing system before adding a new variant.

## What Changes

- Create a `<Typography />` component with a `variant` prop using a `{category}-{size}-{weight}` naming convention (e.g. `heading-xl-bold`, `body-base-regular`)
- Catalog the existing font usage across the app to define the initial variant set
- Migrate 2-3 representative files from `<Text style={{...}} />` to `<Typography variant="..." />`
- Leave remaining files for follow-up changes

## Capabilities

### New Capabilities

- `typography-system`: A `<Typography />` component with predefined variant strings covering all app text needs. Two categories (`heading-*`, `body-*`), multiple sizes and weights. Extendable by adding new variants to one place.

### Modified Capabilities

- None — existing `<Text>` is untouched. `<Typography>` is new and will gradually replace it.

## Impact

- `components/Typography.tsx`: New component (copied from `Text.tsx` as base)
- `app/(app)/settings.tsx`: Migrated as sample
- `app/(auth)/index.tsx`: Migrated as sample
- `components/bottomSheets/tutorial-sheet.tsx`: Migrated as sample
