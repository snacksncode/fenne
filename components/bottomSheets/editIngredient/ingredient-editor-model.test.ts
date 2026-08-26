/// <reference types="jest" />

import {
  ingredientFromProduct,
  productDraftFromForm,
  productFormFromDraft,
  productFormFromQuery,
} from '@/components/bottomSheets/editIngredient/ingredient-editor-model';

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
