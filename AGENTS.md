# Frontend Agent Guide

## Date Handling

- Reuse the date parsing, formatting, and conversion helpers in `date-tools.ts`.
- If frontend work requires new date-handling behavior, add the reusable helper to `date-tools.ts` instead of implementing date logic inside a component, hook, or feature module.

## Colors

- Frontend colors are declared in `constants/colors.ts`.
- Reuse the color tokens from `constants/colors.ts` instead of hardcoding color values in components, hooks, or feature modules.
- If the frontend needs a new shared color, declare it in `constants/colors.ts` first.

## Forms

- Keep client-side validation aligned with backend domain validation so known-invalid values are rejected before a request.
- Handle structured backend validation errors as part of the form contract. Map field errors to the matching TanStack Form field using its server-error state, and show base/general errors at form level. Do not collapse structured errors into a generic failure message.
- On an invalid submit, scroll the first invalid field into view and focus it when it has an input. Apply this to both client-side validation failures and backend field errors.
- For invalid non-input controls, scroll the control into view and move accessibility focus to it where supported.
- Use `KeyboardAwareScrollView` for scrollable forms with multiple inputs. After validation errors change layout, call `assureFocusedInputVisible()` for the focused field instead of estimating a manual scroll offset. Account for sticky form footers with `extraKeyboardSpace` and use `bottomOffset` only for the desired caret clearance.
