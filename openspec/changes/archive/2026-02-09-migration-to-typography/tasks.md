# Tasks: Migration to Typography

## 1. Tab screens

- [x] 1.1 Migrate `app/(app)/(tabs)/recipes.tsx`
- [x] 1.2 Migrate `app/(app)/(tabs)/groceries.tsx` — includes `Animated.Text` edge case: create `AnimatedTypography` via `Animated.createAnimatedComponent(Typography)`

## 2. Core components

- [x] 2.1 Migrate `components/button.tsx`
- [x] 2.2 Migrate `components/input.tsx`
- [x] 2.3 Migrate `components/Select.tsx`
- [x] 2.4 Migrate `components/TabBar.tsx` — oddball fontSize 13 → `body-sm` (14)
- [x] 2.5 Migrate `components/TopTabBar.tsx`
- [x] 2.6 Migrate `components/RouteTitle.tsx`
- [x] 2.7 Migrate `components/ConnectionStatus.tsx` — oddball fontSize 10 → `body-xs` + `style={{ fontSize: 10 }}`
- [x] 2.8 Migrate `components/QueryErrorBoundary.tsx`
- [x] 2.9 Migrate `components/aisle-header.tsx`
- [x] 2.10 Migrate `components/recipe.tsx`
- [x] 2.11 Migrate `components/autocomplete-input.tsx`
- [x] 2.12 Migrate `components/recipe-form.tsx`

## 3. Menu components

- [x] 3.1 Migrate `components/menu/weekly-screen.tsx` — oddball fontSize 11 (×2) → `body-xs` (12)
- [x] 3.2 Migrate `components/menu/monthly-screen.tsx`
- [x] 3.3 Migrate `components/menu/month.tsx` — oddball fontSize 15 → `body-base` (16)
- [x] 3.4 Migrate `components/menu/meal-type-kicker.tsx`

## 4. Bottom sheets

- [x] 4.1 Migrate `components/bottomSheets/convert-guest-sheet.tsx`
- [x] 4.2 Migrate `components/bottomSheets/change-password-sheet.tsx`
- [x] 4.3 Migrate `components/bottomSheets/change-details-sheet.tsx`
- [x] 4.4 Migrate `components/bottomSheets/invite-family-member-sheet.tsx`
- [x] 4.5 Migrate `components/bottomSheets/leave-family-sheet.tsx`
- [x] 4.6 Migrate `components/bottomSheets/edit-calendar-day-sheet.tsx`
- [x] 4.7 Migrate `components/bottomSheets/edit-meal-sheet.tsx`
- [x] 4.8 Migrate `components/bottomSheets/edit-ingredient-sheet.tsx`
- [x] 4.9 Migrate `components/bottomSheets/grocery-item-sheet.tsx`
- [x] 4.10 Migrate `components/bottomSheets/schedule-meal-sheet.tsx`
- [x] 4.11 Migrate `components/bottomSheets/select-date-sheet.tsx`
- [x] 4.12 Migrate `components/bottomSheets/select-date-range-sheet.tsx`
- [x] 4.13 Migrate `components/bottomSheets/select-unit-sheet.tsx`
- [x] 4.14 Migrate `components/bottomSheets/select-category-sheet.tsx`
- [x] 4.15 Migrate `components/bottomSheets/select-restaurant-sheet.tsx`
- [x] 4.16 Migrate `components/bottomSheets/recipe-options-sheet.tsx`

## 5. Cleanup (from code review)

- [x] 5.1 Remove 20 unused `import { Text } from '@/components/Text'` — 16 bottom sheets + 4 menu components (`month.tsx`, `weekly-screen.tsx`, `meal-type-kicker.tsx`, `monthly-screen.tsx`). Verify `Text` is truly unused before removing each.
- [x] 5.2 Fix dead ternary in `components/button.tsx` — `variant={size === 'small' || size === 'pill' ? 'body-base' : 'body-base'}` → `variant="body-base"`
- [x] 5.3 Widen `Typography` style prop type — change `style?: TextStyle` to `style?: StyleProp<TextStyle>` in `components/Typography.tsx`, add `StyleProp` to react-native import
- [x] 5.4 Fix color via style in `components/menu/weekly-screen.tsx` — move `color: colors.brown[700]` from `style` to `color` prop
- [x] 5.5 Remove unused `deleteText` style entry from `app/(app)/(tabs)/groceries.tsx` StyleSheet

## 6. Verify

- [x] 6.1 Run TypeScript compiler to confirm no type errors in changed files

## 7. Post-review fixes (from Oracle code review)

- [x] 7.1 Migrate `app/(auth)/index.tsx` — missed file with `Animated.Text` using `fontFamily: 'Satoshi-Black'` (lines 155-172). Apply same `AnimatedTypography` pattern as groceries.tsx. Note: lineHeight will change from 48 (32 × 1.5) to 40 (32 × 1.25) — requires visual verification on auth/welcome screen.
- [x] 7.2 Delete `components/Text.tsx` — dead code with zero imports across codebase
- [x] 7.3 (Optional) Normalize import path in `components/QueryErrorBoundary.tsx` — change `./Typography` to `@/components/Typography` for consistency
