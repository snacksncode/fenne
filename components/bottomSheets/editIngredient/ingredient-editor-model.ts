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
export type ProductMode = 'counted' | 'measured' | 'timed' | 'kitchen_basic';

export type ProductDraftForm = {
  name: string;
  aisle: AisleCategory;
  pack_count: string;
  mode: ProductMode;
  quantity: string;
  unit: Unit;
  reminder_frequency_value: string;
  reminder_frequency_unit: 'days' | 'weeks' | 'months';
};

export const productSummary = (selected: SelectedProduct) => {
  const product = selected.product;
  if (product.is_kitchen_basic) return 'Kitchen basic';
  if (product.reminder_frequency_value && product.reminder_frequency_unit) {
    return `Remind every ${product.reminder_frequency_value} ${product.reminder_frequency_unit}`;
  }
  if (product.quantity && product.unit !== 'count') return `${product.quantity} ${product.unit}`;
  if (product.pack_count) return `Pack of ${product.pack_count}`;
  return 'Counted item';
};

export const ingredientFromProduct = (
  selected: SelectedProduct,
  previous?: IngredientDetailsFormData
): IngredientDetailsFormData => ({
  id: previous?.id ?? nanoid(),
  name: previous?.name_override?.trim() || selected.product.name,
  name_override: previous?.name_override ?? null,
  quantity: previous?.quantity ?? selected.product.quantity?.toString() ?? '1',
  unit: previous?.unit ?? selected.product.unit,
  aisle: selected.product.aisle,
});

export const productFormFromSuggestion = (suggestion: ProductSuggestionDTO): ProductDraftForm => ({
  name: suggestion.name,
  aisle: suggestion.aisle,
  pack_count: '',
  mode: 'counted',
  quantity: '',
  unit: 'g',
  reminder_frequency_value: '1',
  reminder_frequency_unit: 'months',
});

export const productFormFromQuery = (query: string): ProductDraftForm => ({
  name: query.trim(),
  aisle: 'other',
  pack_count: '',
  mode: 'counted',
  quantity: '',
  unit: 'g',
  reminder_frequency_value: '1',
  reminder_frequency_unit: 'months',
});

export const productFormFromDraft = (draft: ProductDraft): ProductDraftForm => {
  const mode: ProductMode = draft.is_kitchen_basic
    ? 'kitchen_basic'
    : draft.reminder_frequency_value && draft.reminder_frequency_unit
      ? 'timed'
      : draft.quantity && draft.unit !== 'count'
        ? 'measured'
        : 'counted';

  return {
    name: draft.name,
    aisle: draft.aisle,
    pack_count: draft.pack_count?.toString() ?? '',
    mode,
    quantity: draft.quantity?.toString() ?? '',
    unit: draft.unit === 'count' ? 'g' : draft.unit,
    reminder_frequency_value: draft.reminder_frequency_value?.toString() ?? '1',
    reminder_frequency_unit: draft.reminder_frequency_unit ?? 'months',
  };
};

export const productDraftFromForm = (form: ProductDraftForm): ProductDraft => {
  const isKitchenBasic = form.mode === 'kitchen_basic';
  const isMeasured = form.mode === 'measured';
  const isTimed = form.mode === 'timed';

  return {
    name: form.name.trim(),
    aisle: isKitchenBasic ? 'other' : form.aisle,
    unit: isMeasured ? form.unit : 'count',
    quantity: isMeasured ? parseLocaleFloat(form.quantity) : null,
    pack_count: isKitchenBasic || form.pack_count.trim() === '' ? null : parseInt(form.pack_count, 10),
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
    pack_count: z.string(),
    mode: z.enum(['counted', 'measured', 'timed', 'kitchen_basic']),
    quantity: z.string(),
    unit: z.custom<Unit>(),
    reminder_frequency_value: z.string(),
    reminder_frequency_unit: z.enum(['days', 'weeks', 'months']),
  })
  .superRefine((value, context) => {
    if (value.mode === 'measured') {
      const quantity = parseLocaleFloat(value.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        context.addIssue({ code: 'custom', path: ['quantity'], message: 'Amount must be greater than 0' });
      }
    }

    if (value.mode === 'timed') {
      const frequency = parseInt(value.reminder_frequency_value, 10);
      if (!Number.isFinite(frequency) || frequency <= 0) {
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
