import {
  AisleCategory,
  IngredientFormData,
  IngredientProductSelection,
  ProductDraft,
  ProductSuggestionDTO,
} from '@/api/types';
import { Unit } from '@/components/bottomSheets/select-unit-sheet';
import { parseLocaleFloat } from '@/utils';
import { nanoid } from 'nanoid/non-secure';
import { z } from 'zod';

export type SelectedProduct = IngredientProductSelection;
export type IngredientDetailsFormData = Omit<IngredientFormData, 'selectedProduct'>;

export type IngredientEditorPhase = 'search' | 'product' | 'ingredient';
export type ProductMode = 'tracked' | 'timed' | 'kitchen_basic';

export type ProductDraftForm = {
  name: string;
  aisle: AisleCategory;
  mode: ProductMode;
  unit: Unit;
  reminder_frequency_value: string;
  reminder_frequency_unit: 'days' | 'weeks' | 'months';
};

export const ingredientFromProduct = (
  selected: SelectedProduct,
  previous?: IngredientDetailsFormData
): IngredientDetailsFormData => ({
  id: previous?.id ?? nanoid(),
  name: previous?.name_override?.trim() || selected.product.name,
  name_override: previous?.name_override ?? null,
  quantity: previous?.quantity ?? '1',
  unit: previous?.unit ?? selected.product.unit,
  aisle: selected.product.aisle,
});

export const productFormFromSuggestion = (suggestion: ProductSuggestionDTO): ProductDraftForm => ({
  name: suggestion.name,
  aisle: suggestion.aisle,
  mode: 'tracked',
  unit: 'count',
  reminder_frequency_value: '1',
  reminder_frequency_unit: 'months',
});

export const productFormFromQuery = (query: string): ProductDraftForm => ({
  name: query.trim(),
  aisle: 'other',
  mode: 'tracked',
  unit: 'count',
  reminder_frequency_value: '1',
  reminder_frequency_unit: 'months',
});

export const productFormFromDraft = (draft: ProductDraft): ProductDraftForm => {
  const mode: ProductMode = draft.is_kitchen_basic
    ? 'kitchen_basic'
    : draft.reminder_frequency_value && draft.reminder_frequency_unit
      ? 'timed'
      : 'tracked';

  return {
    name: draft.name,
    aisle: draft.aisle,
    mode,
    unit: draft.unit,
    reminder_frequency_value: draft.reminder_frequency_value?.toString() ?? '1',
    reminder_frequency_unit: draft.reminder_frequency_unit ?? 'months',
  };
};

export const productDraftFromForm = (form: ProductDraftForm): ProductDraft => {
  const isKitchenBasic = form.mode === 'kitchen_basic';
  const isTracked = form.mode === 'tracked';
  const isTimed = form.mode === 'timed';

  return {
    name: form.name.trim(),
    aisle: isKitchenBasic ? 'other' : form.aisle,
    unit: isTracked ? form.unit : 'count',
    reminder_frequency_value: isTimed ? parseInt(form.reminder_frequency_value, 10) : null,
    reminder_frequency_unit: isTimed ? form.reminder_frequency_unit : null,
    is_kitchen_basic: isKitchenBasic,
    conversions: {},
  };
};

export const emptyProductForm = productFormFromQuery('');

export const emptyIngredientForm = (): IngredientDetailsFormData => ({
  id: nanoid(),
  name: '',
  name_override: null,
  quantity: '1',
  unit: 'count',
  aisle: 'other',
});

export const productDraftSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    aisle: z.custom<AisleCategory>(),
    mode: z.enum(['tracked', 'timed', 'kitchen_basic']),
    unit: z.custom<Unit>(),
    reminder_frequency_value: z.string(),
    reminder_frequency_unit: z.enum(['days', 'weeks', 'months']),
  })
  .superRefine((value, context) => {
    if (value.mode === 'timed') {
      const frequency = value.reminder_frequency_value.trim();
      if (!/^\d+$/.test(frequency) || Number(frequency) <= 0) {
        context.addIssue({
          code: 'custom',
          path: ['reminder_frequency_value'],
          message: 'Reminder frequency must be greater than 0',
        });
      }
    }
  });

export const ingredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_override: z.string().nullable(),
  unit: z.custom<Unit>(),
  aisle: z.custom<AisleCategory>(),
  quantity: z.string().refine((value) => {
    const quantity = parseLocaleFloat(value);
    return Number.isFinite(quantity) && quantity > 0;
  }, 'Quantity must be greater than 0'),
});
