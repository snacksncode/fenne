/// <reference types="jest" />

import {
  ingredientFromProduct,
  productDraftSchema,
  productDraftFromForm,
  productFormFromDraft,
  productFormFromQuery,
} from '@/components/bottomSheets/editIngredient/ingredient-editor-model';

import { convertPackSizeInputs } from '@/lib/product-conversions';

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test-id' }));

describe('product tracking form', () => {
  it('defaults new products to tracked by piece', () => {
    const form = productFormFromQuery('Eggs');

    expect(form.mode).toBe('tracked');
    expect(form.unit).toBe('count');
    expect(productDraftFromForm(form)).toMatchObject({ unit: 'count', is_kitchen_basic: false });
  });

  it('keeps the selected tracking unit without asking for a package amount', () => {
    const form = { ...productFormFromQuery('Beef'), unit: 'g' as const };

    expect(productDraftFromForm(form)).toMatchObject({ unit: 'g', is_kitchen_basic: false });
  });

  it('maps both counted and measured products into the same tracked UI mode', () => {
    expect(productFormFromDraft(productDraftFromForm(productFormFromQuery('Eggs'))).mode).toBe('tracked');
    expect(
      productFormFromDraft(productDraftFromForm({ ...productFormFromQuery('Beef'), unit: 'g' })).mode
    ).toBe('tracked');
  });

  it('starts a new ingredient in the product tracking unit', () => {
    const product = productDraftFromForm({ ...productFormFromQuery('Beef'), unit: 'g' });

    expect(ingredientFromProduct({ type: 'draft', product })).toMatchObject({ quantity: '1', unit: 'g' });
  });

  it('resets hidden fields when changing to reminder or kitchen basic', () => {
    const measured = {
      ...productFormFromQuery('Chicken'),
      aisle: 'meat' as const,
      unit: 'g' as const,
    };

    expect(productDraftFromForm({ ...measured, mode: 'timed' })).toMatchObject({
      aisle: 'meat',
      unit: 'count',
    });
    expect(productDraftFromForm({ ...measured, mode: 'kitchen_basic' })).toMatchObject({
      aisle: 'other',
      unit: 'count',
    });
  });
});

describe('pack sizes', () => {
  it('preserves multiple measured sizes through editing', () => {
    const draft = productDraftFromForm({ ...productFormFromQuery('Beef'), unit: 'g', pack_sizes: ['400', '700'] });
    expect(draft.pack_sizes).toEqual([400, 700]);
    expect(productFormFromDraft(draft).pack_sizes).toEqual(['400', '700']);
  });

  it('clears packaging from counted and reminder payloads', () => {
    const form = { ...productFormFromQuery('Beef'), pack_sizes: ['400', '700'] };
    expect(productDraftFromForm(form).pack_sizes).toEqual([]);
    expect(productDraftFromForm({ ...form, unit: 'g', mode: 'timed' }).pack_sizes).toEqual([]);
  });
});

describe('pack size validation and unit changes', () => {
  it('accepts loose purchases and rejects empty, duplicate and over-precise sizes', () => {
    const form = { ...productFormFromQuery('Beef'), unit: 'g' as const };
    expect(productDraftSchema.safeParse(form).success).toBe(true);
    for (const pack_sizes of [[''], ['0'], ['400', '400'], ['0.0001']]) {
      expect(productDraftSchema.safeParse({ ...form, pack_sizes }).success).toBe(false);
    }
  });

  it('converts compatible units and clears incompatible sizes', () => {
    expect(convertPackSizeInputs(['400', '700'], 'g', 'kg')).toEqual(['0.4', '0.7']);
    expect(convertPackSizeInputs(['400'], 'g', 'ml')).toEqual([]);
    expect(convertPackSizeInputs(['400'], 'g', 'count')).toEqual([]);
  });
});
