# Tasks: Typography System

## 1. Create Typography component

- [x] 1.1 Create `components/Typography.tsx` with variant type (`heading-xl` | `heading-lg` | ... | `body-xs`), weight type (`black` | `bold` | `medium` | `regular`), variant-to-style map, weight-to-fontFamily map, and the component itself
- [x] 1.2 Export `TypographyVariant`, `TypographyWeight`, and `Typography` from the module

## 2. Migrate sample files

- [x] 2.1 Migrate `app/(auth)/index.tsx` — replace inline Satoshi styles with `<Typography />` using appropriate variant + weight
- [x] 2.2 Migrate `components/bottomSheets/tutorial-sheet.tsx` — replace inline Satoshi styles with `<Typography />`
- [x] 2.3 Migrate `app/(app)/settings.tsx` — replace inline Satoshi styles with `<Typography />`

## 3. Verify

- [x] 3.1 Run TypeScript compiler to confirm no type errors in changed files
